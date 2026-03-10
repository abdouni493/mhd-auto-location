-- Step 1: Drop the dependent view first
DROP VIEW IF EXISTS maintenance_alerts CASCADE;

-- Step 2: Drop existing functions first (they have wrong return types)
DROP FUNCTION IF EXISTS get_vehicle_expenses_by_range(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_expiring_expenses() CASCADE;

-- Step 3: Recreate the maintenance_alerts view
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

-- Step 4: Create remaining helper functions
CREATE OR REPLACE FUNCTION get_vehicle_expenses_by_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id UUID,
  car_id UUID,
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
  id UUID,
  car_id UUID,
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

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_store_expenses_date ON store_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_store_expenses_created_at ON store_expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_car_id ON vehicle_expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type ON vehicle_expenses(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON vehicle_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_expiration_date ON vehicle_expenses(expiration_date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_created_at ON vehicle_expenses(created_at DESC);

-- Step 6: Enable RLS if not already enabled
ALTER TABLE store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_expenses ENABLE ROW LEVEL SECURITY;

-- Step 7: Create or replace RLS policies for store_expenses
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

-- Step 8: Create or replace RLS policies for vehicle_expenses
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
