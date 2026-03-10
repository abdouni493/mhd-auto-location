-- Migration for agencies table
-- run this in Supabase SQL editor if the table doesn't exist or to upgrade the definition

-- create table with UUID default
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- add indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_city ON agencies(city);

-- enable row level security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- allow authenticated users to do CRUD
-- note: Postgres does not support IF NOT EXISTS on CREATE POLICY
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_can_manage_agencies' AND tablename = 'agencies'
  ) THEN
    CREATE POLICY "authenticated can manage agencies" ON agencies
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- ensure statistics are up to date
ANALYZE agencies;
