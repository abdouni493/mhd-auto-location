-- Fix the agency relationship issue
-- The problem: vehicle_inspections expects TEXT agency_id, but agencies table might use UUID
-- And the foreign key relationship was dropped

-- Option 1: Make agencies table use TEXT ids to match vehicle_inspections
-- (This matches the supabase-setup.sql definition)

-- First, check current agencies table structure and data
-- If it has UUID ids, we need to handle the migration

-- For now, let's ensure agencies table uses TEXT ids
-- (Run this if your agencies table currently has UUID ids)

-- Note: This will change existing agency UUIDs to TEXT
-- Make sure to backup your data first!

-- ALTER TABLE public.agencies ALTER COLUMN id TYPE TEXT;
-- UPDATE public.agencies SET id = id::text WHERE id IS NOT NULL;

-- Then recreate the foreign key relationship
-- ALTER TABLE public.vehicle_inspections ADD CONSTRAINT vehicle_inspections_agency_id_fkey
-- FOREIGN KEY (agency_id) REFERENCES public.agencies(id);

-- Option 2: If you want to keep UUIDs for agencies, change vehicle_inspections back to UUID
-- But this requires mapping agency names to UUIDs in the application

-- For immediate fix: Let's modify the query to not join with agencies
-- Or create a view/materialized view that handles the relationship

-- Alternative: Create a function to get agency by name
CREATE OR REPLACE FUNCTION get_agency_by_name(agency_name TEXT)
RETURNS TABLE(id TEXT, name TEXT, address TEXT, city TEXT)
LANGUAGE sql
AS $$
  SELECT id, name, address, city
  FROM public.agencies
  WHERE name = agency_name
  LIMIT 1;
$$;