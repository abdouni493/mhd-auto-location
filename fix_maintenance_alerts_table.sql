-- Fix maintenance_alerts: drop the view and recreate as table with correct constraints

-- Drop the view if it exists
DROP VIEW IF EXISTS maintenance_alerts CASCADE;

-- Create the maintenance_alerts table
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  car_info TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vidange', 'assurance', 'controle')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  is_expired BOOLEAN DEFAULT FALSE,
  days_until_due INTEGER,
  current_mileage INTEGER,
  next_service_mileage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_car_id ON maintenance_alerts(car_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_type ON maintenance_alerts(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_due_date ON maintenance_alerts(due_date);

-- Enable RLS
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to read maintenance_alerts" ON maintenance_alerts;
CREATE POLICY "Allow authenticated users to read maintenance_alerts"
ON maintenance_alerts FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to create maintenance_alerts" ON maintenance_alerts;
CREATE POLICY "Allow authenticated users to create maintenance_alerts"
ON maintenance_alerts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update maintenance_alerts" ON maintenance_alerts;
CREATE POLICY "Allow authenticated users to update maintenance_alerts"
ON maintenance_alerts FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete maintenance_alerts" ON maintenance_alerts;
CREATE POLICY "Allow authenticated users to delete maintenance_alerts"
ON maintenance_alerts FOR DELETE
USING (auth.role() = 'authenticated');