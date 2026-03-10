-- SQL Migration: Add RLS policies to clients table
-- Run this in Supabase SQL Editor

-- Enable Row Level Security on clients table if not already enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to create clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON public.clients;

-- Create RLS policy for authenticated users to read all clients
CREATE POLICY "Allow authenticated users to read clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policy for authenticated users to insert clients
CREATE POLICY "Allow authenticated users to create clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policy for authenticated users to update clients
CREATE POLICY "Allow authenticated users to update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policy for authenticated users to delete clients
CREATE POLICY "Allow authenticated users to delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_first_name ON public.clients(first_name);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON public.clients(last_name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Update statistics
ANALYZE public.clients;