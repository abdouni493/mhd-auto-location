-- =========================================
-- FIX WEBSITE SETTINGS TABLE
-- =========================================

-- Drop the old website_settings table if it exists
DROP TABLE IF EXISTS public.website_settings CASCADE;

-- Recreate website_settings table with proper constraints
CREATE TABLE public.website_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT website_settings_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow authenticated users to create website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update website_settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow authenticated users to delete website_settings" ON public.website_settings;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read website_settings"
  ON public.website_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create website_settings"
  ON public.website_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update website_settings"
  ON public.website_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete website_settings"
  ON public.website_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial settings data
INSERT INTO public.website_settings (name, description, logo, updated_at) VALUES
('Luxdrive Premium', 'Votre partenaire de confiance en location de véhicules', 'https://images.unsplash.com/photo-1560958089-b8a63dd8aa8b?w=200&h=200&fit=crop', now())
ON CONFLICT DO NOTHING;

-- =========================================
-- VERIFY WEBSITE_CONTACTS TABLE
-- =========================================

-- Drop the old website_contacts table if it exists
DROP TABLE IF EXISTS public.website_contacts CASCADE;

-- Recreate website_contacts table with proper constraints
CREATE TABLE public.website_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  facebook text,
  instagram text,
  tiktok text,
  whatsapp text,
  phone text,
  address text,
  email text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT website_contacts_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.website_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read website_contacts" ON public.website_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to create website_contacts" ON public.website_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to update website_contacts" ON public.website_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to delete website_contacts" ON public.website_contacts;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read website_contacts"
  ON public.website_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create website_contacts"
  ON public.website_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update website_contacts"
  ON public.website_contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete website_contacts"
  ON public.website_contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial contacts data
INSERT INTO public.website_contacts (facebook, instagram, tiktok, whatsapp, phone, address, email, updated_at) VALUES
('https://facebook.com/luxdrive', '@luxdrive_dz', '@luxdrive', '+213 5 1234 5678', '+213 5 1234 5678', 'Alger, Algeria', 'contact@luxdrive.com', now())
ON CONFLICT DO NOTHING;

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

CREATE INDEX IF NOT EXISTS idx_website_settings_updated_at ON public.website_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_contacts_updated_at ON public.website_contacts(updated_at DESC);

-- =========================================
-- UPDATE STATISTICS
-- =========================================

ANALYZE public.website_settings;
ANALYZE public.website_contacts;
