-- ============================================
-- MY HVAC TECH — Commercial-First Pivot
-- Migration: 002_commercial_first_pivot.sql
-- Adds fields for facility-manager-first UX,
-- commercial verification, quote request flow,
-- lead routing/slots, and nurture tracking.
-- ============================================

-- ============================================
-- CONTRACTORS: Add commercial-specific fields
-- ============================================

-- Commercial verification & experience
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS years_commercial_experience INT,
  ADD COLUMN IF NOT EXISTS commercial_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commercial_verified_at TIMESTAMPTZ,

  -- Equipment & systems serviced
  ADD COLUMN IF NOT EXISTS system_types TEXT[] DEFAULT '{}',
    -- e.g. ['RTU','VRF','chilled_water','split_system','boiler','heat_pump','ahu','cooling_tower']
  ADD COLUMN IF NOT EXISTS brands_serviced TEXT[] DEFAULT '{}',
    -- e.g. ['Carrier','Trane','Daikin','Lennox','York','Mitsubishi']
  ADD COLUMN IF NOT EXISTS tonnage_range_min INT,
  ADD COLUMN IF NOT EXISTS tonnage_range_max INT,

  -- Building types served
  ADD COLUMN IF NOT EXISTS building_types_served TEXT[] DEFAULT '{}',
    -- e.g. ['office','retail','industrial','healthcare','education','hospitality','data_center','multifamily','government']

  -- SLA / Response capabilities
  ADD COLUMN IF NOT EXISTS emergency_response_minutes INT,  -- e.g. 60 = "1-hour response"
  ADD COLUMN IF NOT EXISTS offers_24_7 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sla_summary TEXT,                -- free-text SLA description
  ADD COLUMN IF NOT EXISTS multi_site_coverage BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_sites_supported INT,

  -- Service agreements
  ADD COLUMN IF NOT EXISTS offers_service_agreements BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS service_agreement_types TEXT[] DEFAULT '{}',
    -- e.g. ['preventive_maintenance','full_service','parts_labor','emergency_only']

  -- Tech stack / dispatch
  ADD COLUMN IF NOT EXISTS dispatch_crm TEXT,
    -- e.g. 'ServiceTitan', 'BuildOps', 'FieldEdge', 'Housecall Pro'
  ADD COLUMN IF NOT EXISTS avg_quote_turnaround_hours INT,
  ADD COLUMN IF NOT EXISTS uses_gps_tracking BOOLEAN DEFAULT FALSE,

  -- Team size
  ADD COLUMN IF NOT EXISTS num_technicians INT,
  ADD COLUMN IF NOT EXISTS num_nate_certified INT,

  -- Market slot monetization
  ADD COLUMN IF NOT EXISTS metro_area TEXT,  -- normalized metro name for slot-based routing
  ADD COLUMN IF NOT EXISTS slot_tier TEXT CHECK (slot_tier IN ('standard', 'preferred', 'exclusive'));

-- Index on metro_area for slot queries
CREATE INDEX IF NOT EXISTS idx_contractors_metro ON contractors (metro_area);
-- Index on system types for search filters
CREATE INDEX IF NOT EXISTS idx_contractors_system_types ON contractors USING GIN (system_types);
-- Index on building types for search filters
CREATE INDEX IF NOT EXISTS idx_contractors_building_types ON contractors USING GIN (building_types_served);

-- ============================================
-- SAMPLE PROJECTS (portfolio / proof of work)
-- ============================================
CREATE TABLE IF NOT EXISTS sample_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Project details
  project_name TEXT NOT NULL,
  building_type TEXT NOT NULL,  -- 'office', 'retail', 'industrial', etc.
  description TEXT,
  square_footage INT,
  tonnage INT,
  system_type TEXT,  -- 'RTU', 'VRF', 'chilled_water', etc.
  project_type TEXT CHECK (project_type IN ('new_installation', 'replacement', 'retrofit', 'repair', 'maintenance_contract')),

  -- Outcomes
  completion_date DATE,
  project_value_range TEXT,  -- e.g. '$50K–$100K'
  energy_savings_pct INT,

  -- Location
  city TEXT,
  state TEXT,

  -- Images (up to 6)
  image_urls TEXT[] DEFAULT '{}',

  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sample_projects_contractor ON sample_projects (contractor_id);

ALTER TABLE sample_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sample projects"
  ON sample_projects FOR SELECT
  USING (true);

CREATE POLICY "Contractors can manage own projects"
  ON sample_projects FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- QUOTE REQUESTS (enhanced lead form for
-- facility/property managers)
-- ============================================
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Requestor info
  requestor_name TEXT NOT NULL,
  requestor_email TEXT NOT NULL,
  requestor_phone TEXT,
  requestor_title TEXT,  -- e.g. 'Facility Manager', 'Property Director'
  company_name TEXT,

  -- Property details
  building_type TEXT NOT NULL,  -- office, retail, industrial, healthcare, etc.
  property_sqft INT,
  num_buildings INT DEFAULT 1,
  num_units_rtus INT,  -- number of RTUs or major equipment
  system_types TEXT[] DEFAULT '{}',  -- what systems need service
  current_issues TEXT,  -- free-text description of problems

  -- Project scope
  service_type TEXT CHECK (service_type IN ('repair', 'replacement', 'new_install', 'maintenance_agreement', 'emergency', 'energy_audit', 'other')),
  budget_band TEXT CHECK (budget_band IN ('under_5k', '5k_15k', '15k_50k', '50k_100k', '100k_250k', '250k_plus', 'not_sure')),
  timing TEXT CHECK (timing IN ('emergency_now', 'this_week', 'this_month', 'this_quarter', 'planning_ahead')),

  -- Location
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,

  -- Routing
  metro_area TEXT,  -- for slot-based routing
  assigned_contractor_ids UUID[] DEFAULT '{}',  -- which contractors received this lead
  max_contractors INT DEFAULT 3,  -- how many contractors to route to

  -- Status & tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'routing', 'sent', 'viewed', 'quoted', 'won', 'lost', 'expired')),
  routed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT DEFAULT 'quote_flow',
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Estimated deal value (calculated from inputs)
  estimated_deal_value INT  -- cents
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests (status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_metro ON quote_requests (metro_area);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON quote_requests (created_at DESC);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit quote requests
CREATE POLICY "Anyone can submit quote requests"
  ON quote_requests FOR INSERT
  WITH CHECK (true);

-- Contractors can see requests assigned to them
CREATE POLICY "Contractors can see assigned requests"
  ON quote_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contractors c
      WHERE c.owner_id = auth.uid()
      AND c.id = ANY(assigned_contractor_ids)
    )
  );

-- ============================================
-- QUOTE RESPONSES (contractor bids on leads)
-- ============================================
CREATE TABLE IF NOT EXISTS quote_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,

  -- Response
  message TEXT,
  estimated_cost_min INT,  -- cents
  estimated_cost_max INT,  -- cents
  estimated_timeline TEXT,  -- e.g. "2-3 business days"
  available_start_date DATE,

  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined', 'expired')),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quote_responses_request ON quote_responses (quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_responses_contractor ON quote_responses (contractor_id);

ALTER TABLE quote_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own responses"
  ON quote_responses FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- NURTURE SEQUENCES (automated follow-up tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS nurture_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Linked to either a lead or quote_request
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'confirmation_email', 'confirmation_sms',
    'vendor_matched_email', 'vendor_matched_sms',
    'followup_24h', 'followup_72h', 'followup_7d',
    'review_request', 'satisfaction_survey'
  )),
  channel TEXT CHECK (channel IN ('email', 'sms')),
  recipient_email TEXT,
  recipient_phone TEXT,

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Content reference
  template_id TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_nurture_lead ON nurture_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_nurture_quote ON nurture_events (quote_request_id);
CREATE INDEX IF NOT EXISTS idx_nurture_status ON nurture_events (status);

ALTER TABLE nurture_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage nurture events (system-driven)
-- No public policies needed.

-- ============================================
-- MARKET SLOTS (metro area lead allocation)
-- ============================================
CREATE TABLE IF NOT EXISTS market_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  metro_area TEXT NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('standard', 'preferred', 'exclusive')),

  -- Billing
  price_per_lead INT,  -- cents
  monthly_cap INT,     -- max leads per month
  leads_delivered_this_month INT DEFAULT 0,

  -- Validity
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(metro_area, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_market_slots_metro ON market_slots (metro_area, is_active);

ALTER TABLE market_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can see own slots"
  ON market_slots FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- UPDATE leads table: add commercial fields
-- ============================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS building_type TEXT,
  ADD COLUMN IF NOT EXISTS property_sqft INT,
  ADD COLUMN IF NOT EXISTS num_units_rtus INT,
  ADD COLUMN IF NOT EXISTS budget_band TEXT,
  ADD COLUMN IF NOT EXISTS timing TEXT,
  ADD COLUMN IF NOT EXISTS quote_request_id UUID REFERENCES quote_requests(id);

-- ============================================
-- UPDATE reviews table: add commercial context
-- ============================================
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS project_type TEXT,  -- 'new_install', 'repair', 'maintenance', etc.
  ADD COLUMN IF NOT EXISTS building_type TEXT,  -- what type of building the work was done on
  ADD COLUMN IF NOT EXISTS reviewer_title TEXT; -- 'Facility Manager', 'Property Director', etc.

-- ============================================
-- Update FTS to include new fields
-- ============================================
-- Drop and recreate the generated column for FTS to include system_types and building_types
-- Note: PostgreSQL doesn't allow ALTER on generated columns, so we drop and recreate
ALTER TABLE contractors DROP COLUMN IF EXISTS fts;

ALTER TABLE contractors
  ADD COLUMN fts TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(company_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(state, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(metro_area, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(sla_summary, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(dispatch_crm, '')), 'C')
  ) STORED;

-- Recreate the FTS index
CREATE INDEX IF NOT EXISTS idx_contractors_fts ON contractors USING GIN (fts);
