-- Migration 006: Google Business Profile integration
-- Adds fields to store Google Place data for contractor profiles

-- Add Google Places fields to contractors
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS google_review_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS google_reviews JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS google_business_url TEXT,
  ADD COLUMN IF NOT EXISTS google_last_synced_at TIMESTAMPTZ;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_contractors_google_place ON contractors (google_place_id) WHERE google_place_id IS NOT NULL;

COMMENT ON COLUMN contractors.google_place_id IS 'Google Places API Place ID for this business';
COMMENT ON COLUMN contractors.google_rating IS 'Cached Google rating (1-5 scale)';
COMMENT ON COLUMN contractors.google_review_count IS 'Cached total Google review count';
COMMENT ON COLUMN contractors.google_reviews IS 'Cached top 5 Google reviews as JSON array';
COMMENT ON COLUMN contractors.google_business_url IS 'Direct URL to Google Business Profile';
COMMENT ON COLUMN contractors.google_last_synced_at IS 'Last time Google data was refreshed';
