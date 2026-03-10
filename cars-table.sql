-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate_number TEXT NOT NULL UNIQUE,
  price_per_day NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to perform all operations
CREATE POLICY "Allow authenticated users to manage cars" ON cars
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index on plate_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_plate_number ON cars(plate_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);