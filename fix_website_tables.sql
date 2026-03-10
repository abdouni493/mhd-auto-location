-- =========================================
-- FIX WEBSITE CONTACTS AND SETTINGS TABLES
-- =========================================
-- This script fixes the website_contacts and website_settings tables
-- to ensure they only contain one record each, as they should be global settings

-- =========================================
-- CLEAN UP DUPLICATE RECORDS
-- =========================================

-- For website_contacts: Keep only the most recent record
DELETE FROM public.website_contacts
WHERE id NOT IN (
    SELECT id FROM public.website_contacts
    ORDER BY updated_at DESC
    LIMIT 1
);

-- For website_settings: Keep only the most recent record
DELETE FROM public.website_settings
WHERE id NOT IN (
    SELECT id FROM public.website_settings
    ORDER BY updated_at DESC
    LIMIT 1
);

-- =========================================
-- ADD CONSTRAINTS TO PREVENT MULTIPLE RECORDS
-- =========================================

-- Add a partial unique index to website_contacts to ensure only one record
-- This creates a constraint that only allows one record where id is not null
CREATE UNIQUE INDEX IF NOT EXISTS website_contacts_single_record
ON public.website_contacts ((1))
WHERE id IS NOT NULL;

-- Add a partial unique index to website_settings to ensure only one record
CREATE UNIQUE INDEX IF NOT EXISTS website_settings_single_record
ON public.website_settings ((1))
WHERE id IS NOT NULL;

-- =========================================
-- ENSURE TABLES HAVE DATA
-- =========================================

-- Insert default contacts if table is empty
INSERT INTO public.website_contacts (facebook, instagram, tiktok, whatsapp, phone, address, email, updated_at)
SELECT
    'https://facebook.com/luxdrive',
    '@luxdrive_dz',
    '@luxdrive',
    '+213 5 1234 5678',
    '+213 5 1234 5678',
    'Alger, Algeria',
    'contact@luxdrive.com',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.website_contacts LIMIT 1);

-- Insert default settings if table is empty
INSERT INTO public.website_settings (name, description, logo, updated_at)
SELECT
    'LuxDrive Premium Car Rental',
    'Location de voitures de luxe en Algérie',
    'https://picsum.photos/seed/logo/200/200',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.website_settings LIMIT 1);

-- =========================================
-- UPDATE RLS POLICIES (ENSURE THEY EXIST)
-- =========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to manage website_contacts" ON public.website_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to manage website_settings" ON public.website_settings;

-- Recreate policies
CREATE POLICY "Allow authenticated users to manage website_contacts"
ON public.website_contacts
FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage website_settings"
ON public.website_settings
FOR ALL
USING (auth.role() = 'authenticated');</content>
<parameter name="filePath">c:\Users\Admin\Desktop\luxdrive---premium-car-rental\fix_website_tables.sql