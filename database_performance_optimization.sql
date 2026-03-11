-- =========================================
-- LUXDRIVE DATABASE OPTIMIZATION SCRIPT
-- Complete setup with performance optimizations for fast inserts and displays
-- =========================================

-- =========================================
-- 1. ENABLE ROW LEVEL SECURITY
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. PERFORMANCE INDEXES
-- =========================================

-- Reservations indexes (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_departure_date ON public.reservations(departure_date);
CREATE INDEX IF NOT EXISTS idx_reservations_return_date ON public.reservations(return_date);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_car_id ON public.reservations(car_id);
CREATE INDEX IF NOT EXISTS idx_reservations_departure_agency ON public.reservations(departure_agency_id);
CREATE INDEX IF NOT EXISTS idx_reservations_return_agency ON public.reservations(return_agency_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_status_date ON public.reservations(status, departure_date);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Cars indexes
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON public.cars(brand, model);
CREATE INDEX IF NOT EXISTS idx_cars_price_per_day ON public.cars(price_per_day);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at DESC);

-- Workers indexes
CREATE INDEX IF NOT EXISTS idx_workers_type ON public.workers(type);
CREATE INDEX IF NOT EXISTS idx_workers_username ON public.workers(username);
CREATE INDEX IF NOT EXISTS idx_workers_created_at ON public.workers(created_at DESC);

-- Vehicle inspections indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_reservation_id ON public.vehicle_inspections(reservation_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_type ON public.vehicle_inspections(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON public.vehicle_inspections(date);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_agency_id ON public.vehicle_inspections(agency_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON public.payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Vehicle expenses indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_car_id ON public.vehicle_expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type ON public.vehicle_expenses(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON public.vehicle_expenses(date);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_expiration_date ON public.vehicle_expenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type_date ON public.vehicle_expenses(type, date);

-- Store expenses indexes
CREATE INDEX IF NOT EXISTS idx_store_expenses_date ON public.store_expenses(date);
CREATE INDEX IF NOT EXISTS idx_store_expenses_created_at ON public.store_expenses(created_at DESC);

-- Document templates indexes
CREATE INDEX IF NOT EXISTS idx_document_templates_agency_id ON public.document_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON public.document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_updated_at ON public.document_templates(updated_at DESC);

-- Reservation services indexes
CREATE INDEX IF NOT EXISTS idx_reservation_services_reservation_id ON public.reservation_services(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_services_category ON public.reservation_services(category);

-- Worker payments indexes
CREATE INDEX IF NOT EXISTS idx_worker_payments_worker_id ON public.worker_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_date ON public.worker_payments(date);

-- Worker advances and absences indexes
CREATE INDEX IF NOT EXISTS idx_worker_advances_worker_id ON public.worker_advances(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_advances_date ON public.worker_advances(date);
CREATE INDEX IF NOT EXISTS idx_worker_absences_worker_id ON public.worker_absences(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_absences_date ON public.worker_absences(date);

-- Vehicle inspection photos indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_inspection_photos_inspection_id ON public.vehicle_inspection_photos(inspection_id);

-- Inspection responses indexes
CREATE INDEX IF NOT EXISTS idx_inspection_responses_inspection_id ON public.inspection_responses(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_responses_checklist_item_id ON public.inspection_responses(checklist_item_id);

-- =========================================
-- 3. ROW LEVEL SECURITY POLICIES
-- =========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to manage agencies" ON public.agencies;
DROP POLICY IF EXISTS "Allow authenticated users to manage agency_settings" ON public.agency_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage cars" ON public.cars;
DROP POLICY IF EXISTS "Users can manage their agency clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage document templates for their agency" ON public.document_templates;
DROP POLICY IF EXISTS "Allow authenticated to manage checklist items" ON public.inspection_checklist_items;
DROP POLICY IF EXISTS "Allow authenticated to manage inspection responses" ON public.inspection_responses;
DROP POLICY IF EXISTS "Allow authenticated users to manage offers" ON public.offers;
DROP POLICY IF EXISTS "Allow authenticated users to manage payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated users to manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage reservation services" ON public.reservation_services;
DROP POLICY IF EXISTS "Users can manage reservations for their agency" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated users to manage services" ON public.services;
DROP POLICY IF EXISTS "Allow authenticated users to manage special offers" ON public.special_offers;
DROP POLICY IF EXISTS "Allow authenticated users to manage store expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to manage vehicle expenses" ON public.vehicle_expenses;
DROP POLICY IF EXISTS "Users can manage inspection photos through reservations" ON public.vehicle_inspection_photos;
DROP POLICY IF EXISTS "Users can manage inspections for their agency" ON public.vehicle_inspections;
DROP POLICY IF EXISTS "Allow authenticated users to manage website contacts" ON public.website_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to manage website settings" ON public.website_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage worker absences" ON public.worker_absences;
DROP POLICY IF EXISTS "Allow authenticated users to manage worker advances" ON public.worker_advances;
DROP POLICY IF EXISTS "Allow authenticated users to manage worker payments" ON public.worker_payments;
DROP POLICY IF EXISTS "Users can manage workers for their agency" ON public.workers;

-- Agencies policies
CREATE POLICY "Allow authenticated users to manage agencies" ON public.agencies
FOR ALL USING (auth.role() = 'authenticated');

-- Agency settings policies
CREATE POLICY "Allow authenticated users to manage agency_settings" ON public.agency_settings
FOR ALL USING (auth.role() = 'authenticated');

-- Cars policies
CREATE POLICY "Allow authenticated users to manage cars" ON public.cars
FOR ALL USING (auth.role() = 'authenticated');

-- Clients policies (agency-based access)
CREATE POLICY "Users can manage their agency clients" ON public.clients
FOR ALL USING (
  agency_id IN (
    SELECT agency_id FROM public.workers
    WHERE id = auth.uid()
  )
);

-- Document templates policies (agency-based access)
CREATE POLICY "Users can manage document templates for their agency" ON public.document_templates
FOR ALL USING (
  agency_id IN (
    SELECT agency_id FROM public.workers
    WHERE id = auth.uid()
  )
);

-- Inspection checklist items policies
CREATE POLICY "Allow authenticated to manage checklist items" ON public.inspection_checklist_items
FOR ALL USING (auth.role() = 'authenticated');

-- Inspection responses policies
CREATE POLICY "Allow authenticated to manage inspection responses" ON public.inspection_responses
FOR ALL USING (auth.role() = 'authenticated');

-- Offers policies
CREATE POLICY "Allow authenticated users to manage offers" ON public.offers
FOR ALL USING (auth.role() = 'authenticated');

-- Payments policies
CREATE POLICY "Allow authenticated users to manage payments" ON public.payments
FOR ALL USING (auth.role() = 'authenticated');

-- Profiles policies
CREATE POLICY "Allow authenticated users to manage profiles" ON public.profiles
FOR ALL USING (auth.role() = 'authenticated');

-- Reservation services policies
CREATE POLICY "Allow authenticated users to manage reservation services" ON public.reservation_services
FOR ALL USING (auth.role() = 'authenticated');

-- Reservations policies (agency-based access through clients)
CREATE POLICY "Users can manage reservations for their agency" ON public.reservations
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE agency_id IN (
      SELECT agency_id FROM public.workers
      WHERE id = auth.uid()
    )
  )
);

-- Services policies
CREATE POLICY "Allow authenticated users to manage services" ON public.services
FOR ALL USING (auth.role() = 'authenticated');

-- Special offers policies
CREATE POLICY "Allow authenticated users to manage special offers" ON public.special_offers
FOR ALL USING (auth.role() = 'authenticated');

-- Store expenses policies
CREATE POLICY "Allow authenticated users to manage store expenses" ON public.store_expenses
FOR ALL USING (auth.role() = 'authenticated');

-- Vehicle expenses policies
CREATE POLICY "Allow authenticated users to manage vehicle expenses" ON public.vehicle_expenses
FOR ALL USING (auth.role() = 'authenticated');

-- Vehicle inspection photos policies (agency-based access)
CREATE POLICY "Users can manage inspection photos through reservations" ON public.vehicle_inspection_photos
FOR ALL USING (
  inspection_id IN (
    SELECT id FROM public.vehicle_inspections
    WHERE reservation_id IN (
      SELECT id FROM public.reservations
      WHERE client_id IN (
        SELECT id FROM public.clients
        WHERE agency_id IN (
          SELECT agency_id FROM public.workers
          WHERE id = auth.uid()
        )
      )
    )
  )
);

-- Vehicle inspections policies (agency-based access)
CREATE POLICY "Users can manage inspections for their agency" ON public.vehicle_inspections
FOR ALL USING (
  reservation_id IN (
    SELECT id FROM public.reservations
    WHERE client_id IN (
      SELECT id FROM public.clients
      WHERE agency_id IN (
        SELECT agency_id FROM public.workers
        WHERE id = auth.uid()
      )
    )
  )
);

-- Website contacts policies
CREATE POLICY "Allow authenticated users to manage website contacts" ON public.website_contacts
FOR ALL USING (auth.role() = 'authenticated');

-- Website settings policies
CREATE POLICY "Allow authenticated users to manage website settings" ON public.website_settings
FOR ALL USING (auth.role() = 'authenticated');

-- Worker absences policies
CREATE POLICY "Allow authenticated users to manage worker absences" ON public.worker_absences
FOR ALL USING (auth.role() = 'authenticated');

-- Worker advances policies
CREATE POLICY "Allow authenticated users to manage worker advances" ON public.worker_advances
FOR ALL USING (auth.role() = 'authenticated');

-- Worker payments policies
CREATE POLICY "Allow authenticated users to manage worker payments" ON public.worker_payments
FOR ALL USING (auth.role() = 'authenticated');

-- Workers policies (for now allow all authenticated users - can be refined later)
CREATE POLICY "Users can manage workers for their agency" ON public.workers
FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- 4. OPTIMIZED VIEWS
-- =========================================

-- Drop and recreate maintenance_alerts view with SECURITY INVOKER
DROP VIEW IF EXISTS public.maintenance_alerts CASCADE;
CREATE VIEW public.maintenance_alerts WITH (security_invoker = true) AS
SELECT
  v.id,
  v.car_id,
  CONCAT(c.brand, ' ', c.model, ' (', c.plate_number, ')') as car_info,
  v.type,
  CASE
    WHEN v.type = 'assurance' THEN 'Assurance Véhicule'
    WHEN v.type = 'controle' THEN 'Contrôle Technique'
    WHEN v.type = 'vidange' THEN 'Vidange Huile'
    ELSE 'Maintenance'
  END as title,
  CASE
    WHEN v.type = 'assurance' THEN CONCAT('Assurance expire le ', TO_CHAR(v.expiration_date, 'DD/MM/YYYY'))
    WHEN v.type = 'controle' THEN CONCAT('Contrôle technique expire le ', TO_CHAR(v.expiration_date, 'DD/MM/YYYY'))
    WHEN v.type = 'vidange' THEN
      CASE
        WHEN v.next_vidange_km IS NOT NULL AND c.mileage IS NOT NULL THEN
          CASE
            WHEN c.mileage >= v.next_vidange_km THEN 'Vidange requise immédiatement'
            WHEN c.mileage >= v.next_vidange_km - 1000 THEN CONCAT('Vidange bientôt requise (', (v.next_vidange_km - c.mileage), ' km restants)')
            ELSE CONCAT('Prochaine vidange à ', v.next_vidange_km, ' km')
          END
        ELSE 'Vidange requise'
      END
    ELSE 'Maintenance requise'
  END as message,
  CASE
    WHEN v.type = 'vidange' AND v.next_vidange_km IS NOT NULL AND c.mileage IS NOT NULL THEN
      CASE
        WHEN c.mileage >= v.next_vidange_km THEN 'critical'
        WHEN c.mileage >= v.next_vidange_km - 1000 THEN 'high'
        WHEN c.mileage >= v.next_vidange_km - 2000 THEN 'medium'
        ELSE 'low'
      END
    WHEN v.type IN ('assurance', 'controle') AND v.expiration_date IS NOT NULL THEN
      CASE
        WHEN v.expiration_date < CURRENT_DATE THEN 'critical'
        WHEN v.expiration_date - INTERVAL '30 days' < CURRENT_DATE THEN 'high'
        WHEN v.expiration_date - INTERVAL '60 days' < CURRENT_DATE THEN 'medium'
        ELSE 'low'
      END
    ELSE 'low'
  END as severity,
  v.expiration_date as due_date,
  CASE
    WHEN v.type IN ('assurance', 'controle') AND v.expiration_date < CURRENT_DATE THEN true
    WHEN v.type = 'vidange' AND v.next_vidange_km IS NOT NULL AND c.mileage IS NOT NULL AND c.mileage >= v.next_vidange_km THEN true
    ELSE false
  END as is_expired,
  CASE
    WHEN v.type IN ('assurance', 'controle') AND v.expiration_date IS NOT NULL THEN
      (v.expiration_date - CURRENT_DATE)::integer
    WHEN v.type = 'vidange' AND v.next_vidange_km IS NOT NULL AND c.mileage IS NOT NULL THEN
      v.next_vidange_km - c.mileage
    ELSE NULL
  END as days_until_due,
  c.mileage as current_mileage,
  v.next_vidange_km as next_service_mileage,
  v.created_at
FROM vehicle_expenses v
LEFT JOIN cars c ON v.car_id = c.id
WHERE v.type IN ('assurance', 'controle', 'vidange')
  AND (
    (v.type IN ('assurance', 'controle') AND v.expiration_date IS NULL OR v.expiration_date >= CURRENT_DATE - INTERVAL '90 days')
    OR
    (v.type = 'vidange' AND v.next_vidange_km IS NULL OR c.mileage IS NULL OR c.mileage <= v.next_vidange_km + 2000)
  );

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

-- =========================================
-- 5. PERFORMANCE FUNCTIONS
-- =========================================

-- Function to get dashboard statistics (optimized)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_revenue numeric,
  total_store_expenses bigint,
  total_vehicle_expenses bigint,
  total_clients bigint,
  total_cars bigint,
  active_reservations bigint,
  maintenance_alerts_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(r.total_price), 0) as total_revenue,
    COALESCE(SUM(se.cost), 0) as total_store_expenses,
    COALESCE(SUM(ve.cost), 0) as total_vehicle_expenses,
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM cars) as total_cars,
    (SELECT COUNT(*) FROM reservations WHERE status IN ('confirmed', 'active')) as active_reservations,
    (SELECT COUNT(*) FROM maintenance_alerts WHERE status IN ('expired', 'warning')) as maintenance_alerts_count
  FROM reservations r
  CROSS JOIN (SELECT SUM(cost) as cost FROM store_expenses) se
  CROSS JOIN (SELECT SUM(cost) as cost FROM vehicle_expenses) ve
  WHERE r.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reservations with performance optimization
CREATE OR REPLACE FUNCTION get_reservations_optimized(
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  client_name text,
  car_info text,
  departure_date date,
  return_date date,
  status text,
  total_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    CONCAT(car.brand, ' ', car.model) as car_info,
    r.departure_date,
    r.return_date,
    r.status,
    r.total_price
  FROM reservations r
  JOIN clients c ON r.client_id = c.id
  JOIN cars car ON r.car_id = car.id
  WHERE (p_status IS NULL OR r.status = p_status)
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- 6. ADDITIONAL CONSTRAINTS AND TRIGGERS
-- =========================================

-- Note: Overlapping reservation constraint removed due to complexity
-- Consider implementing this logic in application code if needed

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_agency_settings_updated_at ON public.agency_settings;
CREATE TRIGGER update_agency_settings_updated_at
    BEFORE UPDATE ON public.agency_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER update_document_templates_updated_at
    BEFORE UPDATE ON public.document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_website_contacts_updated_at ON public.website_contacts;
CREATE TRIGGER update_website_contacts_updated_at
    BEFORE UPDATE ON public.website_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_website_settings_updated_at ON public.website_settings;
CREATE TRIGGER update_website_settings_updated_at
    BEFORE UPDATE ON public.website_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 7. FINAL OPTIMIZATION COMMANDS
-- =========================================

-- Analyze tables for query optimization
ANALYZE public.reservations;
ANALYZE public.clients;
ANALYZE public.cars;
ANALYZE public.vehicle_inspections;
ANALYZE public.payments;
ANALYZE public.vehicle_expenses;
ANALYZE public.workers;

-- Vacuum analyze for maintenance
VACUUM ANALYZE;</content>
<parameter name="filePath">c:\Users\Admin\Desktop\luxdrive---premium-car-rental\database_performance_optimization.sql