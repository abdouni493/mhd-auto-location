-- Supabase Database Setup for LuxDrive Car Rental
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create tables for the car rental application

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  city TEXT,
  manager TEXT NOT NULL,
  opening_hours TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  registration TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  vin TEXT NOT NULL,
  energy TEXT NOT NULL,
  transmission TEXT NOT NULL,
  seats INTEGER NOT NULL,
  doors INTEGER NOT NULL,
  price_day INTEGER NOT NULL,
  price_week INTEGER NOT NULL,
  price_month INTEGER NOT NULL,
  deposit INTEGER NOT NULL,
  images TEXT[] DEFAULT '{}',
  mileage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  place_of_birth TEXT,
  id_card_number TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_expiration_date DATE,
  license_delivery_date DATE,
  license_delivery_place TEXT,
  document_type TEXT CHECK (document_type IN ('id_card', 'passport', 'none')),
  document_number TEXT,
  document_delivery_date DATE,
  document_expiration_date DATE,
  document_delivery_address TEXT,
  wilaya TEXT NOT NULL,
  complete_address TEXT,
  profile_photo TEXT,
  scanned_documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  agency_id TEXT REFERENCES agencies(id)
);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  profile_photo TEXT,
  type TEXT NOT NULL CHECK (type IN ('admin', 'worker', 'driver')),
  payment_type TEXT CHECK (payment_type IN ('daily', 'monthly')),
  base_salary INTEGER NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker advances table
CREATE TABLE IF NOT EXISTS worker_advances (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker absences table
CREATE TABLE IF NOT EXISTS worker_absences (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  cost INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker payments table
CREATE TABLE IF NOT EXISTS worker_payments (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  base_salary INTEGER NOT NULL,
  advances INTEGER DEFAULT 0,
  absences INTEGER DEFAULT 0,
  net_salary INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store expenses table
CREATE TABLE IF NOT EXISTS store_expenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle expenses table
CREATE TABLE IF NOT EXISTS vehicle_expenses (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vidange', 'assurance', 'controle', 'autre')),
  cost INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  current_mileage INTEGER,
  next_vidange_km INTEGER,
  expiration_date DATE,
  expense_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance alerts table
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  car_info TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vidange', 'assurance', 'controle_technique')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  is_expired BOOLEAN DEFAULT FALSE,
  days_until_due INTEGER,
  current_mileage INTEGER,
  next_service_mileage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website orders table
CREATE TABLE IF NOT EXISTS website_orders (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL REFERENCES cars(id),
  car_data JSONB NOT NULL,
  step1_data JSONB NOT NULL,
  step2_data JSONB NOT NULL,
  step3_data JSONB NOT NULL,
  total_days INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  services_total INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'website'
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  car_id TEXT NOT NULL REFERENCES cars(id),
  step1_data JSONB NOT NULL,
  step2_data JSONB NOT NULL,
  additional_services JSONB DEFAULT '[]',
  deposit INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  advance_payment INTEGER DEFAULT 0,
  remaining_payment INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  departure_inspection JSONB,
  return_inspection JSONB,
  excess_mileage INTEGER,
  missing_fuel INTEGER,
  additional_fees INTEGER DEFAULT 0,
  tva_applied BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'check')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id),
  client_name TEXT NOT NULL,
  car_id TEXT NOT NULL REFERENCES cars(id),
  car_info TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  subtotal INTEGER NOT NULL,
  tva_amount INTEGER DEFAULT 0,
  additional_fees INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  total_paid INTEGER DEFAULT 0,
  remaining_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid')),
  type TEXT NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'quote', 'contract')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_wilaya ON clients(wilaya);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON cars(brand, model);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_website_orders_status ON website_orders(status);
CREATE INDEX IF NOT EXISTS idx_website_orders_created_at ON website_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_severity ON maintenance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_car_id ON vehicle_expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_store_expenses_date ON store_expenses(date);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Website management tables RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed for your auth setup)
-- For now, allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON agencies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON cars FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON workers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON worker_advances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON worker_absences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON worker_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON store_expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON vehicle_expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON maintenance_alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON website_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON reservations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON invoices FOR ALL USING (auth.role() = 'authenticated');

-- Website management tables policies
CREATE POLICY "Allow all operations for authenticated users" ON offers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON special_offers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON website_contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON website_settings FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- WORKER LOGIN FUNCTION
-- =========================================

-- Create function for worker authentication
CREATE OR REPLACE FUNCTION login_worker(p_email_or_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    worker_record RECORD;
BEGIN
    -- Try to find worker by email first
    SELECT * INTO worker_record
    FROM workers
    WHERE email = p_email_or_username AND password = p_password;

    -- If not found by email, try by username
    IF worker_record IS NULL THEN
        SELECT * INTO worker_record
        FROM workers
        WHERE username = p_email_or_username AND password = p_password;
    END IF;

    -- If worker found, return success with worker data
    IF worker_record IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'worker', json_build_object(
                'id', worker_record.id,
                'full_name', worker_record.full_name,
                'email', worker_record.email,
                'username', worker_record.username,
                'type', worker_record.type,
                'profile_photo', worker_record.profile_photo,
                'password', worker_record.password
            )
        );
    END IF;

    -- If no worker found, return failure
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION login_worker(TEXT, TEXT) TO authenticated;

-- Insert some sample data (optional - you can remove this)
INSERT INTO agencies (id, name, address, phone, email, wilaya, city, manager, opening_hours) VALUES
('1', 'Agence Centre Ville', '123 Rue Principal, Alger Centre', '+213 21 123 456', 'centre@luxdrive.dz', '16 - Alger', 'Alger', 'Ahmed Bennani', '08:00 - 18:00'),
('2', 'Agence Aéroport', 'Aéroport Houari Boumediene, Alger', '+213 21 654 321', 'aeroport@luxdrive.dz', '16 - Alger', 'Alger', 'Fatima Zohra', '24/7'),
('3', 'Agence Oran', '456 Boulevard de la République, Oran', '+213 41 987 654', 'oran@luxdrive.dz', '31 - Oran', 'Oran', 'Mohamed Cherif', '08:00 - 17:00');

INSERT INTO cars (id, brand, model, registration, year, color, vin, energy, transmission, seats, doors, price_day, price_week, price_month, deposit, mileage) VALUES
('1', 'Mercedes-Benz', 'S-Class', '12345-123-16', 2023, 'Noir', 'VIN123456789', 'Essence', 'Automatique', 5, 4, 15000, 85000, 300000, 50000, 15000),
('2', 'Range Rover', 'Vogue', '67890-123-16', 2023, 'Blanc', 'VIN987654321', 'Diesel', 'Automatique', 5, 4, 20000, 120000, 400000, 75000, 12000);

-- Sample workers for testing worker login
INSERT INTO workers (id, full_name, date_of_birth, phone, email, address, profile_photo, type, payment_type, base_salary, username, password) VALUES
('worker-1', 'Ahmed Boudjellal', '1990-05-15', '+213 5 1234 5678', 'ahmed.worker@luxdrive.dz', 'Alger, Algeria', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', 'worker', 'daily', 3500, 'ahmed.worker', 'worker123'),
('worker-2', 'Fatima Zahra', '1988-03-20', '+213 5 9876 5432', 'fatima.worker@luxdrive.dz', 'Oran, Algeria', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', 'admin', 'monthly', 45000, 'fatima.admin', 'admin123'),
('worker-3', 'Mohamed Cherif', '1985-11-10', '+213 6 5555 1234', 'mohamed.driver@luxdrive.dz', 'Constantine, Algeria', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', 'driver', 'daily', 4000, 'mohamed.driver', 'driver123');