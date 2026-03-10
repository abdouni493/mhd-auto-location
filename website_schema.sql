-- SQL Schema for Website Management Features

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create special_offers table
CREATE TABLE IF NOT EXISTS special_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    old_price DECIMAL(10,2) NOT NULL CHECK (old_price > 0),
    new_price DECIMAL(10,2) NOT NULL CHECK (new_price > 0),
    note TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (new_price < old_price)
);

-- Create website_contacts table
CREATE TABLE IF NOT EXISTS website_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facebook TEXT,
    instagram TEXT,
    tiktok TEXT,
    whatsapp TEXT,
    phone TEXT,
    address TEXT,
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create website_settings table
CREATE TABLE IF NOT EXISTS website_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (assuming authenticated users can manage)
CREATE POLICY "Allow authenticated users to manage offers" ON offers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage special_offers" ON special_offers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage website_contacts" ON website_contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage website_settings" ON website_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default data
INSERT INTO website_contacts (facebook, instagram, tiktok, whatsapp, phone, address, email)
VALUES ('https://facebook.com/luxdrive', 'https://instagram.com/luxdrive', 'https://tiktok.com/@luxdrive', '+213XXXXXXXXX', '+213XXXXXXXXX', 'Alger Centre, Algeria', 'contact@luxdrive.dz')
ON CONFLICT DO NOTHING;

INSERT INTO website_settings (name, description, logo)
VALUES ('LuxDrive Premium Car Rental', 'Location de voitures de luxe en Algérie - Service premium et véhicules haut de gamme', 'https://picsum.photos/seed/logo/200/200')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offers_car_id ON offers(car_id);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_special_offers_car_id ON special_offers(car_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_active ON special_offers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_special_offers_created_at ON special_offers(created_at DESC);