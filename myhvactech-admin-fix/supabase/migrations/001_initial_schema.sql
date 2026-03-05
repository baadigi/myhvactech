-- ============================================
-- MY HVAC TECH — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- CONTRACTORS (the businesses listed)
-- ============================================
CREATE TABLE contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Owner (Supabase Auth user who claimed this listing)
  owner_id UUID REFERENCES auth.users(id),

  -- Basic Info
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly: "abc-hvac-scottsdale"
  description TEXT,
  short_description TEXT, -- 160 chars for meta/cards
  logo_url TEXT,
  cover_image_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,

  -- Address & Geo
  street_address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  location GEOGRAPHY(POINT, 4326), -- PostGIS point for geo queries
  service_radius_miles INT DEFAULT 25,

  -- Business Details
  year_established INT,
  license_number TEXT,
  insurance_verified BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE, -- admin verified badge
  is_claimed BOOLEAN DEFAULT FALSE,  -- claimed by business owner
  is_featured BOOLEAN DEFAULT FALSE, -- paid featured placement

  -- Operating Hours (JSONB for flexibility)
  operating_hours JSONB DEFAULT '{}',
  -- Example: {"mon": {"open": "07:00", "close": "18:00"}, "emergency_24_7": true}

  -- Subscription/Tier
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'bronze', 'silver', 'gold')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',

  -- SEO & Display
  meta_title TEXT,
  meta_description TEXT,

  -- Stats (denormalized for performance)
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  profile_views INT DEFAULT 0,

  -- Full-text search vector (auto-generated)
  fts TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(company_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(state, '')), 'A')
  ) STORED
);

-- Indexes
CREATE INDEX idx_contractors_location ON contractors USING GIST (location);
CREATE INDEX idx_contractors_fts ON contractors USING GIN (fts);
CREATE INDEX idx_contractors_slug ON contractors (slug);
CREATE INDEX idx_contractors_city_state ON contractors (state, city);
CREATE INDEX idx_contractors_tier ON contractors (subscription_tier);
CREATE INDEX idx_contractors_rating ON contractors (avg_rating DESC);
CREATE INDEX idx_contractors_trgm ON contractors USING GIN (company_name gin_trgm_ops);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SERVICES (HVAC specialties)
-- ============================================
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,        -- "Commercial AC Repair"
  slug TEXT UNIQUE NOT NULL, -- "commercial-ac-repair"
  category TEXT NOT NULL,    -- "Installation", "Repair", "Maintenance", "Emergency"
  description TEXT,
  icon TEXT                  -- icon name or SVG
);

-- Junction table: which contractors offer which services
CREATE TABLE contractor_services (
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (contractor_id, service_id)
);

-- ============================================
-- SERVICE AREAS (cities/neighborhoods served)
-- ============================================
CREATE TABLE service_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,        -- "Scottsdale"
  slug TEXT UNIQUE NOT NULL, -- "scottsdale-az"
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  county TEXT,
  location GEOGRAPHY(POINT, 4326),
  population INT,
  meta_title TEXT,
  meta_description TEXT
);

CREATE INDEX idx_service_areas_state ON service_areas (state_abbr);
CREATE INDEX idx_service_areas_location ON service_areas USING GIST (location);

CREATE TABLE contractor_service_areas (
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  service_area_id UUID REFERENCES service_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (contractor_id, service_area_id)
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_name TEXT NOT NULL,
  reviewer_company TEXT, -- B2B: which company they represent
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE, -- verified purchase/service

  -- Contractor response
  response TEXT,
  response_date TIMESTAMPTZ,

  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'removed'))
);

CREATE INDEX idx_reviews_contractor ON reviews (contractor_id);
CREATE INDEX idx_reviews_rating ON reviews (rating);
CREATE INDEX idx_reviews_status ON reviews (status);

-- ============================================
-- PHOTOS / PORTFOLIO
-- ============================================
CREATE TABLE contractor_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  category TEXT CHECK (category IN ('project', 'team', 'equipment', 'before_after')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_contractor ON contractor_photos (contractor_id);

-- ============================================
-- LEADS / INQUIRIES
-- ============================================
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,

  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,

  -- Request details
  service_needed TEXT,
  message TEXT,
  urgency TEXT CHECK (urgency IN ('routine', 'soon', 'emergency')),
  preferred_contact TEXT DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'either')),

  -- Tracking
  source TEXT DEFAULT 'directory', -- "directory", "landing_page", "chatbot"
  landing_page TEXT, -- which page they came from
  ip_address INET,
  user_agent TEXT,

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'sent', 'viewed', 'responded', 'closed')),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- Auto-response tracking
  auto_response_sent BOOLEAN DEFAULT FALSE,
  auto_response_sent_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_contractor ON leads (contractor_id);
CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_created ON leads (created_at DESC);

-- ============================================
-- ANALYTICS EVENTS (aggregate tracking)
-- ============================================
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'profile_view', 'phone_click', 'website_click', 'direction_request', 'form_submit'
  metadata JSONB DEFAULT '{}', -- flexible: source page, referrer, IP-based company lookup, etc.
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_analytics_contractor ON analytics_events (contractor_id);
CREATE INDEX idx_analytics_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_date ON analytics_events (created_at);

-- ============================================
-- MESSAGES (direct messaging)
-- ============================================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  conversation_id UUID NOT NULL, -- groups messages in a thread
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'contractor')),
  sender_id UUID REFERENCES auth.users(id),
  sender_name TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id);
CREATE INDEX idx_messages_contractor ON messages (contractor_id);
CREATE INDEX idx_messages_unread ON messages (contractor_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- SUBSCRIPTION PLANS (config table)
-- ============================================
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,  -- "Bronze", "Silver", "Gold"
  slug TEXT UNIQUE NOT NULL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  price_monthly INT,   -- in cents
  price_annual INT,
  features JSONB DEFAULT '[]',
  max_photos INT DEFAULT 5,
  max_service_areas INT DEFAULT 3,
  featured_placement BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- COUPON CODES
-- ============================================
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  stripe_coupon_id TEXT,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INT,  -- percent or cents
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- BULK IMPORT TRACKING
-- ============================================
CREATE TABLE import_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  filename TEXT,
  total_rows INT,
  imported_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB DEFAULT '[]'
);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Nearby contractors with distance
CREATE OR REPLACE FUNCTION nearby_contractors(
  lat FLOAT,
  lng FLOAT,
  radius_miles INT DEFAULT 25,
  service_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  slug TEXT,
  short_description TEXT,
  logo_url TEXT,
  city TEXT,
  state TEXT,
  avg_rating NUMERIC,
  review_count INT,
  subscription_tier TEXT,
  is_verified BOOLEAN,
  distance_miles FLOAT
)
LANGUAGE sql
AS $$
  SELECT
    c.id, c.company_name, c.slug, c.short_description,
    c.logo_url, c.city, c.state, c.avg_rating, c.review_count,
    c.subscription_tier, c.is_verified,
    (ST_Distance(c.location, ST_Point(lng, lat)::geography) / 1609.34) AS distance_miles
  FROM contractors c
  LEFT JOIN contractor_services cs ON c.id = cs.contractor_id
  LEFT JOIN services s ON cs.service_id = s.id
  WHERE ST_DWithin(
    c.location,
    ST_Point(lng, lat)::geography,
    radius_miles * 1609.34 -- convert miles to meters
  )
  AND (service_filter IS NULL OR s.slug = service_filter)
  AND c.subscription_status != 'cancelled'
  GROUP BY c.id
  ORDER BY
    c.is_featured DESC,         -- featured first
    c.subscription_tier DESC,   -- higher tiers first
    distance_miles ASC;
$$;

-- Full-text search with fuzzy fallback
CREATE OR REPLACE FUNCTION search_contractors(search_term TEXT)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  slug TEXT,
  city TEXT,
  state TEXT,
  avg_rating NUMERIC,
  review_count INT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.company_name, c.slug, c.city, c.state,
    c.avg_rating, c.review_count,
    ts_rank(c.fts, websearch_to_tsquery('english', search_term)) AS rank
  FROM contractors c
  WHERE c.fts @@ websearch_to_tsquery('english', search_term)
     OR c.company_name % search_term -- pg_trgm fuzzy fallback
  ORDER BY rank DESC;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTRACTORS policies
-- ============================================

-- Anyone can read non-cancelled contractors
CREATE POLICY "Public can read active contractors"
  ON contractors FOR SELECT
  USING (subscription_status != 'cancelled');

-- Contractors can update their own listing
CREATE POLICY "Contractors can update own listing"
  ON contractors FOR UPDATE
  USING (owner_id = auth.uid());

-- Contractors can insert their own listing
CREATE POLICY "Contractors can insert own listing"
  ON contractors FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ============================================
-- SERVICES policies
-- ============================================

-- Anyone can read services
CREATE POLICY "Public can read services"
  ON services FOR SELECT
  USING (true);

-- ============================================
-- CONTRACTOR_SERVICES policies
-- ============================================

-- Anyone can read contractor_services
CREATE POLICY "Public can read contractor_services"
  ON contractor_services FOR SELECT
  USING (true);

-- Contractors can manage their own services
CREATE POLICY "Contractors can manage own services"
  ON contractor_services FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- SERVICE_AREAS policies
-- ============================================

-- Anyone can read service areas
CREATE POLICY "Public can read service areas"
  ON service_areas FOR SELECT
  USING (true);

-- ============================================
-- CONTRACTOR_SERVICE_AREAS policies
-- ============================================

-- Anyone can read contractor_service_areas
CREATE POLICY "Public can read contractor_service_areas"
  ON contractor_service_areas FOR SELECT
  USING (true);

-- Contractors can manage their own service areas
CREATE POLICY "Contractors can manage own service areas"
  ON contractor_service_areas FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- REVIEWS policies
-- ============================================

-- Anyone can read approved reviews
CREATE POLICY "Public can read approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can submit reviews
CREATE POLICY "Authenticated users can submit reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Contractors can see all reviews for their listings (including pending)
CREATE POLICY "Contractors can see own listing reviews"
  ON reviews FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- Contractors can respond to reviews on their listings
CREATE POLICY "Contractors can respond to own reviews"
  ON reviews FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- CONTRACTOR_PHOTOS policies
-- ============================================

-- Anyone can read contractor photos
CREATE POLICY "Public can read contractor photos"
  ON contractor_photos FOR SELECT
  USING (true);

-- Contractors can manage their own photos
CREATE POLICY "Contractors can manage own photos"
  ON contractor_photos FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- LEADS policies
-- ============================================

-- Anyone can insert leads (submit inquiries)
CREATE POLICY "Anyone can submit leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Only the contractor can see their own leads
CREATE POLICY "Contractors see own leads"
  ON leads FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- Contractors can update status on their leads
CREATE POLICY "Contractors can update own leads"
  ON leads FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- ANALYTICS_EVENTS policies
-- ============================================

-- Anyone can insert analytics events
CREATE POLICY "Anyone can track events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Contractors can read their own analytics
CREATE POLICY "Contractors can read own analytics"
  ON analytics_events FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- MESSAGES policies
-- ============================================

-- Anyone can insert messages (send)
CREATE POLICY "Anyone can send messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Contractors can read their own messages
CREATE POLICY "Contractors can read own messages"
  ON messages FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- Contractors can update message read status
CREATE POLICY "Contractors can update message read status"
  ON messages FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- SUBSCRIPTION_PLANS policies
-- ============================================

-- Anyone can read active plans
CREATE POLICY "Public can read subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- ============================================
-- COUPONS policies
-- ============================================

-- Active coupons readable by authenticated users
CREATE POLICY "Authenticated can read active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- ============================================
-- IMPORT_BATCHES policies
-- ============================================

-- Only service role (admin) can access import batches
-- No policies = only service role key can access
