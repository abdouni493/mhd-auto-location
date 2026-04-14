-- Add filter tracking columns to vehicle_expenses table for "vidange" type
-- These columns track which filters were changed during oil change service

ALTER TABLE public.vehicle_expenses 
ADD COLUMN IF NOT EXISTS oil_filter_changed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS air_filter_changed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_filter_changed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ac_filter_changed boolean DEFAULT false;

-- Add comment explaining the columns
COMMENT ON COLUMN public.vehicle_expenses.oil_filter_changed IS 'Track if oil filter was changed during vidange service';
COMMENT ON COLUMN public.vehicle_expenses.air_filter_changed IS 'Track if air filter was changed during vidange service';
COMMENT ON COLUMN public.vehicle_expenses.fuel_filter_changed IS 'Track if fuel filter was changed during vidange service';
COMMENT ON COLUMN public.vehicle_expenses.ac_filter_changed IS 'Track if AC filter was changed during vidange service';

-- Create index for filtering vidange expenses with filter changes
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vidange_filters 
ON public.vehicle_expenses(car_id, type) 
WHERE type = 'vidange' AND (oil_filter_changed OR air_filter_changed OR fuel_filter_changed OR ac_filter_changed);
