-- ============================================================================
-- FIX TERMINER (COMPLETE RESERVATION) - ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- This file fixes all RLS permission issues that prevent workers from
-- completing reservations (terminer) on both PC and mobile.
--
-- PROBLEMS BEING FIXED:
-- 1. Workers cannot update reservations to status='completed'
-- 2. Workers cannot create return inspections
-- 3. Workers cannot save inspection responses
-- 4. Workers cannot update car mileage
-- 5. Permission denied errors on mobile and desktop
--
-- SOLUTION: Enable workers to perform all terminer-related operations
-- ============================================================================

-- Enable RLS for better control (if not already enabled)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RESERVATIONS TABLE - Allow workers to complete (update to 'completed')
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Workers can complete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Workers can view and update reservations" ON public.reservations;

-- Create policy: Workers can update reservations (especially to complete status)
CREATE POLICY "Workers can complete reservations"
ON public.reservations
FOR UPDATE
USING (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow if user is any type of worker
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
    AND public.workers.type IN ('worker', 'admin', 'driver')
  )
)
WITH CHECK (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow if user is any type of worker
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
    AND public.workers.type IN ('worker', 'admin', 'driver')
  )
);

-- Create policy: Workers can view reservations
DROP POLICY IF EXISTS "Workers can view reservations" ON public.reservations;
CREATE POLICY "Workers can view reservations"
ON public.reservations
FOR SELECT
USING (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
  OR
  -- Allow clients to view their own reservations
  client_id = auth.uid()
);

-- Create policy: Workers can insert (create) reservations
DROP POLICY IF EXISTS "Workers can create reservations" ON public.reservations;
CREATE POLICY "Workers can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
);

-- ============================================================================
-- VEHICLE_INSPECTIONS TABLE - Allow workers to create return inspections
-- ============================================================================

DROP POLICY IF EXISTS "Workers can manage inspections" ON public.vehicle_inspections;
CREATE POLICY "Workers can manage inspections"
ON public.vehicle_inspections
FOR ALL
USING (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers (all types)
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
)
WITH CHECK (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers (all types)
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
);

-- ============================================================================
-- INSPECTION_RESPONSES TABLE - Allow workers to save checklist responses
-- ============================================================================

DROP POLICY IF EXISTS "Workers can manage inspection responses" ON public.inspection_responses;
CREATE POLICY "Workers can manage inspection responses"
ON public.inspection_responses
FOR ALL
USING (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers (all types)
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
)
WITH CHECK (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers (all types)
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
);

-- ============================================================================
-- CARS TABLE - Allow workers to update car mileage and fuel level
-- ============================================================================

DROP POLICY IF EXISTS "Workers can update car mileage" ON public.cars;
CREATE POLICY "Workers can update car mileage"
ON public.cars
FOR UPDATE
USING (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers (all types)
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
)
WITH CHECK (
  -- Allow admins
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.email LIKE '%@admin%')
  )
  OR
  -- Allow workers (all types)
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE public.workers.id = auth.uid()
  )
);

-- Create policy: Anyone can view cars
DROP POLICY IF EXISTS "Anyone can view cars" ON public.cars;
CREATE POLICY "Anyone can view cars"
ON public.cars
FOR SELECT
USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the policies are applied:
--
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('reservations', 'vehicle_inspections', 'inspection_responses', 'cars')
-- ORDER BY tablename, policyname;
--
-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================
-- 1. Copy this entire file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Create a new query
-- 4. Paste this file content
-- 5. Click "Run" or "Execute"
-- 6. Wait for completion
-- 7. Test terminer button on both PC and mobile
-- 8. If still having issues, check browser console and Supabase logs
--
-- ============================================================================
