-- Fix public access to website tables
-- Allow anonymous users to read offers, special_offers, website_contacts, and website_settings

-- Offers table
DROP POLICY IF EXISTS "Allow public read access to offers" ON offers;
CREATE POLICY "Allow public read access to offers" ON offers FOR SELECT USING (true);

-- Special offers table
DROP POLICY IF EXISTS "Allow public read access to special_offers" ON special_offers;
CREATE POLICY "Allow public read access to special_offers" ON special_offers FOR SELECT USING (true);

-- Website contacts table
DROP POLICY IF EXISTS "Allow public read access to website_contacts" ON website_contacts;
CREATE POLICY "Allow public read access to website_contacts" ON website_contacts FOR SELECT USING (true);

-- Website settings table
DROP POLICY IF EXISTS "Allow public read access to website_settings" ON website_settings;
CREATE POLICY "Allow public read access to website_settings" ON website_settings FOR SELECT USING (true);

-- Also allow public read access to cars table since offers and special_offers join with it
DROP POLICY IF EXISTS "Allow public read access to cars" ON cars;
CREATE POLICY "Allow public read access to cars" ON cars FOR SELECT USING (true);