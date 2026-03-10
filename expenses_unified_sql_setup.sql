-- =========================================
-- UNIFIED EXPENSES MANAGEMENT SYSTEM
-- =========================================
-- This SQL setup creates a unified expense system with:
-- 1. Store expenses table (magasin/متجر)
-- 2. Vehicle maintenance expenses table (entretien/صيانة)
-- Both tables are connected to the database and accessible from both interfaces

-- =========================================
-- CREATE TABLES
-- =========================================

-- Store Expenses table
CREATE TABLE IF NOT EXISTS public.store_expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cost integer NOT NULL,
  date date NOT NULL,
  note text,
  icon text DEFAULT '🏪',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_expenses_pkey PRIMARY KEY (id)
);

-- Vehicle Expenses table
CREATE TABLE IF NOT EXISTS public.vehicle_expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['vidange'::text, 'assurance'::text, 'controle'::text, 'autre'::text])),
  cost integer NOT NULL,
  date date NOT NULL,
  note text,
  current_mileage integer,
  next_vidange_km integer,
  expiration_date date,
  expense_name text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_expenses_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;

-- =========================================
-- DROP EXISTING POLICIES (IF ANY)
-- =========================================

DROP POLICY IF EXISTS "Allow authenticated users to read store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to create store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete store_expenses" ON public.store_expenses;

DROP POLICY IF EXISTS "Allow authenticated users to read vehicle_expenses" ON public.vehicle_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to create vehicle_expenses" ON public.vehicle_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update vehicle_expenses" ON public.vehicle_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete vehicle_expenses" ON public.vehicle_expenses;

-- =========================================
-- STORE EXPENSES POLICIES
-- =========================================

-- Store Expenses - SELECT policy
CREATE POLICY "Allow authenticated users to read store_expenses"
  ON public.store_expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Store Expenses - INSERT policy
CREATE POLICY "Allow authenticated users to create store_expenses"
  ON public.store_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Store Expenses - UPDATE policy
CREATE POLICY "Allow authenticated users to update store_expenses"
  ON public.store_expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Store Expenses - DELETE policy
CREATE POLICY "Allow authenticated users to delete store_expenses"
  ON public.store_expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- VEHICLE EXPENSES POLICIES
-- =========================================

-- Vehicle Expenses - SELECT policy
CREATE POLICY "Allow authenticated users to read vehicle_expenses"
  ON public.vehicle_expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Vehicle Expenses - INSERT policy
CREATE POLICY "Allow authenticated users to create vehicle_expenses"
  ON public.vehicle_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Vehicle Expenses - UPDATE policy
CREATE POLICY "Allow authenticated users to update vehicle_expenses"
  ON public.vehicle_expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Vehicle Expenses - DELETE policy
CREATE POLICY "Allow authenticated users to delete vehicle_expenses"
  ON public.vehicle_expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Store Expenses indexes
CREATE INDEX IF NOT EXISTS idx_store_expenses_date ON public.store_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_store_expenses_name ON public.store_expenses(name);
CREATE INDEX IF NOT EXISTS idx_store_expenses_created_at ON public.store_expenses(created_at DESC);

-- Vehicle Expenses indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_car_id ON public.vehicle_expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON public.vehicle_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type ON public.vehicle_expenses(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_created_at ON public.vehicle_expenses(created_at DESC);

-- =========================================
-- SAMPLE DATA (Optional - for testing)
-- =========================================

-- Uncomment below to insert sample data

/*
-- Sample Store Expenses
INSERT INTO public.store_expenses (name, cost, date, note, icon) VALUES
('Café pour le bureau', 500, '2026-03-01', 'Café arabica premium', '☕'),
('Fournitures de nettoyage', 2000, '2026-02-28', 'Produits de nettoyage', '🧹'),
('Matériel informatique', 15000, '2026-02-25', 'Clavier et souris', '⌨️'),
('Maintenance serrurerie', 3000, '2026-02-20', 'Réparation des portes', '🔧');

-- Sample Vehicle Expenses (requires car_id from cars table)
-- Note: Replace 'car-id-here' with actual car UUID from your database
INSERT INTO public.vehicle_expenses (car_id, type, cost, date, current_mileage, next_vidange_km, note, expense_name) VALUES
((SELECT id FROM public.cars LIMIT 1), 'vidange', 5000, '2026-03-01', 45000, 50000, 'Oil change service', 'Vidange moteur'),
((SELECT id FROM public.cars LIMIT 1), 'assurance', 8000, '2026-02-01', NULL, NULL, 'Monthly insurance', 'Prime d\'assurance');
*/

-- =========================================
-- UPDATE STATISTICS
-- =========================================

ANALYZE public.store_expenses;
ANALYZE public.vehicle_expenses;
