-- Add 'chaine' type support to all CHECK constraints
-- Run this in your Supabase SQL Editor

-- 1. Update vehicle_expenses table type constraint
ALTER TABLE vehicle_expenses 
  DROP CONSTRAINT vehicle_expenses_type_check;

ALTER TABLE vehicle_expenses 
  ADD CONSTRAINT vehicle_expenses_type_check 
  CHECK (type = ANY (ARRAY['vidange'::text, 'assurance'::text, 'controle'::text, 'chaine'::text, 'autre'::text]));

-- 2. Update maintenance_cost_alerts table expense_type constraint
ALTER TABLE maintenance_cost_alerts 
  DROP CONSTRAINT maintenance_cost_alerts_expense_type_check;

ALTER TABLE maintenance_cost_alerts 
  ADD CONSTRAINT maintenance_cost_alerts_expense_type_check 
  CHECK (expense_type = ANY (ARRAY['vidange'::text, 'assurance'::text, 'controle'::text, 'chaine'::text, 'autre'::text]));

-- 3. Update maintenance_alerts table type constraint (if needed for alerts)
ALTER TABLE maintenance_alerts 
  DROP CONSTRAINT maintenance_alerts_type_check;

ALTER TABLE maintenance_alerts 
  ADD CONSTRAINT maintenance_alerts_type_check 
  CHECK (type = ANY (ARRAY['vidange'::text, 'assurance'::text, 'controle'::text, 'chaine'::text]));

-- Verify the changes
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('vehicle_expenses', 'maintenance_cost_alerts', 'maintenance_alerts');
