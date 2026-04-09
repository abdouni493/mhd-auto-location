-- ============================================================================
-- COMPLETE SQL MIGRATION: Custom Vehicle Expense Categories & Alerts
-- ============================================================================
-- This migration adds support for:
-- 1. Custom expense categories (e.g., Frais d'inspection, Réparation moteur)
-- 2. Predefined expense categories
-- 3. Maintenance alert tracking for custom expenses
-- 4. Dashboard alert display functionality
-- ============================================================================

-- ============================================================================
-- STEP 1: Update vehicle_expenses table with new columns
-- ============================================================================

-- Add column for custom category names
ALTER TABLE public.vehicle_expenses
ADD COLUMN IF NOT EXISTS expense_category text;

-- Add column for category icons/emojis
ALTER TABLE public.vehicle_expenses
ADD COLUMN IF NOT EXISTS category_icon text DEFAULT '❓';

-- Add column to track if alert was sent
ALTER TABLE public.vehicle_expenses
ADD COLUMN IF NOT EXISTS alert_sent boolean DEFAULT false;

-- ============================================================================
-- STEP 2: Create vehicle_expense_categories lookup table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '❓',
  description text,
  category_type text CHECK (category_type IN ('vidange', 'assurance', 'controle', 'autre')) DEFAULT 'autre',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_expense_categories_pkey PRIMARY KEY (id)
);

-- Add comment for documentation
COMMENT ON TABLE public.vehicle_expense_categories IS 'Predefined categories for vehicle expenses, available for selection in the UI';

-- ============================================================================
-- STEP 3: Insert predefined expense categories
-- ============================================================================

INSERT INTO public.vehicle_expense_categories 
(category_name, icon, description, category_type, display_order)
VALUES 
  ('Frais d''inspection', '🔍', 'Frais de contrôle technique et inspection', 'autre', 1),
  ('Réparation moteur', '⚙️', 'Réparation du moteur et ses composants', 'autre', 2),
  ('Pneus', '🛞', 'Achat et remplacement de pneus', 'autre', 3),
  ('Batterie', '🔋', 'Remplacement de la batterie', 'autre', 4),
  ('Freins', '🛑', 'Entretien et remplacement des freins', 'autre', 5),
  ('Pare-brise', '🪟', 'Réparation ou remplacement du pare-brise', 'autre', 6),
  ('Carburant', '⛽', 'Coût du carburant', 'autre', 7),
  ('Stationnement', '🅿️', 'Frais de stationnement', 'autre', 8),
  ('Amende', '📜', 'Amende routière', 'autre', 9),
  ('Lavage', '🧼', 'Nettoyage et lavage du véhicule', 'autre', 10),
  ('Intérieur', '🛋️', 'Réparation de l''intérieur', 'autre', 11),
  ('Électricité', '⚡', 'Réparation électrique', 'autre', 12),
  ('Suspension', '🔧', 'Réparation de la suspension', 'autre', 13),
  ('Climatisation', '❄️', 'Entretien de la climatisation', 'autre', 14),
  ('Transmission', '⚙️', 'Réparation de la transmission', 'autre', 15),
  ('Autre', '❓', 'Autre dépense non catégorisée', 'autre', 16)
ON CONFLICT (category_name) DO NOTHING;

-- ============================================================================
-- STEP 4: Create maintenance_cost_alerts table for tracking alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_cost_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  expense_id uuid,
  expense_type text NOT NULL CHECK (expense_type IN ('vidange', 'assurance', 'controle', 'autre')),
  expense_category text,
  cost integer NOT NULL,
  alert_date date NOT NULL DEFAULT CURRENT_DATE,
  alert_sent boolean DEFAULT false,
  alert_severity text CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  alert_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_cost_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_cost_alerts_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);

-- Add comment
COMMENT ON TABLE public.maintenance_cost_alerts IS 'Tracks maintenance cost alerts for dashboard display';

-- ============================================================================
-- STEP 5: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type_category 
ON public.vehicle_expenses(type, expense_category);

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_car_alert 
ON public.vehicle_expenses(car_id, alert_sent, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_cost_alerts_car_date 
ON public.maintenance_cost_alerts(car_id, alert_date DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_cost_alerts_severity 
ON public.maintenance_cost_alerts(alert_severity, alert_date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_expense_categories_active 
ON public.vehicle_expense_categories(is_active, display_order);

-- ============================================================================
-- STEP 6: Add RLS policies for maintenance_cost_alerts (if using RLS)
-- ============================================================================

-- For maintenance_cost_alerts table, add basic select policy
-- Adjust based on your RLS configuration
/*
ALTER TABLE public.maintenance_cost_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select maintenance cost alerts"
  ON public.maintenance_cost_alerts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert maintenance cost alerts"
  ON public.maintenance_cost_alerts
  FOR INSERT
  WITH CHECK (true);
*/

-- ============================================================================
-- STEP 7: Create helper function for calculating alert severity
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_expense_severity(
  expense_cost integer,
  car_daily_rate numeric DEFAULT 5000
)
RETURNS text AS $$
BEGIN
  -- Return severity based on cost relative to daily rate
  IF expense_cost >= car_daily_rate * 2 THEN
    RETURN 'critical';
  ELSIF expense_cost >= car_daily_rate THEN
    RETURN 'high';
  ELSIF expense_cost >= car_daily_rate * 0.5 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 8: Create trigger function for automatic alert creation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_expense_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create alerts for 'autre' type expenses
  IF NEW.type = 'autre' AND NEW.alert_sent = FALSE THEN
    INSERT INTO public.maintenance_cost_alerts 
    (car_id, expense_id, expense_type, expense_category, cost, alert_date, alert_severity, alert_message)
    VALUES (
      NEW.car_id,
      NEW.id,
      NEW.type,
      COALESCE(NEW.expense_category, NEW.expense_name, 'Autre dépense'),
      NEW.cost,
      NEW.date,
      calculate_expense_severity(NEW.cost),
      'Nouvelle dépense enregistrée: ' || COALESCE(NEW.expense_category, NEW.expense_name, 'Autre dépense') || 
      ' - ' || NEW.cost || ' DZD'
    );
    
    -- Mark as alert sent
    UPDATE public.vehicle_expenses SET alert_sent = true WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Create trigger on vehicle_expenses
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_create_expense_alert ON public.vehicle_expenses;

CREATE TRIGGER trigger_create_expense_alert
AFTER INSERT ON public.vehicle_expenses
FOR EACH ROW
EXECUTE FUNCTION create_expense_alert();

-- ============================================================================
-- STEP 10: Create view for active alerts (for dashboard)
-- ============================================================================

CREATE OR REPLACE VIEW active_maintenance_alerts AS
SELECT 
  mca.id,
  mca.car_id,
  c.brand,
  c.model,
  c.plate_number,
  mca.expense_type,
  mca.expense_category,
  mca.cost,
  mca.alert_date,
  mca.alert_severity,
  mca.alert_message,
  mca.created_at,
  CASE 
    WHEN mca.alert_date < CURRENT_DATE - INTERVAL '7 days' THEN 'old'
    WHEN mca.alert_date < CURRENT_DATE - INTERVAL '3 days' THEN 'recent'
    ELSE 'new'
  END as alert_age
FROM public.maintenance_cost_alerts mca
JOIN public.cars c ON mca.car_id = c.id
WHERE mca.alert_sent = true
ORDER BY mca.alert_date DESC, mca.alert_severity DESC;

-- ============================================================================
-- STEP 11: Add documentation comments
-- ============================================================================

COMMENT ON COLUMN public.vehicle_expenses.expense_category IS 'Custom category name for "autre" type expenses (e.g., "Frais d''inspection")';
COMMENT ON COLUMN public.vehicle_expenses.category_icon IS 'Emoji icon representing the expense category';
COMMENT ON COLUMN public.vehicle_expenses.alert_sent IS 'Flag indicating if alert has been created for this expense';

COMMENT ON FUNCTION calculate_expense_severity(integer, numeric) IS 'Calculates alert severity based on expense cost';
COMMENT ON FUNCTION create_expense_alert() IS 'Automatic trigger function to create maintenance alerts for new expenses';

COMMENT ON VIEW active_maintenance_alerts IS 'View of active maintenance alerts for dashboard display, filtered and ordered by severity';

-- ============================================================================
-- STEP 12: Create stored procedure for bulk alert creation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_alerts_for_expenses(
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(alert_count int, processed_count int) AS $$
DECLARE
  v_alert_count int := 0;
  v_processed_count int := 0;
BEGIN
  -- Process all "autre" expenses without alerts
  INSERT INTO public.maintenance_cost_alerts 
  (car_id, expense_id, expense_type, expense_category, cost, alert_date, alert_severity, alert_message)
  SELECT 
    ve.car_id,
    ve.id,
    ve.type,
    COALESCE(ve.expense_category, ve.expense_name, 'Autre dépense'),
    ve.cost,
    ve.date,
    calculate_expense_severity(ve.cost),
    'Nouvelle dépense: ' || COALESCE(ve.expense_category, ve.expense_name) || ' - ' || ve.cost || ' DZD'
  FROM public.vehicle_expenses ve
  WHERE ve.type = 'autre' 
    AND ve.alert_sent = FALSE
    AND ve.date BETWEEN p_start_date AND p_end_date
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_alert_count = ROW_COUNT;

  -- Update alert_sent flag
  UPDATE public.vehicle_expenses 
  SET alert_sent = true
  WHERE type = 'autre' 
    AND alert_sent = FALSE
    AND date BETWEEN p_start_date AND p_end_date;

  GET DIAGNOSTICS v_processed_count = ROW_COUNT;

  RETURN QUERY SELECT v_alert_count, v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- OPTIONAL: Clean up old alerts (run periodically)
-- ============================================================================

-- Uncomment and run as needed to clean up old alerts
/*
DELETE FROM public.maintenance_cost_alerts
WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
  AND alert_severity NOT IN ('critical', 'high');
*/

-- ============================================================================
-- TESTING: Verify the setup
-- ============================================================================

-- Check if columns were added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'vehicle_expenses' AND column_name IN ('expense_category', 'category_icon', 'alert_sent');

-- Check categories
-- SELECT * FROM public.vehicle_expense_categories ORDER BY display_order;

-- Check active alerts
-- SELECT * FROM active_maintenance_alerts LIMIT 10;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
-- DROP TRIGGER trigger_create_expense_alert ON public.vehicle_expenses;
-- DROP FUNCTION create_expense_alert();
-- DROP FUNCTION calculate_expense_severity(integer, numeric);
-- DROP FUNCTION create_alerts_for_expenses(date, date);
-- DROP VIEW active_maintenance_alerts;
-- DROP TABLE public.maintenance_cost_alerts;
-- DROP TABLE public.vehicle_expense_categories;
-- ALTER TABLE public.vehicle_expenses DROP COLUMN IF EXISTS expense_category;
-- ALTER TABLE public.vehicle_expenses DROP COLUMN IF EXISTS category_icon;
-- ALTER TABLE public.vehicle_expenses DROP COLUMN IF EXISTS alert_sent;
*/
