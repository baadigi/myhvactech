-- Migration 007: Claim requests for contractor listing ownership
-- Contractors can claim unclaimed listings via email verification

CREATE TABLE IF NOT EXISTS claim_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- The contractor listing being claimed
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- The user making the claim
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact info submitted with the claim
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  job_title TEXT,
  message TEXT, -- optional message explaining why they're the owner

  -- Verification status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_notes TEXT, -- admin can add notes when approving/denying
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT, -- admin email who reviewed

  UNIQUE(contractor_id, user_id) -- one claim per user per contractor
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claim_requests_contractor ON claim_requests (contractor_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_user ON claim_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON claim_requests (status);

-- Also ensure owner_id has an index on contractors for quick lookup
CREATE INDEX IF NOT EXISTS idx_contractors_owner ON contractors (owner_id) WHERE owner_id IS NOT NULL;

COMMENT ON TABLE claim_requests IS 'Tracks contractor listing ownership claims awaiting admin approval';
COMMENT ON COLUMN claim_requests.status IS 'pending = awaiting review, approved = ownership transferred, denied = rejected';
