-- Supabase SQL Migration for LuxDrive Expenses
-- Run this script in your Supabase SQL Editor to set up and manage expenses

-- ============================================
-- STORE EXPENSES TABLE
-- ============================================

-- Ensure store_expenses table exists with all required fields
CREATE TABLE IF NOT EXISTS store_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  icon TEXT DEFAULT '🏪',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_store_expenses_date ON store_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_store_expenses_created_at ON store_expenses(created_at DESC);

-- Enable RLS for store_expenses
ALTER TABLE store_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for store_expenses (allow all authenticated users)
DROP POLICY IF EXISTS "Allow authenticated users to read store_expenses" ON store_expenses;
CREATE POLICY "Allow authenticated users to read store_expenses"
ON store_expenses FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to create store_expenses" ON store_expenses;
CREATE POLICY "Allow authenticated users to create store_expenses"
ON store_expenses FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update store_expenses" ON store_expenses;
CREATE POLICY "Allow authenticated users to update store_expenses"
ON store_expenses FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete store_expenses" ON store_expenses;
CREATE POLICY "Allow authenticated users to delete store_expenses"
ON store_expenses FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- VEHICLE EXPENSES TABLE
-- ============================================

-- Ensure vehicle_expenses table exists with proper expiration_date field
CREATE TABLE IF NOT EXISTS vehicle_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vidange', 'assurance', 'controle', 'autre')),
  cost INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  current_mileage INTEGER,
  next_vidange_km INTEGER,
  expiration_date DATE,
  expense_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_car_id ON vehicle_expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type ON vehicle_expenses(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON vehicle_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_expiration_date ON vehicle_expenses(expiration_date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_created_at ON vehicle_expenses(created_at DESC);

-- Enable RLS for vehicle_expenses
ALTER TABLE vehicle_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicle_expenses
DROP POLICY IF EXISTS "Allow authenticated users to read vehicle_expenses" ON vehicle_expenses;
CREATE POLICY "Allow authenticated users to read vehicle_expenses"
ON vehicle_expenses FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to create vehicle_expenses" ON vehicle_expenses;
CREATE POLICY "Allow authenticated users to create vehicle_expenses"
ON vehicle_expenses FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update vehicle_expenses" ON vehicle_expenses;
CREATE POLICY "Allow authenticated users to update vehicle_expenses"
ON vehicle_expenses FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete vehicle_expenses" ON vehicle_expenses;
CREATE POLICY "Allow authenticated users to delete vehicle_expenses"
ON vehicle_expenses FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- MAINTENANCE ALERTS VIEW (Optional)
-- ============================================

-- Create a view for maintenance alerts based on vehicle expenses
CREATE OR REPLACE VIEW maintenance_alerts AS
SELECT
  v.id,
  v.car_id,
  v.type,
  v.expiration_date,
  v.date as service_date,
  CASE
    WHEN v.type IN ('assurance', 'controle') AND v.expiration_date IS NOT NULL THEN
      CASE
        WHEN v.expiration_date < CURRENT_DATE THEN 'expired'
        WHEN v.expiration_date - INTERVAL '30 days' < CURRENT_DATE THEN 'warning'
        ELSE 'ok'
      END
    ELSE 'ok'
  END as status,
  CASE
    WHEN v.type IN ('assurance', 'controle') AND v.expiration_date IS NOT NULL THEN
      (v.expiration_date - CURRENT_DATE)::integer
    ELSE NULL
  END as days_until_expiration
FROM vehicle_expenses v
WHERE v.type IN ('assurance', 'controle');

-- ============================================
-- SUMMARY FUNCTIONS
-- ============================================

-- Function to get expenses by date range
CREATE OR REPLACE FUNCTION get_vehicle_expenses_by_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id TEXT,
  car_id TEXT,
  type TEXT,
  cost INTEGER,
  date DATE,
  note TEXT,
  current_mileage INTEGER,
  next_vidange_km INTEGER,
  expiration_date DATE,
  expense_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT ve.* FROM vehicle_expenses ve
  WHERE ve.date >= start_date AND ve.date <= end_date
  ORDER BY ve.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check expiring expenses (within 30 days)
CREATE OR REPLACE FUNCTION get_expiring_expenses()
RETURNS TABLE (
  id TEXT,
  car_id TEXT,
  type TEXT,
  expiration_date DATE,
  days_until_expiration INTEGER,
  note TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ve.id,
    ve.car_id,
    ve.type,
    ve.expiration_date,
    (ve.expiration_date - CURRENT_DATE)::integer as days_until_expiration,
    ve.note
  FROM vehicle_expenses ve
  WHERE ve.expiration_date IS NOT NULL
    AND ve.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ORDER BY ve.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - comment out if not needed)
-- ============================================

-- Uncomment below to add sample data for testing
-- INSERT INTO store_expenses (name, cost, date, note, icon)
-- VALUES ('Office supplies', 2500, CURRENT_DATE - INTERVAL '2 days', 'Printer paper and ink', '📋')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO vehicle_expenses (car_id, type, cost, date, note, current_mileage, expiration_date)
-- VALUES (
--   (SELECT id FROM cars LIMIT 1),
--   'assurance',
--   45000,
--   CURRENT_DATE - INTERVAL '15 days',
--   'Annual insurance',
--   45000,
--   CURRENT_DATE + INTERVAL '300 days'
-- )
-- ON CONFLICT DO NOTHING;
