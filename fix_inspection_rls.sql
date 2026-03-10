-- SQL code to fix Row-Level Security (RLS) for inspection_checklist_items table

-- Option 1: Disable RLS entirely (simple but less secure)
-- ALTER TABLE inspection_checklist_items DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with proper policies (recommended)
ALTER TABLE inspection_checklist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON inspection_checklist_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inspection_checklist_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON inspection_checklist_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON inspection_checklist_items;

-- Create policy to allow reading for all users
CREATE POLICY "Enable read access for all users"
ON inspection_checklist_items
FOR SELECT
USING (true);

-- Create policy to allow inserting for authenticated users
CREATE POLICY "Enable insert for authenticated users"
ON inspection_checklist_items
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow updating for authenticated users
CREATE POLICY "Enable update for authenticated users"
ON inspection_checklist_items
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow deleting for authenticated users
CREATE POLICY "Enable delete for authenticated users"
ON inspection_checklist_items
FOR DELETE
USING (auth.role() = 'authenticated');

-- Verify the table has RLS enabled and policies are in place
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'inspection_checklist_items';

-- Check the policies
SELECT
  policyname,
  tablename,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'inspection_checklist_items';