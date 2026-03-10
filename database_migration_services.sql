-- Create services table for additional services
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category text NOT NULL CHECK (category = ANY (ARRAY['decoration'::text, 'equipment'::text, 'insurance'::text, 'service'::text])),
  service_name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price > 0::numeric),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_created_at ON public.services(created_at);

-- Insert default services
INSERT INTO public.services (category, service_name, description, price) VALUES
('equipment', 'Siège Bébé', 'Siège auto pour enfant', 500),
('equipment', 'GPS', 'Système de navigation', 300),
('insurance', 'Assurance Supplémentaire', 'Couverture étendue', 1000),
('service', 'Conducteur Additionnel', 'Deuxième conducteur autorisé', 800),
('decoration', 'Décoration Mariage', 'Décoration complète du véhicule', 2000),
('service', 'Chauffeur Professionnel', 'Service de chauffeur expérimenté', 1500);

-- Create RLS policies for services table
CREATE POLICY "Allow public read access to active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to manage services" ON public.services
  FOR ALL USING (auth.role() = 'authenticated');

-- Add driver_caution column to reservation_services table
ALTER TABLE public.reservation_services ADD COLUMN IF NOT EXISTS driver_caution numeric DEFAULT 0;

-- Grant permissions
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.services TO anon;
