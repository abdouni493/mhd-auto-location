-- Fix RLS policies for public access to website and car data
-- This allows unauthenticated users to view website content and car listings

-- Cars table - allow public read access
DROP POLICY IF EXISTS "Allow public read access to cars" ON cars;
CREATE POLICY "Allow public read access to cars" ON cars FOR SELECT USING (true);

-- Website contacts - ensure public read access
DROP POLICY IF EXISTS "Allow public read access to website_contacts" ON website_contacts;
CREATE POLICY "Allow public read access to website_contacts" ON website_contacts FOR SELECT USING (true);

-- Website settings - ensure public read access
DROP POLICY IF EXISTS "Allow public read access to website_settings" ON website_settings;
CREATE POLICY "Allow public read access to website_settings" ON website_settings FOR SELECT USING (true);

-- Offers - ensure public read access
DROP POLICY IF EXISTS "Allow public read access to offers" ON offers;
CREATE POLICY "Allow public read access to offers" ON offers FOR SELECT USING (true);

-- Special offers - ensure public read access
DROP POLICY IF EXISTS "Allow public read access to special_offers" ON special_offers;
CREATE POLICY "Allow public read access to special_offers" ON special_offers FOR SELECT USING (true);

-- Agencies - allow public read access for agency list
DROP POLICY IF EXISTS "Allow public read access to agencies" ON agencies;
CREATE POLICY "Allow public read access to agencies" ON agencies FOR SELECT USING (true);
