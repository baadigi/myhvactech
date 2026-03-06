-- Migration 009: Add scheduled_at column to blog_posts
-- Run this in Supabase SQL editor

ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled 
ON blog_posts (scheduled_at) 
WHERE status = 'draft' AND scheduled_at IS NOT NULL;

COMMENT ON COLUMN blog_posts.scheduled_at IS 'When set, the post auto-publishes at this time via cron';
