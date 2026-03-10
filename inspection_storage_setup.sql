-- =========================================
-- INSPECTION STORAGE BUCKET SETUP
-- =========================================
-- This script sets up the inspection storage bucket
-- for vehicle inspection photos

-- Create the inspection storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection', 'inspection', true)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- STORAGE POLICIES FOR INSPECTION BUCKET
-- =========================================

-- Allow public access to view inspection images
CREATE POLICY "Allow public access to inspection images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inspection');

-- Allow authenticated users to upload inspection images
CREATE POLICY "Allow authenticated users to upload inspection images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'inspection'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update inspection images
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

-- Allow authenticated users to delete inspection images
CREATE POLICY "Allow authenticated users to delete inspection images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'inspection'
  AND auth.role() = 'authenticated'
);

-- =========================================
-- GRANT PERMISSIONS
-- =========================================

-- Grant permissions on storage.objects for inspection bucket
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;