-- FIX WORKER DATA ACCESS - Remove RLS blocking
-- Workers login via RPC (not Supabase Auth), so auth.role() = 'anon'
-- This script disables RLS for all tables or allows 'anon' access

-- ========================================
-- SOLUTION 1: Disable RLS on all tables
-- (Simple, allows all access without Supabase Auth)
-- ========================================

-- Disable RLS on clients table
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on reservations table
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on cars table
ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;

-- Disable RLS on workers table
ALTER TABLE public.workers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on agencies table
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on optional tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
    ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
    ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_expenses' AND table_schema = 'public') THEN
    ALTER TABLE public.vehicle_expenses DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_expenses' AND table_schema = 'public') THEN
    ALTER TABLE public.store_expenses DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_alerts' AND table_schema = 'public') THEN
    ALTER TABLE public.maintenance_alerts DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_orders' AND table_schema = 'public') THEN
    ALTER TABLE public.website_orders DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates' AND table_schema = 'public') THEN
    ALTER TABLE public.document_templates DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_contacts' AND table_schema = 'public') THEN
    ALTER TABLE public.website_contacts DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_settings' AND table_schema = 'public') THEN
    ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'special_offers' AND table_schema = 'public') THEN
    ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_settings' AND table_schema = 'public') THEN
    ALTER TABLE public.agency_settings DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inspections' AND table_schema = 'public') THEN
    ALTER TABLE public.inspections DISABLE ROW LEVEL SECURITY;
  END IF;

END $$;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'reservations', 'cars', 'workers', 'agencies', 'payments', 'invoices', 'vehicle_expenses', 'store_expenses', 'maintenance_alerts', 'website_orders', 'document_templates', 'website_contacts', 'website_settings', 'offers', 'special_offers', 'agency_settings', 'profiles', 'inspections')
ORDER BY tablename;
