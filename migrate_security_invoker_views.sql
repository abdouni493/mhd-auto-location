-- Migration: Fix SECURITY DEFINER views to use SECURITY INVOKER
-- This resolves Supabase warnings about SECURITY DEFINER views

-- Drop and recreate admin_count view with SECURITY INVOKER
DROP VIEW IF EXISTS public.admin_count CASCADE;
CREATE VIEW public.admin_count WITH (security_invoker = true) AS
SELECT COUNT(*) as count
FROM public.workers
WHERE type = 'admin';

-- Drop and recreate reservation_with_departure_inspection view with SECURITY INVOKER
DROP VIEW IF EXISTS public.reservation_with_departure_inspection CASCADE;
CREATE VIEW public.reservation_with_departure_inspection WITH (security_invoker = true) AS
SELECT
  r.*,
  di.id as departure_inspection_id,
  di.mileage as departure_mileage,
  di.fuel_level as departure_fuel_level,
  di.date as departure_inspection_date,
  di.time as departure_inspection_time,
  di.notes as departure_notes,
  di.exterior_front_photo,
  di.exterior_rear_photo,
  di.interior_photo,
  di.client_signature as departure_signature,
  da.name as departure_agency_name,
  da.address as departure_agency_address
FROM public.reservations r
LEFT JOIN public.vehicle_inspections di ON r.id = di.reservation_id AND di.type = 'departure'
LEFT JOIN public.agencies da ON r.departure_agency_id = da.id;
