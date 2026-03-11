-- Migration to update type constraints from 'controle_technique' to 'controle'

-- Update vehicle_expenses type constraint
ALTER TABLE vehicle_expenses DROP CONSTRAINT IF EXISTS vehicle_expenses_type_check;
ALTER TABLE vehicle_expenses ADD CONSTRAINT vehicle_expenses_type_check
CHECK (type IN ('vidange', 'assurance', 'controle', 'autre'));

-- Update maintenance_alerts type constraint
ALTER TABLE maintenance_alerts DROP CONSTRAINT IF EXISTS maintenance_alerts_type_check;
ALTER TABLE maintenance_alerts ADD CONSTRAINT maintenance_alerts_type_check
CHECK (type IN ('vidange', 'assurance', 'controle'));