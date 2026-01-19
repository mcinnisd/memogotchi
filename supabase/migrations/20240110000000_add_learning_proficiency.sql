-- Migration: Add Learning Proficiency Tables
-- Run this in your Supabase SQL Editor

-- Topic Proficiency: Tracks user's skill level per topic
CREATE TABLE IF NOT EXISTS topic_proficiency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    proficiency_score FLOAT NOT NULL DEFAULT 50.0,
    confidence FLOAT NOT NULL DEFAULT 0.3,
    total_reviews INT NOT NULL DEFAULT 0,
    avg_response_time_ms INT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic)
);

-- Review Signals: Detailed tracking of each card interaction
CREATE TABLE IF NOT EXISTS review_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    grade INT NOT NULL,
    response_time_ms INT NOT NULL,
    was_flipped BOOLEAN NOT NULL DEFAULT false,
    card_difficulty INT NOT NULL DEFAULT 5,
    proficiency_at_time FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_topic_proficiency_user_topic ON topic_proficiency(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_review_signals_user ON review_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_review_signals_card ON review_signals(card_id);

-- Add difficulty column to cards table for tracking
ALTER TABLE cards ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT 5;
