-- Add column to track who created the reservation
ALTER TABLE public.reservations
ADD COLUMN created_by uuid,
ADD COLUMN created_by_name text,
ADD CONSTRAINT reservations_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.workers(id);

-- Add index for better query performance
CREATE INDEX idx_reservations_created_by ON public.reservations(created_by);

-- Optional: Add comment for documentation
COMMENT ON COLUMN public.reservations.created_by IS 'ID of the worker/admin who created this reservation';
COMMENT ON COLUMN public.reservations.created_by_name IS 'Name of the worker/admin who created this reservation (denormalized for performance)';
