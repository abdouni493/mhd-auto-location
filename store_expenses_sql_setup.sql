-- =========================================
-- STORE EXPENSES MANAGEMENT SYSTEM
-- =========================================
-- SQL setup for 🏪 Dépenses du Magasin
-- This connects the store_expenses table with RLS policies and optimizations

-- =========================================
-- VERIFY TABLE EXISTS
-- =========================================

-- The store_expenses table should already exist in your database
-- If not, uncomment below to create it:
/*
CREATE TABLE IF NOT EXISTS public.store_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  icon text DEFAULT '🏪'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_expenses_pkey PRIMARY KEY (id)
);
*/

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.store_expenses ENABLE ROW LEVEL SECURITY;

-- =========================================
-- DROP EXISTING POLICIES (IF ANY)
-- =========================================

DROP POLICY IF EXISTS "Allow authenticated users to read store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to create store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete store_expenses" ON public.store_expenses;

-- =========================================
-- STORE EXPENSES RLS POLICIES
-- =========================================

-- Store Expenses - SELECT policy (Read)
CREATE POLICY "Allow authenticated users to read store_expenses"
  ON public.store_expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Store Expenses - INSERT policy (Create)
CREATE POLICY "Allow authenticated users to create store_expenses"
  ON public.store_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Store Expenses - UPDATE policy (Edit)
CREATE POLICY "Allow authenticated users to update store_expenses"
  ON public.store_expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Store Expenses - DELETE policy (Delete)
CREATE POLICY "Allow authenticated users to delete store_expenses"
  ON public.store_expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_store_expenses_date ON public.store_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_store_expenses_name ON public.store_expenses(name);
CREATE INDEX IF NOT EXISTS idx_store_expenses_created_at ON public.store_expenses(created_at DESC);

-- =========================================
-- SAMPLE DATA (Optional - for testing)
-- =========================================

-- Uncomment below to insert sample store expenses for testing

/*
INSERT INTO public.store_expenses (name, cost, date, note, icon) VALUES
('Café office - Arabica premium', 500, '2026-03-08', 'Café pour la pause café du personnel', '☕'),
('Fournitures de nettoyage', 2000, '2026-03-07', 'Produits de nettoyage (savon, desinfectant, balais)', '🧹'),
('Matériel informatique', 15000, '2026-03-06', 'Clavier sans fil et souris optique', '⌨️'),
('Maintenance serrurerie', 3000, '2026-03-05', 'Réparation des serrures portes bureaux', '🔧'),
('Fournitures papier', 1200, '2026-03-04', 'A4 blanc, cahiers, stylos, trombones', '📋'),
('Éclairage LED', 8500, '2026-03-03', '10x LED ampoules 10W pour bureau', '💡'),
('Eau potable (fontaine)', 350, '2026-03-02', 'Bonbonnes d\'eau 20L (x2)', '💧'),
('Maintenance électrique', 5000, '2026-03-01', 'Révision tableau électrique et prises', '🔌');
*/

-- =========================================
-- VERIFY TABLE STRUCTURE
-- =========================================

-- Check columns match expected schema:
-- id (uuid, primary key)
-- name (text, not null)
-- cost (integer, default 0)
-- date (date, default current_date)
-- note (text, optional)
-- icon (text, default '🏪')
-- created_at (timestamp, default now())

-- Run this to verify:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'store_expenses'
-- ORDER BY ordinal_position;

-- =========================================
-- UPDATE STATISTICS
-- =========================================

ANALYZE public.store_expenses;
