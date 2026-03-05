-- ============================================
-- MY HVAC TECH — Admin & Auth Support
-- Migration: 003_auth_admin_support.sql
-- ============================================

-- Allow anon inserts to contractors (for registration flow with RLS)
-- The existing policy only allows owner_id = auth.uid() inserts,
-- which works when a user is logged in.

-- Policy for authenticated users to read their own contractor record
CREATE POLICY "Users can read own contractor"
  ON contractors FOR SELECT
  USING (owner_id = auth.uid());

-- Allow authenticated users to insert leads (the existing "Anyone can submit leads" covers this)

-- Allow contractors to see their own quote requests
-- (already handled by the assigned_contractor_ids policy)

-- Create a view for admin API to bypass RLS (uses service_role key)
-- No additional policies needed since admin API should use service_role key
-- The admin API routes validate email = ryan@baadigi.com before proceeding

-- Ensure the public SELECT policy on contractors allows reading for the directory
-- (already exists from 001: "Public can read active contractors")
