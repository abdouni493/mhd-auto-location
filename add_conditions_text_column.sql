-- =========================================
-- ADD CONDITIONS_TEXT COLUMN TO RESERVATIONS
-- =========================================
-- This migration adds the missing conditions_text column to the reservations table
-- This column stores the rental conditions/terms for each reservation

-- Add the conditions_text column to reservations table
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS conditions_text TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN reservations.conditions_text IS 'Stores the rental conditions/terms for the reservation, separated by newlines';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_conditions ON reservations(id);
