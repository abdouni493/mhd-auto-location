-- Fix vehicle_inspections agency_id to use TEXT instead of UUID
-- This allows using agency names like "AGENCE MHD-AUTO" instead of requiring UUIDs

-- First, drop the existing foreign key constraint
ALTER TABLE public.vehicle_inspections DROP CONSTRAINT IF EXISTS vehicle_inspections_agency_id_fkey;

-- Change agency_id column from UUID to TEXT
ALTER TABLE public.vehicle_inspections ALTER COLUMN agency_id TYPE TEXT;

-- Add back the foreign key constraint (if agencies table uses TEXT ids)
-- Note: If agencies.id is UUID, you may need to adjust this
-- For now, we'll allow any text value since the app uses agency names
-- ALTER TABLE public.vehicle_inspections ADD CONSTRAINT vehicle_inspections_agency_id_fkey
-- FOREIGN KEY (agency_id) REFERENCES public.agencies(id);