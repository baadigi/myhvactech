-- 010: Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  reason TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes TEXT
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);

-- RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read (API routes use service role)
CREATE POLICY "Service role full access on contact_messages"
  ON contact_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
