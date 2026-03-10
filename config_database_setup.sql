-- =========================================
-- CONFIGURATION INTERFACE DATABASE SETUP
-- =========================================
-- This script sets up the necessary database components
-- for the Configuration interface functionality

-- =========================================
-- CREATE STORAGE BUCKET FOR WORKERS
-- =========================================

-- Create the workers storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('workers', 'workers', true)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- STORAGE POLICIES FOR WORKERS BUCKET
-- =========================================

-- Allow authenticated users to upload files to workers bucket
CREATE POLICY "Allow authenticated users to upload worker files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view worker files
CREATE POLICY "Allow authenticated users to view worker files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'workers' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own worker files
CREATE POLICY "Allow authenticated users to update worker files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete worker files
CREATE POLICY "Allow authenticated users to delete worker files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
);

-- =========================================
-- CREATE CONFIGURATION TABLES (IF NEEDED)
-- =========================================

-- Create agency_settings table for general configuration
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_name text NOT NULL DEFAULT 'LuxDrive Premium',
  slogan text,
  address text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agency_settings_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_settings
CREATE POLICY "Allow authenticated users to manage agency_settings"
ON public.agency_settings
FOR ALL
USING (auth.role() = 'authenticated');

-- Insert default agency settings if not exists
INSERT INTO public.agency_settings (agency_name, slogan, address, phone)
SELECT
  'LuxDrive Premium',
  'Votre partenaire de confiance en location de véhicules',
  'Alger, Algeria',
  '+213 5 1234 5678'
WHERE NOT EXISTS (SELECT 1 FROM public.agency_settings LIMIT 1);

-- =========================================
-- UPDATE WORKERS TABLE (IF NEEDED)
-- =========================================

-- Add profile_photo column to workers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE public.workers ADD COLUMN profile_photo text;
  END IF;
END $$;

-- =========================================
-- CREATE BACKUP/RESTORE FUNCTIONS
-- =========================================

-- Function to get all data for backup
CREATE OR REPLACE FUNCTION get_full_backup()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'timestamp', now(),
    'version', '1.0',
    'data', json_build_object(
      'cars', (SELECT json_agg(cars) FROM cars),
      'clients', (SELECT json_agg(clients) FROM clients),
      'agencies', (SELECT json_agg(agencies) FROM agencies),
      'workers', (SELECT json_agg(workers) FROM workers),
      'offers', (SELECT json_agg(offers) FROM offers),
      'special_offers', (SELECT json_agg(special_offers) FROM special_offers),
      'store_expenses', (SELECT json_agg(store_expenses) FROM store_expenses),
      'vehicle_expenses', (SELECT json_agg(vehicle_expenses) FROM vehicle_expenses),
      'website_contacts', (SELECT json_agg(website_contacts) FROM website_contacts),
      'website_settings', (SELECT json_agg(website_settings) FROM website_settings),
      'agency_settings', (SELECT json_agg(agency_settings) FROM agency_settings)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- GRANT NECESSARY PERMISSIONS
-- =========================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions on tables
GRANT ALL ON public.agency_settings TO authenticated;
GRANT ALL ON public.workers TO authenticated;