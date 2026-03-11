-- Force drop the view and create the table

-- Drop the view (this will work even if it's a view)
DROP VIEW IF EXISTS maintenance_alerts CASCADE;

-- Now create the table
CREATE TABLE maintenance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
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

-- Add foreign key constraint
ALTER TABLE maintenance_alerts ADD CONSTRAINT maintenance_alerts_car_id_fkey
FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_maintenance_alerts_car_id ON maintenance_alerts(car_id);
CREATE INDEX idx_maintenance_alerts_type ON maintenance_alerts(type);
CREATE INDEX idx_maintenance_alerts_due_date ON maintenance_alerts(due_date);

-- Enable Row Level Security
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to read maintenance_alerts" ON maintenance_alerts
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create maintenance_alerts" ON maintenance_alerts
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update maintenance_alerts" ON maintenance_alerts
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete maintenance_alerts" ON maintenance_alerts
FOR DELETE USING (auth.role() = 'authenticated');