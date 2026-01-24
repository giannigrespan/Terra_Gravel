const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Validation rules for user signup
 */
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Must be a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Validation rules for cyclist profile
 */
const cyclistProfileValidation = [
  body('avg_speed_gravel')
    .optional()
    .isFloat({ min: 0, max: 60 })
    .withMessage('Average speed must be between 0 and 60 km/h'),
  body('ride_vibe')
    .isIn(['CHILL', 'SPORT', 'RACE'])
    .withMessage('Ride vibe must be CHILL, SPORT, or RACE'),
  body('bike_type')
    .isIn(['GRAVEL_MUSCLE', 'GRAVEL_EBIKE', 'MTB', 'ROAD'])
    .withMessage('Invalid bike type'),
  body('bio')
    .optional()
    .isLength({ max: 120 })
    .withMessage('Bio must be 120 characters or less'),
  body('max_distance_km')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Max distance must be between 1 and 200 km'),
  body('min_speed_preference')
    .optional()
    .isFloat({ min: 0, max: 60 })
    .withMessage('Min speed preference must be between 0 and 60 km/h'),
  body('max_speed_preference')
    .optional()
    .isFloat({ min: 0, max: 60 })
    .withMessage('Max speed preference must be between 0 and 60 km/h'),
  handleValidationErrors,
];

/**
 * Validation rules for swipe action
 */
const swipeValidation = [
  body('target_id').isUUID().withMessage('Target ID must be a valid UUID'),
  body('action')
    .isIn(['LIKE', 'PASS', 'SUPERLIKE'])
    .withMessage('Action must be LIKE, PASS, or SUPERLIKE'),
  handleValidationErrors,
];

/**
 * Validation rules for ride feedback
 */
const feedbackValidation = [
  body('match_id').isUUID().withMessage('Match ID must be a valid UUID'),
  body('reviewed_id').isUUID().withMessage('Reviewed user ID must be a valid UUID'),
  body('showed_up').isBoolean().withMessage('Showed up must be true or false'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('was_appropriate')
    .optional()
    .isBoolean()
    .withMessage('Was appropriate must be true or false'),
  handleValidationErrors,
];

/**
 * Validation rules for location update
 */
const locationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors,
];

/**
 * Validation rules for UUID params
 */
const uuidParamValidation = [
  param('id').isUUID().withMessage('ID must be a valid UUID'),
  handleValidationErrors,
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Must be a valid email address'),
  handleValidationErrors,
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors,
];

/**
 * Validation rules for email verification
 */
const verifyEmailValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  handleValidationErrors,
];

/**
 * Validation rules for user report
 */
const reportUserValidation = [
  body('reason')
    .isIn(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'NO_SHOW', 'DANGEROUS_BEHAVIOR', 'OTHER'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or less'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  signupValidation,
  loginValidation,
  cyclistProfileValidation,
  swipeValidation,
  feedbackValidation,
  locationValidation,
  uuidParamValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  reportUserValidation,
};
