-- SQL to simplify the agencies table by removing unwanted fields
-- Run this in Supabase SQL Editor to alter the existing table

-- Drop the unwanted columns
ALTER TABLE public.agencies DROP COLUMN IF EXISTS phone;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS email;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS wilaya;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS manager;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS opening_hours;

-- Ensure city is NOT NULL (required field)
-- Note: If there are existing rows with NULL city, update them first or this will fail
-- Example: UPDATE public.agencies SET city = 'Unknown' WHERE city IS NULL;
ALTER TABLE public.agencies ALTER COLUMN city SET NOT NULL;

-- Optional: Add any indexes if needed (already have primary key on id)
-- CREATE INDEX IF NOT EXISTS idx_agencies_name ON public.agencies(name);
-- CREATE INDEX IF NOT EXISTS idx_agencies_city ON public.agencies(city);