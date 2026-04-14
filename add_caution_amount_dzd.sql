-- ============================================
-- Migration: Add caution_amount_dzd column
-- ============================================
-- This migration adds support for storing the DZD caution amount
-- separately from the deposit field, enabling multi-currency support

-- Add the caution_amount_dzd column if it doesn't exist
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS caution_amount_dzd NUMERIC;

-- Update existing rows to use the deposit value as caution_amount_dzd
-- (only for rows that don't already have a value)
UPDATE reservations 
SET caution_amount_dzd = deposit 
WHERE caution_amount_dzd IS NULL;

-- Verify the column was created successfully
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name='reservations' AND column_name='caution_amount_dzd';

