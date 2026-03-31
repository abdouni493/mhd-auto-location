# ✅ SQL FILE FIXED - NEW VERSION READY

## What Was Wrong

The SQL file tried to create policies on tables that don't exist in your database:
- ❌ `invoices` table doesn't exist
- ❌ `payments` table might not exist

This caused the error:
```
ERROR: 42P01: relation "public.invoices" does not exist
```

## What's Fixed

The updated `fix_admin_worker_access.sql` now:
✅ Checks if tables exist before creating policies  
✅ Uses conditional logic (DO/IF blocks)  
✅ Only creates policies on existing tables  
✅ Won't fail on missing tables  

## 🚀 How to Proceed

### Option 1: Execute Updated File (Recommended)
1. Open Supabase SQL Editor → New Query
2. Copy the updated `fix_admin_worker_access.sql`
3. Paste and click RUN
4. Should complete successfully ✅

### Option 2: Simpler Approach
If you want a simpler version that only handles the tables you have, use this:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to create clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage their agency clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.clients;

DROP POLICY IF EXISTS "Allow authenticated to manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can manage reservations for their agency" ON public.reservations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.reservations;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.cars;
DROP POLICY IF EXISTS "Users can manage their agency cars" ON public.cars;

-- Create new permissive policies
CREATE POLICY "authenticated_users_full_access_clients"
ON public.clients
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_full_access_reservations"
ON public.reservations
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_full_access_cars"
ON public.cars
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Additional tables that definitely exist
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
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.agencies;
    CREATE POLICY "authenticated_users_full_access_agencies"
    ON public.agencies
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_expenses' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.vehicle_expenses;
    CREATE POLICY "authenticated_users_full_access_vehicle_expenses"
    ON public.vehicle_expenses
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_alerts' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.maintenance_alerts;
    CREATE POLICY "authenticated_users_full_access_maintenance_alerts"
    ON public.maintenance_alerts
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_expenses' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.store_expenses;
    CREATE POLICY "authenticated_users_full_access_store_expenses"
    ON public.store_expenses
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_orders' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.website_orders;
    CREATE POLICY "authenticated_users_full_access_website_orders"
    ON public.website_orders
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
```

## Next Steps

1. **Use updated file:** Copy the new `fix_admin_worker_access.sql` (now fixed)
2. **Execute in Supabase:** SQL Editor → New Query → Paste → RUN
3. **Test login:** Go to http://localhost:3000 with `fatima.admin` / `admin123`
4. **Verify:** Should see clients and reservations data ✅

## Status

✅ SQL file updated  
✅ Error handling added  
✅ Ready to execute  

**Try running it again now!**
