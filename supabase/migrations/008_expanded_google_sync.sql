-- Migration 008: Expanded Google Business Profile sync
-- Adds columns for phone, website, address, hours, photos, business status,
-- editorial summary, and lat/lng from Google Places API

-- Google-sourced phone number
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_phone TEXT;

-- Google-sourced website
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_website TEXT;

-- Google-sourced formatted address
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_formatted_address TEXT;

-- Google operating hours as JSONB (already have operating_hours, this stores Google's raw version)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_hours JSONB;

-- Google photo references as JSONB array of { photo_reference, width, height, attributions }
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_photos JSONB DEFAULT '[]';

-- Business status from Google (OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_business_status TEXT;

-- Google's editorial summary / description
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_editorial_summary TEXT;

-- Latitude / Longitude from Google (separate from PostGIS location)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_lat DOUBLE PRECISION;

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS google_lng DOUBLE PRECISION;

COMMENT ON COLUMN contractors.google_phone IS 'Phone number from Google Business Profile';
COMMENT ON COLUMN contractors.google_website IS 'Website URL from Google Business Profile';
COMMENT ON COLUMN contractors.google_formatted_address IS 'Full formatted address from Google';
COMMENT ON COLUMN contractors.google_hours IS 'Operating hours from Google as JSONB';
COMMENT ON COLUMN contractors.google_photos IS 'Photo references from Google Places API';
COMMENT ON COLUMN contractors.google_business_status IS 'OPERATIONAL, CLOSED_TEMPORARILY, or CLOSED_PERMANENTLY';
COMMENT ON COLUMN contractors.google_editorial_summary IS 'Google editorial summary / AI description of the business';
COMMENT ON COLUMN contractors.google_lat IS 'Latitude from Google geocoding';
COMMENT ON COLUMN contractors.google_lng IS 'Longitude from Google geocoding';
