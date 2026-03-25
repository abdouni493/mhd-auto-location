-- Add fuel_level column to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_level TEXT DEFAULT 'full' CHECK (fuel_level IN ('full', 'half', 'quarter', 'eighth', 'empty'));

-- Create index for fuel_level
CREATE INDEX IF NOT EXISTS idx_cars_fuel_level ON cars(fuel_level);

-- Update existing records to have 'full' as default
UPDATE cars SET fuel_level = 'full' WHERE fuel_level IS NULL;
