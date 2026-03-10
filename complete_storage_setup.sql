-- =========================================
-- COMPLETE STORAGE BUCKETS SETUP
-- =========================================
-- This script sets up all storage buckets for the application

-- =========================================
-- CREATE STORAGE BUCKETS
-- =========================================

-- Create the cars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cars', 'cars', true)
ON CONFLICT (id) DO NOTHING;

-- Create the inspection storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection', 'inspection', true)
ON CONFLICT (id) DO NOTHING;

-- Create the clients storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('clients', 'clients', true)
ON CONFLICT (id) DO NOTHING;

-- Create the workers storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('workers', 'workers', true)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- STORAGE POLICIES FOR ALL BUCKETS
-- =========================================

-- ===== CARS BUCKET POLICIES =====
CREATE POLICY "Allow public access to car images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cars');

CREATE POLICY "Allow authenticated users to upload car images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update car images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cars'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'cars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete car images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cars'
  AND auth.role() = 'authenticated'
);

-- ===== INSPECTION BUCKET POLICIES =====
CREATE POLICY "Allow public access to inspection images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inspection');

CREATE POLICY "Allow authenticated users to upload inspection images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'inspection'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update inspection images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'inspection'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'inspection'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete inspection images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'inspection'
  AND auth.role() = 'authenticated'
);

-- ===== CLIENTS BUCKET POLICIES =====
CREATE POLICY "Allow public access to client images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'clients');

CREATE POLICY "Allow authenticated users to upload client images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'clients'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update client images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'clients'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'clients'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete client images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'clients'
  AND auth.role() = 'authenticated'
);

-- ===== WORKERS BUCKET POLICIES =====
-- (These might already exist from config_database_setup.sql, but ensuring they exist)
CREATE POLICY "Allow authenticated users to upload worker files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view worker files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'workers' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update worker files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete worker files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'workers'
  AND auth.role() = 'authenticated'
);

-- =========================================
-- GRANT PERMISSIONS
-- =========================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;

-- Grant permissions on storage.objects
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO authenticated;