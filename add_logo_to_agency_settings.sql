-- Add logo column to agency_settings table
ALTER TABLE public.agency_settings
ADD COLUMN IF NOT EXISTS logo text;

-- Update existing records with a default logo if they don't have one
UPDATE public.agency_settings
SET logo = 'https://picsum.photos/seed/logo/200/200'
WHERE logo IS NULL;