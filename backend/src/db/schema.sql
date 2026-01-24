-- TerraGravel Database Schema
-- PostgreSQL 15+ with PostGIS extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Custom ENUM types
CREATE TYPE ride_vibe AS ENUM ('CHILL', 'SPORT', 'RACE');
CREATE TYPE bike_type AS ENUM ('GRAVEL_MUSCLE', 'GRAVEL_EBIKE', 'MTB', 'ROAD');
CREATE TYPE swipe_action AS ENUM ('LIKE', 'PASS', 'SUPERLIKE');
CREATE TYPE match_status AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED');

-- ============================================
-- Table: users
-- Base user authentication and profile
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT, -- Nullable for OAuth-only users
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    -- Approximate location (rounded to 1km for privacy)
    location GEOGRAPHY(POINT, 4326),
    -- OAuth fields
    google_id VARCHAR(255) UNIQUE,
    google_connected BOOLEAN DEFAULT FALSE,
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- ============================================
-- Table: cyclist_profile
-- Cyclist-specific data for matching
-- ============================================
CREATE TABLE cyclist_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- Performance Data
    avg_speed_gravel DECIMAL(4,1),
    avg_speed_updated_at TIMESTAMP,

    -- Preferences
    ride_vibe ride_vibe NOT NULL DEFAULT 'SPORT',
    bike_type bike_type NOT NULL,

    -- Bio
    bio TEXT CHECK (LENGTH(bio) <= 120),

    -- Availability
    available_weekend BOOLEAN DEFAULT TRUE,
    available_weekday BOOLEAN DEFAULT FALSE,

    -- Match Filters/Preferences
    max_distance_km INTEGER DEFAULT 20,
    min_speed_preference DECIMAL(4,1),
    max_speed_preference DECIMAL(4,1),

    -- Strava Integration
    strava_athlete_id BIGINT,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_verified BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cyclist_profile_vibe ON cyclist_profile(ride_vibe);
CREATE INDEX idx_cyclist_profile_bike_type ON cyclist_profile(bike_type);
CREATE INDEX idx_cyclist_profile_avg_speed ON cyclist_profile(avg_speed_gravel);

-- ============================================
-- Table: swipes
-- Swipe interaction history
-- ============================================
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action swipe_action NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: A user can swipe a target only once
    UNIQUE(actor_id, target_id)
);

-- Indexes
CREATE INDEX idx_swipes_actor ON swipes(actor_id, created_at DESC);
CREATE INDEX idx_swipes_target ON swipes(target_id);
CREATE INDEX idx_swipes_action ON swipes(action) WHERE action = 'SUPERLIKE';

-- ============================================
-- Table: matches
-- Mutual matches
-- ============================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status match_status NOT NULL DEFAULT 'ACTIVE',
    matched_at TIMESTAMP DEFAULT NOW(),
    unmatched_at TIMESTAMP,
    unmatched_by UUID REFERENCES users(id),

    -- For sorting recent chats
    last_message_at TIMESTAMP,

    -- Constraint: Avoid duplicate matches (A-B and B-A are the same match)
    CHECK (user_a_id < user_b_id),
    UNIQUE(user_a_id, user_b_id)
);

-- Indexes
CREATE INDEX idx_matches_user_a ON matches(user_a_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_user_b ON matches(user_b_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_last_message ON matches(last_message_at DESC NULLS LAST);

-- ============================================
-- Table: ride_feedback
-- Post-ride rating system (hidden from users)
-- ============================================
CREATE TABLE ride_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Feedback
    showed_up BOOLEAN NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    was_appropriate BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(reviewer_id, reviewed_id, match_id)
);

-- Indexes
CREATE INDEX idx_ride_feedback_reviewed ON ride_feedback(reviewed_id);

-- ============================================
-- Table: recent_rides
-- Recent rides for social proof
-- ============================================
CREATE TABLE recent_rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_name VARCHAR(255),
    distance_km DECIMAL(6,2),
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 4),
    ride_date DATE,
    gpx_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recent_rides_user ON recent_rides(user_id, ride_date DESC);

-- ============================================
-- Table: messages
-- Chat messages between matched users
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================
-- View: user_reputation
-- Calculate user reputation from feedback
-- ============================================
CREATE VIEW user_reputation AS
SELECT
    reviewed_id AS user_id,
    COUNT(*) AS total_feedbacks,
    SUM(CASE WHEN showed_up THEN 1 ELSE 0 END) AS show_count,
    SUM(CASE WHEN NOT showed_up THEN 1 ELSE 0 END) AS no_show_count,
    AVG(rating) AS avg_rating,
    SUM(CASE WHEN NOT was_appropriate THEN 1 ELSE 0 END) AS inappropriate_count
FROM ride_feedback
GROUP BY reviewed_id;

-- ============================================
-- Function: create_match_on_mutual_like
-- Automatically create match when both users like each other
-- ============================================
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    -- If the target already liked the actor
    IF EXISTS (
        SELECT 1 FROM swipes
        WHERE actor_id = NEW.target_id
        AND target_id = NEW.actor_id
        AND action IN ('LIKE', 'SUPERLIKE')
    ) THEN
        -- Create the match (order IDs to respect CHECK constraint)
        INSERT INTO matches (user_a_id, user_b_id)
        VALUES (
            LEAST(NEW.actor_id, NEW.target_id),
            GREATEST(NEW.actor_id, NEW.target_id)
        )
        ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create match on mutual like
CREATE TRIGGER trigger_create_match
AFTER INSERT ON swipes
FOR EACH ROW
WHEN (NEW.action IN ('LIKE', 'SUPERLIKE'))
EXECUTE FUNCTION create_match_on_mutual_like();

-- ============================================
-- Function: update_last_message_at
-- Update match's last_message_at when new message is sent
-- ============================================
CREATE OR REPLACE FUNCTION update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches
    SET last_message_at = NEW.created_at
    WHERE id = NEW.match_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update last_message_at on new message
CREATE TRIGGER trigger_update_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_last_message_at();

-- ============================================
-- Function: update_updated_at
-- Generic function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-update updated_at on users and cyclist_profile
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_cyclist_profile_updated_at
BEFORE UPDATE ON cyclist_profile
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
