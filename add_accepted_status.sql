-- Fix: Add 'accepted' status to reservations and website_orders tables
-- This enables the new accepted status workflow

-- 1. Drop existing constraint on website_orders table
ALTER TABLE IF EXISTS website_orders DROP CONSTRAINT IF EXISTS website_orders_status_check;

-- 2. Add new constraint to website_orders with 'accepted' included
ALTER TABLE IF EXISTS website_orders ADD CONSTRAINT website_orders_status_check 
  CHECK (status IN ('pending', 'accepted', 'confirmed', 'processing', 'completed', 'cancelled'));

-- 3. Drop existing constraint on reservations table
ALTER TABLE IF EXISTS reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- 4. Add new constraint to reservations with 'accepted' included
ALTER TABLE IF EXISTS reservations ADD CONSTRAINT reservations_status_check 
  CHECK (status IN ('pending', 'accepted', 'confirmed', 'active', 'completed', 'cancelled'));

-- Verify constraints were created
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('website_orders', 'reservations') 
AND constraint_type = 'CHECK';
