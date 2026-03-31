-- FINAL FIX: Drop ALL old restrictive policies and create permissive ones
-- This ensures workers CAN see all data

-- ========================================
-- 1. DROP ALL OLD RESTRICTIVE POLICIES
-- ========================================

-- Drop ALL policies on clients table
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to create clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage their agency clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "authenticated_users_full_access_clients" ON public.clients;

-- Drop ALL policies on reservations table
DROP POLICY IF EXISTS "Allow authenticated to manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can manage reservations for their agency" ON public.reservations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.reservations;
DROP POLICY IF EXISTS "authenticated_users_full_access_reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can manage inspection photos through reservations" ON public.reservations;

-- Drop ALL policies on cars table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.cars;
DROP POLICY IF EXISTS "Users can manage their agency cars" ON public.cars;
DROP POLICY IF EXISTS "Allow authenticated users to manage cars" ON public.cars;
DROP POLICY IF EXISTS "authenticated_users_full_access_cars" ON public.cars;

-- Drop ALL policies on workers table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.workers;
DROP POLICY IF EXISTS "authenticated_users_full_access_workers" ON public.workers;

-- Drop ALL policies on agencies table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.agencies;
DROP POLICY IF EXISTS "authenticated_users_full_access_agencies" ON public.agencies;

-- Drop policies on optional tables (safely)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.payments;
    DROP POLICY IF EXISTS "authenticated_users_full_access_payments" ON public.payments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.invoices;
    DROP POLICY IF EXISTS "authenticated_users_full_access_invoices" ON public.invoices;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_expenses' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.vehicle_expenses;
    DROP POLICY IF EXISTS "authenticated_users_full_access_vehicle_expenses" ON public.vehicle_expenses;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_alerts' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.maintenance_alerts;
    DROP POLICY IF EXISTS "authenticated_users_full_access_maintenance_alerts" ON public.maintenance_alerts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_expenses' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.store_expenses;
    DROP POLICY IF EXISTS "authenticated_users_full_access_store_expenses" ON public.store_expenses;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_orders' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.website_orders;
    DROP POLICY IF EXISTS "authenticated_users_full_access_website_orders" ON public.website_orders;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can manage document templates for their agency" ON public.document_templates;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.document_templates;
    DROP POLICY IF EXISTS "authenticated_users_full_access_document_templates" ON public.document_templates;
  END IF;
END $$;

-- ========================================
-- 2. CREATE NEW PERMISSIVE POLICIES
-- ========================================

-- CLIENTS TABLE - Full access for authenticated users
CREATE POLICY "authenticated_users_full_access_clients"
ON public.clients
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- RESERVATIONS TABLE - Full access for authenticated users
CREATE POLICY "authenticated_users_full_access_reservations"
ON public.reservations
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- CARS TABLE - Full access for authenticated users
CREATE POLICY "authenticated_users_full_access_cars"
ON public.cars
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- WORKERS TABLE - Full access for authenticated users
CREATE POLICY "authenticated_users_full_access_workers"
ON public.workers
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- AGENCIES TABLE - Full access for authenticated users
CREATE POLICY "authenticated_users_full_access_agencies"
ON public.agencies
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- PAYMENTS TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_payments"
    ON public.payments
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- INVOICES TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_invoices"
    ON public.invoices
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- VEHICLE_EXPENSES TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_expenses' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_vehicle_expenses"
    ON public.vehicle_expenses
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- MAINTENANCE_ALERTS TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_alerts' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_maintenance_alerts"
    ON public.maintenance_alerts
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- STORE_EXPENSES TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_expenses' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_store_expenses"
    ON public.store_expenses
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- WEBSITE_ORDERS TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_orders' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_website_orders"
    ON public.website_orders
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- DOCUMENT_TEMPLATES TABLE - Full access for authenticated users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates' AND table_schema = 'public') THEN
    CREATE POLICY "authenticated_users_full_access_document_templates"
    ON public.document_templates
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ========================================
-- 3. VERIFY POLICIES ARE REMOVED AND CREATED
-- ========================================

SELECT 
  schemaname,
  tablename, 
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'reservations', 'cars', 'workers', 'agencies')
GROUP BY schemaname, tablename
ORDER BY tablename;
