-- =========================================
-- RESERVATIONS DATABASE SETUP
-- Complete database schema for the reservation system
-- =========================================

-- =========================================
-- 1. RESERVATIONS TABLE (Main reservation data)
-- =========================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL,
  car_id uuid NOT NULL,
  
  -- Departure Information
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  departure_agency_id uuid NOT NULL,
  
  -- Return Information
  return_date date NOT NULL,
  return_time time NOT NULL,
  return_agency_id uuid NOT NULL,
  
  -- Pricing Information
  price_per_day numeric NOT NULL,
  price_week numeric,
  price_month numeric,
  total_days integer NOT NULL,
  total_price numeric NOT NULL,
  deposit numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')),
  advance_payment numeric DEFAULT 0,
  remaining_payment numeric NOT NULL,
  tva_applied boolean DEFAULT false,
  tva_amount numeric DEFAULT 0,
  additional_fees numeric DEFAULT 0,
  excess_mileage numeric DEFAULT 0,
  missing_fuel numeric DEFAULT 0,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  
  -- Notes
  notes text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  activated_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- Foreign Keys
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
  CONSTRAINT reservations_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE,
  CONSTRAINT reservations_departure_agency_fkey FOREIGN KEY (departure_agency_id) REFERENCES public.agencies(id),
  CONSTRAINT reservations_return_agency_fkey FOREIGN KEY (return_agency_id) REFERENCES public.agencies(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS reservations_client_id_idx ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS reservations_car_id_idx ON public.reservations(car_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations(status);
CREATE INDEX IF NOT EXISTS reservations_departure_date_idx ON public.reservations(departure_date);

-- =========================================
-- 2. VEHICLE INSPECTIONS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_id uuid NOT NULL,
  
  -- Inspection Type (departure or return)
  type text NOT NULL CHECK (type IN ('departure', 'return')),
  
  -- Vehicle Condition
  mileage integer NOT NULL,
  fuel_level text NOT NULL CHECK (fuel_level IN ('full', 'half', 'quarter', 'eighth', 'empty')),
  
  -- Inspection Location
  agency_id uuid NOT NULL,
  
  -- Photos (stored as URLs to storage bucket)
  exterior_front_photo text,
  exterior_rear_photo text,
  interior_photo text,
  other_photos text[] DEFAULT '{}',
  
  -- Client Signature (stored as URL to storage bucket)
  client_signature text,
  
  -- Notes
  notes text,
  
  -- Timestamps
  date date NOT NULL,
  time time NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  -- Foreign Keys
  CONSTRAINT vehicle_inspections_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_inspections_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_inspections_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);

CREATE INDEX IF NOT EXISTS vehicle_inspections_reservation_id_idx ON public.vehicle_inspections(reservation_id);
CREATE INDEX IF NOT EXISTS vehicle_inspections_type_idx ON public.vehicle_inspections(type);

-- =========================================
-- 3. INSPECTION CHECKLIST ITEMS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.inspection_checklist_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Item categorization
  category text NOT NULL CHECK (category IN ('securite', 'equipements', 'confort')),
  item_name text NOT NULL,
  
  -- Item display order
  display_order integer NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT inspection_checklist_items_pkey PRIMARY KEY (id),
  CONSTRAINT inspection_checklist_items_unique UNIQUE (category, item_name)
);

-- Insert default checklist items
INSERT INTO public.inspection_checklist_items (category, item_name, display_order) VALUES
-- Sécurité
('securite', 'Ceintures de sécurité', 1),
('securite', 'Freins', 2),
('securite', 'Feux', 3),
('securite', 'Pneus', 4),
('securite', 'Direction', 5),
('securite', 'Klaxon', 6),
('securite', 'Rétroviseurs', 7),
('securite', 'Essuie-glaces', 8),
('securite', 'Airbags', 9),
('securite', 'Triangle de signalisation', 10),
('securite', 'Extincteur', 11),
('securite', 'Cric et roue de secours', 12),
-- Équipements
('equipements', 'GPS', 1),
('equipements', 'Siège bébé', 2),
('equipements', 'Chaîne neige', 3),
('equipements', 'Câbles de démarrage', 4),
('equipements', 'Kit de premiers secours', 5),
('equipements', 'Radio/CD', 6),
('equipements', 'Climatisation', 7),
('equipements', 'Verrouillage centralisé', 8),
('equipements', 'Ouverture automatique portes', 9),
('equipements', 'Régulateur de vitesse', 10),
('equipements', 'Caméra de recul', 11),
('equipements', 'Capteurs de stationnement', 12),
-- Confort & Propreté
('confort', 'Sièges', 1),
('confort', 'Volant', 2),
('confort', 'Tableau de bord', 3),
('confort', 'Éclairage intérieur', 4),
('confort', 'Vitres électriques', 5),
('confort', 'Rétroviseurs électriques', 6),
('confort', 'Autoradio', 7),
('confort', 'Prises USB', 8),
('confort', 'Cendrier', 9),
('confort', 'Coffre-fort', 10),
('confort', 'Tapis de sol', 11),
('confort', 'Propreté générale', 12)
ON CONFLICT (category, item_name) DO NOTHING;

-- =========================================
-- 4. INSPECTION CHECKLIST RESPONSES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.inspection_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inspection_id uuid NOT NULL,
  checklist_item_id uuid NOT NULL,
  
  -- Status (true = OK, false = Issue found)
  status boolean NOT NULL,
  
  -- Optional notes about issues
  note text,
  
  CONSTRAINT inspection_responses_pkey PRIMARY KEY (id),
  CONSTRAINT inspection_responses_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.vehicle_inspections(id) ON DELETE CASCADE,
  CONSTRAINT inspection_responses_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES public.inspection_checklist_items(id) ON DELETE CASCADE,
  CONSTRAINT inspection_responses_unique UNIQUE (inspection_id, checklist_item_id)
);

CREATE INDEX IF NOT EXISTS inspection_responses_inspection_id_idx ON public.inspection_responses(inspection_id);

-- =========================================
-- 5. RESERVATION SERVICES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.reservation_services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_id uuid NOT NULL,
  
  -- Service Information
  category text NOT NULL CHECK (category IN ('decoration', 'equipment', 'insurance', 'service', 'driver')),
  service_name text NOT NULL,
  description text,
  price numeric NOT NULL,
  
  -- For driver service
  driver_id uuid,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT reservation_services_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_services_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE,
  CONSTRAINT reservation_services_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.workers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS reservation_services_reservation_id_idx ON public.reservation_services(reservation_id);

-- =========================================
-- 6. PAYMENTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_id uuid NOT NULL,
  
  -- Payment Information
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
  
  -- Status
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  
  -- Notes
  note text,
  
  -- Timestamps
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS payments_reservation_id_idx ON public.payments(reservation_id);

-- =========================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage reservations
CREATE POLICY "Allow authenticated to manage reservations" ON public.reservations
FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage inspections
CREATE POLICY "Allow authenticated to manage inspections" ON public.vehicle_inspections
FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to view and manage inspection responses
CREATE POLICY "Allow authenticated to manage inspection responses" ON public.inspection_responses
FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage reservation services
CREATE POLICY "Allow authenticated to manage services" ON public.reservation_services
FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage payments
CREATE POLICY "Allow authenticated to manage payments" ON public.payments
FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read-only access to checklist items
CREATE POLICY "Allow public to read checklist items" ON public.inspection_checklist_items
FOR SELECT USING (true);

-- =========================================
-- FIX: Add unique constraint to prevent duplicate services per reservation
-- =========================================

-- Add unique constraint to prevent duplicate services in the same reservation
ALTER TABLE public.reservation_services
ADD CONSTRAINT reservation_services_unique UNIQUE (reservation_id, service_name);

-- Create index for better performance on service lookups
CREATE INDEX IF NOT EXISTS reservation_services_reservation_service_idx
ON public.reservation_services(reservation_id, service_name);

-- =========================================
-- CLEANUP: Remove any existing duplicate services (keep the most recent)
-- =========================================

-- Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_services AS
SELECT
  reservation_id,
  service_name,
  COUNT(*) as duplicate_count,
  MAX(created_at) as latest_created_at
FROM public.reservation_services
GROUP BY reservation_id, service_name
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping only the most recent entry for each service per reservation
DELETE FROM public.reservation_services
WHERE (reservation_id, service_name, created_at) IN (
  SELECT
    rs.reservation_id,
    rs.service_name,
    rs.created_at
  FROM public.reservation_services rs
  INNER JOIN duplicate_services ds
    ON rs.reservation_id = ds.reservation_id
    AND rs.service_name = ds.service_name
    AND rs.created_at < ds.latest_created_at
);

-- Drop the temporary table
DROP TABLE duplicate_services;

-- =========================================
-- VERIFICATION: Check for remaining duplicates
-- =========================================

-- This query should return 0 rows after the cleanup
SELECT
  reservation_id,
  service_name,
  COUNT(*) as duplicate_count
FROM public.reservation_services
GROUP BY reservation_id, service_name
HAVING COUNT(*) > 1;
