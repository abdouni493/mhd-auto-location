-- Fix RLS policies for services table
-- Run this if services are not displaying in the UI

-- Enable RLS on services table (if not already enabled)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active services" ON public.services;
DROP POLICY IF EXISTS "Allow authenticated users to manage services" ON public.services;

-- Create RLS policies for services table
CREATE POLICY "Allow public read access to active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to manage services" ON public.services
  FOR ALL USING (auth.role() = 'authenticated');

-- Ensure proper grants
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.services TO anon;