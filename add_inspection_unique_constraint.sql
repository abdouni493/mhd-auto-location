-- Add unique constraint to prevent duplicate inspections per reservation/type
ALTER TABLE public.vehicle_inspections
ADD CONSTRAINT unique_reservation_type_inspection UNIQUE (reservation_id, type);

-- Optionally, drop old duplicates first (run cleanup script before creating constraint)
