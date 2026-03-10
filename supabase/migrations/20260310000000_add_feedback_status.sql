-- Migration: Add status to feedbacks
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
