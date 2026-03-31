-- Fix Admin/Worker Login - Remove RLS Restrictions
-- This script removes restrictive RLS policies and allows admin/workers to see all data
-- Execute this in Supabase SQL Editor

-- ========================================
-- 1. DROP EXISTING RESTRICTIVE POLICIES
-- ========================================

-- Drop restrictive policies on clients table
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to create clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage their agency clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.clients;

-- Drop restrictive policies on reservations table
DROP POLICY IF EXISTS "Allow authenticated to manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can manage reservations for their agency" ON public.reservations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.reservations;

-- Drop restrictive policies on cars table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.cars;
DROP POLICY IF EXISTS "Users can manage their agency cars" ON public.cars;

-- Drop restrictive policies on payments table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.payments;
  END IF;
END $$;

-- Drop restrictive policies on invoices table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.invoices;
  END IF;
END $$;

-- ========================================
-- 2. CREATE PERMISSIVE POLICIES
-- ========================================

-- CLIENTS TABLE - Allow all authenticated users to perform all operations
CREATE POLICY "authenticated_users_full_access_clients"
ON public.clients
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- RESERVATIONS TABLE - Allow all authenticated users to perform all operations
CREATE POLICY "authenticated_users_full_access_reservations"
ON public.reservations
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- CARS TABLE - Allow all authenticated users to view and manage
CREATE POLICY "authenticated_users_full_access_cars"
ON public.cars
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- PAYMENTS TABLE - Allow all authenticated users to view and manage (if table exists)
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

-- INVOICES TABLE - Allow all authenticated users to view and manage (if table exists)
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

-- ========================================
-- 3. ADDITIONAL PERMISSIVE POLICIES
-- ========================================

-- WORKERS TABLE (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workers' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.workers;
    CREATE POLICY "authenticated_users_full_access_workers"
    ON public.workers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- AGENCIES TABLE (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.agencies;
    CREATE POLICY "authenticated_users_full_access_agencies"
    ON public.agencies
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- VEHICLE_EXPENSES TABLE (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_expenses' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.vehicle_expenses;
    CREATE POLICY "authenticated_users_full_access_vehicle_expenses"
    ON public.vehicle_expenses
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- MAINTENANCE_ALERTS TABLE (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_alerts' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.maintenance_alerts;
    CREATE POLICY "authenticated_users_full_access_maintenance_alerts"
    ON public.maintenance_alerts
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- STORE_EXPENSES TABLE (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_expenses' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.store_expenses;
    CREATE POLICY "authenticated_users_full_access_store_expenses"
    ON public.store_expenses
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- WEBSITE_ORDERS TABLE (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_orders' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.website_orders;
    CREATE POLICY "authenticated_users_full_access_website_orders"
    ON public.website_orders
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ========================================
-- 4. VERIFY POLICIES APPLIED
-- ========================================

-- Check that policies are in place on existing tables
SELECT 'clients' as table_name, COUNT(*) as policy_count 
FROM information_schema.role_table_grants 
WHERE table_name = 'clients' AND grantee = 'authenticated'

UNION ALL

SELECT 'reservations', COUNT(*) 
FROM information_schema.role_table_grants 
WHERE table_name = 'reservations' AND grantee = 'authenticated'

UNION ALL

SELECT 'cars', COUNT(*) 
FROM information_schema.role_table_grants 
WHERE table_name = 'cars' AND grantee = 'authenticated';

-- Done! All authenticated users (admin/workers) now have full access to all data that exists
