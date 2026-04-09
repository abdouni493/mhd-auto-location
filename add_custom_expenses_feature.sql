-- SQL Migration: Add Custom Expense Categories Feature
-- This migration adds support for custom expense categories/names for 'autre' type expenses

-- Step 1: Add new column to vehicle_expenses table
-- This column stores custom category names for 'autre' type expenses
ALTER TABLE public.vehicle_expenses
ADD COLUMN IF NOT EXISTS expense_category text;

-- Step 2: Add column for storing multiple predefined categories for 'autre' type
-- Categories like: 'Frais d\'inspection', 'Réparation moteur', 'Pneus', etc.
ALTER TABLE public.vehicle_expenses
ADD COLUMN IF NOT EXISTS category_icon text DEFAULT '❓';

-- Step 3: Create a constraint to ensure expense_category is required for 'autre' type
-- (This will be enforced at application level if needed)

-- Step 4: Add index for better query performance on type and expense_category
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type_category 
ON public.vehicle_expenses(type, expense_category);

-- Step 5: Create table for predefined expense categories
CREATE TABLE IF NOT EXISTS public.vehicle_expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  icon text NOT NULL DEFAULT '❓',
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT unique_category_name UNIQUE(category_name)
);

-- Step 6: Insert predefined categories for custom expenses
INSERT INTO public.vehicle_expense_categories (category_name, icon, description, display_order)
VALUES 
  ('Frais d''inspection', '🔍', 'Frais de contrôle technique et inspection', 1),
  ('Réparation moteur', '⚙️', 'Réparation du moteur et ses composants', 2),
  ('Pneus', '🛞', 'Achat et remplacement de pneus', 3),
  ('Batterie', '🔋', 'Remplacement de la batterie', 4),
  ('Freins', '🛑', 'Entretien et remplacement des freins', 5),
  ('Pare-brise', '🪟', 'Réparation ou remplacement du pare-brise', 6),
  ('Carburant', '⛽', 'Coût du carburant', 7),
  ('Stationnement', '🅿️', 'Frais de stationnement', 8),
  ('Amende', '📜', 'Amende routière', 9),
  ('Lavage', '🧼', 'Nettoyage et lavage du véhicule', 10),
  ('Intérieur', '🛋️', 'Réparation de l''intérieur', 11),
  ('Électricité', '⚡', 'Réparation électrique', 12),
  ('Suspension', '🔧', 'Réparation de la suspension', 13),
  ('Climatisation', '❄️', 'Entretien de la climatisation', 14),
  ('Autre', '❓', 'Autre dépense', 15)
ON CONFLICT (category_name) DO NOTHING;

-- Step 7: Create maintenance_cost_history table for tracking alert history
CREATE TABLE IF NOT EXISTS public.maintenance_cost_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  expense_id uuid,
  expense_category text,
  cost integer NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  alert_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_cost_history_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_cost_history_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);

-- Step 8: Create index for dashboard alert queries
CREATE INDEX IF NOT EXISTS idx_maintenance_cost_history_car_date 
ON public.maintenance_cost_history(car_id, date DESC);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN public.vehicle_expenses.expense_category IS 'Custom category name for autre type expenses';
COMMENT ON COLUMN public.vehicle_expenses.category_icon IS 'Emoji icon for the expense category';
COMMENT ON TABLE public.vehicle_expense_categories IS 'Predefined categories for custom vehicle expenses';
COMMENT ON TABLE public.maintenance_cost_history IS 'History of maintenance costs for alert tracking';
