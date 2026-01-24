const { query, getClient } = require('../config/database');

/**
 * Submit ride feedback
 * POST /api/v1/ridematch/feedback
 */
const submitFeedback = async (req, res) => {
  const client = await getClient();

  try {
    const reviewerId = req.user.id;
    const { match_id, reviewed_id, showed_up, rating, was_appropriate } = req.body;

    // Verify match exists and user is part of it
    const matchCheck = await query(
      `SELECT user_a_id, user_b_id
       FROM matches
       WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
      [match_id, reviewerId]
    );

    if (matchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found or you are not part of this match',
      });
    }

    const match = matchCheck.rows[0];

    // Verify reviewed_id is the other user in the match
    const otherUserId = match.user_a_id === reviewerId ? match.user_b_id : match.user_a_id;

    if (reviewed_id !== otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reviewed user ID',
      });
    }

    await client.query('BEGIN');

    // Insert feedback
    const result = await client.query(
      `INSERT INTO ride_feedback (match_id, reviewer_id, reviewed_id, showed_up, rating, was_appropriate)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (reviewer_id, reviewed_id, match_id)
       DO UPDATE SET
         showed_up = $4,
         rating = $5,
         was_appropriate = $6,
         created_at = NOW()
       RETURNING *`,
      [match_id, reviewerId, reviewed_id, showed_up, rating, was_appropriate ?? true]
    );

    // Check if user should be flagged (3+ no-shows or inappropriate behavior)
    const reputationCheck = await client.query(
      `SELECT
        no_show_count,
        inappropriate_count,
        avg_rating
       FROM user_reputation
       WHERE user_id = $1`,
      [reviewed_id]
    );

    let warningMessage = null;

    if (reputationCheck.rows.length > 0) {
      const rep = reputationCheck.rows[0];

      if (rep.no_show_count >= 3) {
        // Flag user for review
        await client.query(
          'UPDATE users SET is_active = FALSE WHERE id = $1',
          [reviewed_id]
        );
        warningMessage = 'User has been flagged for excessive no-shows';
      } else if (rep.inappropriate_count >= 1) {
        warningMessage = 'User has been flagged for inappropriate behavior';
      } else if (rep.avg_rating < 2.0) {
        warningMessage = 'User has low average rating';
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      warning: warningMessage,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit feedback error:', error);

    if (error.constraint === 'ride_feedback_reviewer_id_reviewed_id_match_id_key') {
      return res.status(409).json({
        success: false,
        error: 'Feedback already submitted for this ride',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
    });
  } finally {
    client.release();
  }
};

/**
 * Get user reputation (admin/debug endpoint)
 * GET /api/v1/users/:userId/reputation
 */
const getUserReputation = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT * FROM user_reputation WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          user_id: userId,
          total_feedbacks: 0,
          show_count: 0,
          no_show_count: 0,
          avg_rating: null,
          inappropriate_count: 0,
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get reputation error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user reputation',
    });
  }
};

module.exports = {
  submitFeedback,
  getUserReputation,
};
