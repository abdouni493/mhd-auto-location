-- ============================================================================
-- COPY EVERYTHING BELOW THIS LINE AND PASTE IN SUPABASE SQL EDITOR
-- ============================================================================

-- STEP 1: DELETE OLD POLICIES (that are causing permission errors)
DROP POLICY IF EXISTS "Workers can complete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Workers can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Workers can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Workers can manage inspections" ON public.vehicle_inspections;
DROP POLICY IF EXISTS "Workers can manage inspection responses" ON public.inspection_responses;
DROP POLICY IF EXISTS "Workers can update car mileage" ON public.cars;
DROP POLICY IF EXISTS "Anyone can view cars" ON public.cars;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.reservations;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON public.reservations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.reservations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.reservations;

-- STEP 2: CREATE NEW SIMPLE POLICIES (allow all authenticated users)

-- RESERVATIONS: Anyone logged in can do anything
CREATE POLICY "allow_authenticated" ON public.reservations
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- VEHICLE INSPECTIONS: Anyone logged in can do anything
CREATE POLICY "allow_authenticated" ON public.vehicle_inspections
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- INSPECTION RESPONSES: Anyone logged in can do anything
CREATE POLICY "allow_authenticated" ON public.inspection_responses
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- CARS: Anyone logged in can do anything
CREATE POLICY "allow_authenticated" ON public.cars
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============================================================================
-- THAT'S IT! NOW:
-- 1. Click the green "Run" button
-- 2. Wait for success message
-- 3. Go back to your app
-- 4. Click "Terminer" button
-- 5. Should work now!
-- ============================================================================
