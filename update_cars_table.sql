-- Update cars table to include all form fields
-- Run this in your Supabase SQL Editor

-- Add new columns to the cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS energy TEXT DEFAULT 'Essence';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission TEXT DEFAULT 'Manuelle';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 5;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS doors INTEGER DEFAULT 5;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_week NUMERIC;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_month NUMERIC;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS deposit NUMERIC;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0;

-- Update existing records to have default values (optional, for data consistency)
UPDATE cars SET
  color = COALESCE(color, 'Premium'),
  energy = COALESCE(energy, 'Essence'),
  transmission = COALESCE(transmission, 'Automatique'),
  seats = COALESCE(seats, 5),
  doors = COALESCE(doors, 4),
  price_week = COALESCE(price_week, price_per_day * 2),
  price_month = COALESCE(price_month, price_per_day * 4),
  deposit = COALESCE(deposit, price_per_day * 2),
  mileage = COALESCE(mileage, 0)
WHERE color IS NULL OR energy IS NULL OR transmission IS NULL;

-- Create or update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_model ON cars(model);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_energy ON cars(energy);
CREATE INDEX IF NOT EXISTS idx_cars_transmission ON cars(transmission);

-- Update Row Level Security policies to include new fields
-- (The existing policies should work, but let's ensure they allow all operations)
DROP POLICY IF EXISTS "cars_rls" ON cars;
CREATE POLICY "cars_rls" ON cars
  FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Add a view for car statistics
CREATE OR REPLACE VIEW car_stats AS
SELECT
  COUNT(*) as total_cars,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_cars,
  AVG(price_per_day) as avg_daily_price,
  AVG(price_week) as avg_weekly_price,
  AVG(price_month) as avg_monthly_price,
  AVG(mileage) as avg_mileage
FROM cars;

-- Grant access to the view
GRANT SELECT ON car_stats TO authenticated;