-- =========================================
-- WORKERS MANAGEMENT SYSTEM - FULL SQL CODE
-- =========================================
-- Run this in Supabase SQL Editor to set up the complete workers system

-- =========================================
-- CREATE TABLES FIRST
-- =========================================

-- Workers table
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  date_of_birth date,
  phone text NOT NULL,
  email text NOT NULL,
  address text,
  profile_photo text,
  type text NOT NULL CHECK (type = ANY (ARRAY['admin'::text, 'worker'::text, 'driver'::text])),
  payment_type text CHECK (payment_type = ANY (ARRAY['daily'::text, 'monthly'::text])),
  base_salary integer NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workers_pkey PRIMARY KEY (id)
);

-- Worker advances table
CREATE TABLE IF NOT EXISTS public.worker_advances (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  worker_id uuid NOT NULL,
  amount integer NOT NULL,
  date date NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worker_advances_pkey PRIMARY KEY (id),
  CONSTRAINT worker_advances_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE
);

-- Worker absences table
CREATE TABLE IF NOT EXISTS public.worker_absences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  worker_id uuid NOT NULL,
  cost integer NOT NULL,
  date date NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worker_absences_pkey PRIMARY KEY (id),
  CONSTRAINT worker_absences_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE
);

-- Worker payments table
CREATE TABLE IF NOT EXISTS public.worker_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  worker_id uuid NOT NULL,
  amount integer NOT NULL,
  date date NOT NULL,
  base_salary integer NOT NULL,
  advances integer DEFAULT 0,
  absences integer DEFAULT 0,
  net_salary integer NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worker_payments_pkey PRIMARY KEY (id),
  CONSTRAINT worker_payments_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE
);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read workers" ON public.workers;
DROP POLICY IF EXISTS "Allow authenticated users to create workers" ON public.workers;
DROP POLICY IF EXISTS "Allow authenticated users to update workers" ON public.workers;
DROP POLICY IF EXISTS "Allow authenticated users to delete workers" ON public.workers;

DROP POLICY IF EXISTS "Allow authenticated users to read worker_advances" ON public.worker_advances;
DROP POLICY IF EXISTS "Allow authenticated users to create worker_advances" ON public.worker_advances;
DROP POLICY IF EXISTS "Allow authenticated users to delete worker_advances" ON public.worker_advances;

DROP POLICY IF EXISTS "Allow authenticated users to read worker_absences" ON public.worker_absences;
DROP POLICY IF EXISTS "Allow authenticated users to create worker_absences" ON public.worker_absences;
DROP POLICY IF EXISTS "Allow authenticated users to delete worker_absences" ON public.worker_absences;

DROP POLICY IF EXISTS "Allow authenticated users to read worker_payments" ON public.worker_payments;
DROP POLICY IF EXISTS "Allow authenticated users to create worker_payments" ON public.worker_payments;
DROP POLICY IF EXISTS "Allow authenticated users to delete worker_payments" ON public.worker_payments;

-- =========================================
-- WORKERS TABLE POLICIES
-- =========================================

-- Workers - SELECT policy
CREATE POLICY "Allow authenticated users to read workers"
  ON public.workers
  FOR SELECT
  TO authenticated
  USING (true);

-- Workers - INSERT policy
CREATE POLICY "Allow authenticated users to create workers"
  ON public.workers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Workers - UPDATE policy
CREATE POLICY "Allow authenticated users to update workers"
  ON public.workers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workers - DELETE policy
CREATE POLICY "Allow authenticated users to delete workers"
  ON public.workers
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- WORKER ADVANCES TABLE POLICIES
-- =========================================

-- Worker Advances - SELECT policy
CREATE POLICY "Allow authenticated users to read worker_advances"
  ON public.worker_advances
  FOR SELECT
  TO authenticated
  USING (true);

-- Worker Advances - INSERT policy
CREATE POLICY "Allow authenticated users to create worker_advances"
  ON public.worker_advances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Worker Advances - DELETE policy
CREATE POLICY "Allow authenticated users to delete worker_advances"
  ON public.worker_advances
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- WORKER ABSENCES TABLE POLICIES
-- =========================================

-- Worker Absences - SELECT policy
CREATE POLICY "Allow authenticated users to read worker_absences"
  ON public.worker_absences
  FOR SELECT
  TO authenticated
  USING (true);

-- Worker Absences - INSERT policy
CREATE POLICY "Allow authenticated users to create worker_absences"
  ON public.worker_absences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Worker Absences - DELETE policy
CREATE POLICY "Allow authenticated users to delete worker_absences"
  ON public.worker_absences
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- WORKER PAYMENTS TABLE POLICIES
-- =========================================

-- Worker Payments - SELECT policy
CREATE POLICY "Allow authenticated users to read worker_payments"
  ON public.worker_payments
  FOR SELECT
  TO authenticated
  USING (true);

-- Worker Payments - INSERT policy
CREATE POLICY "Allow authenticated users to create worker_payments"
  ON public.worker_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Worker Payments - DELETE policy
CREATE POLICY "Allow authenticated users to delete worker_payments"
  ON public.worker_payments
  FOR DELETE
  TO authenticated
  USING (true);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Workers indexes
CREATE INDEX IF NOT EXISTS idx_workers_full_name ON public.workers(full_name);
CREATE INDEX IF NOT EXISTS idx_workers_email ON public.workers(email);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON public.workers(phone);
CREATE INDEX IF NOT EXISTS idx_workers_type ON public.workers(type);
CREATE INDEX IF NOT EXISTS idx_workers_created_at ON public.workers(created_at DESC);

-- Worker advances indexes
CREATE INDEX IF NOT EXISTS idx_worker_advances_worker_id ON public.worker_advances(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_advances_date ON public.worker_advances(date DESC);

-- Worker absences indexes
CREATE INDEX IF NOT EXISTS idx_worker_absences_worker_id ON public.worker_absences(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_absences_date ON public.worker_absences(date DESC);

-- Worker payments indexes
CREATE INDEX IF NOT EXISTS idx_worker_payments_worker_id ON public.worker_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_date ON public.worker_payments(date DESC);

-- =========================================
-- SAMPLE DATA (Optional - for testing)
-- =========================================

-- Insert sample workers (uncomment to use)
-- Note: Using gen_random_uuid() for UUID generation
/*
INSERT INTO public.workers (id, full_name, date_of_birth, phone, email, address, type, payment_type, base_salary, username, password) VALUES
(gen_random_uuid(), 'Ahmed Boudjellal', '1990-05-15', '+213 5 1234 5678', 'ahmed.boudjellal@email.com', 'Alger, Algeria', 'driver', 'daily', 3500, 'ahmed.boudj', 'SecurePass123'),
(gen_random_uuid(), 'Fatima Zahra', '1988-03-20', '+213 5 9876 5432', 'fatima.zahra@email.com', 'Oran, Algeria', 'admin', 'monthly', 45000, 'fatima.zahra', 'Admin@Pass456');

-- Insert sample advances (uncomment after inserting workers above)
-- Note: Replace 'worker_uuid_here' with actual worker UUIDs from above
/*
INSERT INTO public.worker_advances (id, worker_id, amount, date, note) VALUES
(gen_random_uuid(), (SELECT id FROM public.workers WHERE username = 'ahmed.boudj' LIMIT 1), 500, '2026-02-15', 'Emergency'),
(gen_random_uuid(), (SELECT id FROM public.workers WHERE username = 'ahmed.boudj' LIMIT 1), 300, '2026-02-28', 'Family support');

-- Insert sample absences
INSERT INTO public.worker_absences (id, worker_id, cost, date, note) VALUES
(gen_random_uuid(), (SELECT id FROM public.workers WHERE username = 'ahmed.boudj' LIMIT 1), 350, '2026-03-01', 'Sick leave'),
(gen_random_uuid(), (SELECT id FROM public.workers WHERE username = 'ahmed.boudj' LIMIT 1), 350, '2026-03-02', 'Medical appointment');

-- Insert sample payments
INSERT INTO public.worker_payments (id, worker_id, amount, date, base_salary, advances, absences, net_salary, note) VALUES
(gen_random_uuid(), (SELECT id FROM public.workers WHERE username = 'ahmed.boudj' LIMIT 1), 2800, '2026-03-01', 3500, 800, 700, 2800, 'Monthly payment');
*/
*/

-- =========================================
-- STORAGE BUCKET POLICIES FOR WORKER IMAGES
-- =========================================

-- NOTE: the following commands target the system-owned `storage.objects`
-- table. Ordinary authenticated roles *cannot* execute ALTER or CREATE
-- POLICY statements on this table, which results in the "must be owner"
-- error you encountered.  To avoid that, either:
--   1. run these lines as the project owner (service_role / "Run as admin"),
--      OR
--   2. manage the bucket policies via the Supabase dashboard instead.
--
-- The rest of the migration script (table creation, RLS on your own
-- tables, indexes, etc.) does not depend on these commands and can be
-- executed by any authenticated user.
--
-- If you prefer to skip them entirely, simply comment them out or remove
-- this block from your migration.  Below is the recommended block left
-- commented for reference:
--
-- -- Enable RLS on storage.objects
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--
-- -- Drop existing policies for worker bucket
-- DROP POLICY IF EXISTS "Allow authenticated uploads to worker bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated reads from worker bucket" ON storage.objects;
--
-- -- Allow authenticated users to upload to worker bucket
-- CREATE POLICY "Allow authenticated uploads to worker bucket"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'worker');
--
-- -- Allow authenticated users to read from worker bucket
-- CREATE POLICY "Allow authenticated reads from worker bucket"
--   ON storage.objects
--   FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'worker');
--
-- -- Allow authenticated users to update/delete their own uploads
-- CREATE POLICY "Allow authenticated updates to worker bucket"
--   ON storage.objects
--   FOR UPDATE
--   TO authenticated
--   USING (bucket_id = 'worker');
--
-- CREATE POLICY "Allow authenticated deletes from worker bucket"
--   ON storage.objects
--   FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'worker');

-- =========================================
-- UPDATE STATISTICS
-- =========================================

ANALYZE public.workers;
ANALYZE public.worker_advances;
ANALYZE public.worker_absences;
ANALYZE public.worker_payments;