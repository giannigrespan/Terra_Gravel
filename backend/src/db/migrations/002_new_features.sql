-- Migration 002: New Features
-- Password Reset, Email Verification, Block/Report, Live Reports, Admin, Search, Activity Feed, Push Notifications
-- Run this migration after schema.sql

-- ============================================
-- Add admin flag to users
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- Table: password_reset_tokens
-- Tokens for password reset flow
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- ============================================
-- Table: email_verification_tokens
-- Tokens for email verification flow
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);

-- ============================================
-- Table: user_blocks
-- Block relationships between users
-- ============================================
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- A user can only block another user once
    UNIQUE(blocker_id, blocked_id),
    -- Cannot block yourself
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- ============================================
-- Table: user_reports
-- Report system for problematic users
-- ============================================
CREATE TYPE report_reason AS ENUM (
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'FAKE_PROFILE',
    'NO_SHOW',
    'DANGEROUS_BEHAVIOR',
    'OTHER'
);

CREATE TYPE report_status AS ENUM (
    'PENDING',
    'REVIEWED',
    'RESOLVED',
    'DISMISSED'
);

CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    description TEXT,
    status report_status DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Cannot report yourself
    CHECK (reporter_id != reported_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at DESC);

-- ============================================
-- Table: live_reports
-- Real-time road condition reports
-- ============================================
CREATE TYPE road_report_type AS ENUM (
    'ROAD_CLOSED',
    'MUD',
    'FALLEN_TREE',
    'DANGEROUS_DOGS',
    'FLOODING',
    'CONSTRUCTION',
    'ICE',
    'GRAVEL_CONDITION',
    'OTHER'
);

CREATE TABLE IF NOT EXISTS live_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type road_report_type NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5) DEFAULT 3,
    -- Photo evidence
    photo_url TEXT,
    -- Validity tracking
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    -- Community validation
    confirmations INTEGER DEFAULT 0,
    denials INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_reports_location ON live_reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_live_reports_active ON live_reports(is_active, expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_live_reports_type ON live_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_live_reports_user ON live_reports(user_id);

-- ============================================
-- Table: live_report_votes
-- User confirmations/denials of live reports
-- ============================================
CREATE TABLE IF NOT EXISTS live_report_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES live_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_confirmation BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_report_votes_report ON live_report_votes(report_id);

-- ============================================
-- Table: device_tokens
-- Push notification device tokens
-- ============================================
CREATE TYPE device_platform AS ENUM ('IOS', 'ANDROID', 'WEB');

CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform device_platform NOT NULL,
    device_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);

-- ============================================
-- Table: activities
-- Activity feed for users
-- ============================================
CREATE TYPE activity_type AS ENUM (
    'NEW_MATCH',
    'NEW_MESSAGE',
    'RIDE_FEEDBACK',
    'PROFILE_UPDATE',
    'NEW_RIDE',
    'STRAVA_CONNECTED',
    'ACHIEVEMENT'
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    -- Related entity (match_id, message_id, etc.)
    related_id UUID,
    -- Related user (for matches, messages)
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Extra data as JSON
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_unread ON activities(user_id) WHERE is_read = FALSE;

-- ============================================
-- Table: notifications
-- Notification queue for push notifications
-- ============================================
CREATE TYPE notification_type AS ENUM (
    'MATCH',
    'MESSAGE',
    'RIDE_REMINDER',
    'FEEDBACK_REQUEST',
    'REPORT_UPDATE',
    'SYSTEM'
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notifications(is_sent) WHERE is_sent = FALSE;

-- ============================================
-- Function: Create activity on new match
-- ============================================
CREATE OR REPLACE FUNCTION create_activity_on_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Create activity for user_a
    INSERT INTO activities (user_id, activity_type, related_id, related_user_id)
    VALUES (NEW.user_a_id, 'NEW_MATCH', NEW.id, NEW.user_b_id);

    -- Create activity for user_b
    INSERT INTO activities (user_id, activity_type, related_id, related_user_id)
    VALUES (NEW.user_b_id, 'NEW_MATCH', NEW.id, NEW.user_a_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for match activity
DROP TRIGGER IF EXISTS trigger_activity_on_match ON matches;
CREATE TRIGGER trigger_activity_on_match
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION create_activity_on_match();

-- ============================================
-- Function: Create activity on new message
-- ============================================
CREATE OR REPLACE FUNCTION create_activity_on_message()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    match_record RECORD;
BEGIN
    -- Get the match to find the recipient
    SELECT * INTO match_record FROM matches WHERE id = NEW.match_id;

    -- Determine recipient (the other user in the match)
    IF match_record.user_a_id = NEW.sender_id THEN
        recipient_id := match_record.user_b_id;
    ELSE
        recipient_id := match_record.user_a_id;
    END IF;

    -- Create activity for recipient
    INSERT INTO activities (user_id, activity_type, related_id, related_user_id)
    VALUES (recipient_id, 'NEW_MESSAGE', NEW.match_id, NEW.sender_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message activity
DROP TRIGGER IF EXISTS trigger_activity_on_message ON messages;
CREATE TRIGGER trigger_activity_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_activity_on_message();

-- ============================================
-- View: user_statistics
-- Aggregated statistics for users
-- ============================================
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id AS user_id,
    -- Match stats
    (SELECT COUNT(*) FROM matches m
     WHERE (m.user_a_id = u.id OR m.user_b_id = u.id) AND m.status = 'ACTIVE') AS active_matches,
    (SELECT COUNT(*) FROM matches m
     WHERE m.user_a_id = u.id OR m.user_b_id = u.id) AS total_matches,
    -- Swipe stats
    (SELECT COUNT(*) FROM swipes s WHERE s.actor_id = u.id) AS total_swipes,
    (SELECT COUNT(*) FROM swipes s WHERE s.actor_id = u.id AND s.action = 'LIKE') AS total_likes,
    (SELECT COUNT(*) FROM swipes s WHERE s.target_id = u.id AND s.action = 'LIKE') AS received_likes,
    -- Message stats
    (SELECT COUNT(*) FROM messages msg WHERE msg.sender_id = u.id) AS messages_sent,
    -- Ride stats
    (SELECT COUNT(*) FROM recent_rides rr WHERE rr.user_id = u.id) AS total_rides,
    (SELECT COALESCE(SUM(rr.distance_km), 0) FROM recent_rides rr WHERE rr.user_id = u.id) AS total_distance_km,
    -- Feedback stats
    (SELECT COALESCE(AVG(rf.rating), 0) FROM ride_feedback rf WHERE rf.reviewed_id = u.id) AS avg_rating,
    (SELECT COUNT(*) FROM ride_feedback rf WHERE rf.reviewed_id = u.id) AS total_feedbacks,
    -- Report stats
    (SELECT COUNT(*) FROM live_reports lr WHERE lr.user_id = u.id AND lr.is_active = TRUE) AS active_reports,
    -- Account age
    u.created_at AS member_since,
    u.last_seen_at
FROM users u;

-- ============================================
-- View: admin_dashboard_stats
-- Global statistics for admin dashboard
-- ============================================
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS total_active_users,
    (SELECT COUNT(*) FROM users WHERE is_banned = TRUE) AS total_banned_users,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') AS new_users_24h,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_7d,
    (SELECT COUNT(*) FROM matches WHERE status = 'ACTIVE') AS total_active_matches,
    (SELECT COUNT(*) FROM matches WHERE matched_at > NOW() - INTERVAL '24 hours') AS new_matches_24h,
    (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') AS messages_24h,
    (SELECT COUNT(*) FROM user_reports WHERE status = 'PENDING') AS pending_reports,
    (SELECT COUNT(*) FROM live_reports WHERE is_active = TRUE) AS active_live_reports,
    (SELECT COUNT(*) FROM swipes WHERE created_at > NOW() - INTERVAL '24 hours') AS swipes_24h;

-- ============================================
-- Cleanup function for expired tokens/reports
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();

    -- Delete expired email verification tokens
    DELETE FROM email_verification_tokens WHERE expires_at < NOW();

    -- Mark expired live reports as inactive
    UPDATE live_reports SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission (run cleanup periodically via cron or scheduled task)
-- SELECT cleanup_expired_data();
