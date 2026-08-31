-- Shambala: Construction Site ERP Schema
-- Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CORE & FINANCIAL MASTERS
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE account_type AS ENUM ('cash', 'bank', 'upi', 'other');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL DEFAULT 'cash',
  initial_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. OPERATIONAL MASTERS
-- ============================================================

-- Buildings / Locations
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  direction TEXT,
  number TEXT,
  name TEXT, -- Optional, e.g. "Villa 05"
  display_name TEXT GENERATED ALWAYS AS (COALESCE(direction || ' ' || number, name)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worker Types (e.g. Labour, Mason, Watchman)
CREATE TABLE worker_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Types (e.g. Soil Dressing, Cleaning)
CREATE TABLE work_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parties (People, Shops, Suppliers)
CREATE TYPE party_class AS ENUM ('person', 'shop', 'supplier');

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  class party_class NOT NULL,
  name TEXT NOT NULL,
  worker_type_id UUID REFERENCES worker_types(id) ON DELETE SET NULL, -- for people
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Machinery Master
CREATE TABLE machinery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL, -- e.g. "JCB-01"
  machine_type TEXT NOT NULL,
  registration_number TEXT,
  operator_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  fuel_type TEXT,
  meter_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transport Vehicles Master
CREATE TABLE transport_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  owner_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  capacity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materials Master (Bulk & Small)
CREATE TYPE material_class AS ENUM ('bulk', 'hardware', 'electrical', 'plumbing', 'finishing', 'other');

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  class material_class NOT NULL DEFAULT 'bulk',
  name TEXT NOT NULL,
  default_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Material Variants (Sizes)
CREATE TABLE material_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "8 mm", "9x4x3"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Food Categories
CREATE TABLE food_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General Store Categories
CREATE TABLE general_store_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General Store Items
CREATE TABLE general_store_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES general_store_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weighbridges Master
CREATE TABLE weighbridges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  default_fee NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CENTRAL FINANCIAL LEDGER
-- ============================================================

CREATE TYPE transaction_type AS ENUM (
  'money_in',
  'transfer',
  'operational_expense',
  'general_expense',
  'supplier_payment',
  'opening_balance'
);

CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'other');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- transfers
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL, -- payer/payee
  description TEXT,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  reference_table TEXT, -- 'labour_records', 'food_records', etc.
  reference_id UUID,    -- linking back to operational record
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. OPERATIONAL RECORDS
-- ============================================================

-- Labour Records
CREATE TABLE labour_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES parties(id),
  worker_type_id UUID REFERENCES worker_types(id),
  work_type_id UUID REFERENCES work_types(id),
  building_id UUID REFERENCES buildings(id),
  date DATE NOT NULL,
  time TIME,
  amount NUMERIC(15,2),
  cash_provider_id UUID REFERENCES parties(id),
  payment_method payment_method DEFAULT 'cash',
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Food Records
CREATE TABLE food_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES parties(id), -- Specific person or group
  worker_type_id UUID REFERENCES worker_types(id),
  food_category_id UUID NOT NULL REFERENCES food_categories(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  quantity NUMERIC(12,2),
  unit TEXT,
  amount NUMERIC(15,2),
  shop_id UUID REFERENCES parties(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Salary Records
CREATE TABLE salary_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES parties(id),
  worker_type_id UUID REFERENCES worker_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method payment_method NOT NULL,
  cash_provider_id UUID REFERENCES parties(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Machinery Records
CREATE TABLE machinery_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machinery(id),
  operator_id UUID REFERENCES parties(id),
  building_id UUID REFERENCES buildings(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours NUMERIC(10,2),
  amount NUMERIC(15,2),
  charging_type TEXT, -- 'Hourly', 'Daily', 'Fixed', etc.
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fuel Records
CREATE TABLE fuel_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machinery(id),
  building_id UUID REFERENCES buildings(id),
  fuel_type TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'Litres',
  rate NUMERIC(10,2),
  amount NUMERIC(15,2),
  previous_meter NUMERIC(15,2),
  current_meter NUMERIC(15,2),
  date DATE NOT NULL,
  provider_id UUID REFERENCES parties(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Material Deliveries
CREATE TABLE material_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  variant_id UUID REFERENCES material_variants(id),
  supplier_id UUID REFERENCES parties(id),
  building_id UUID REFERENCES buildings(id),
  date DATE NOT NULL,
  time TIME,
  quantity NUMERIC(12,2),
  unit TEXT,
  material_cost NUMERIC(15,2), -- Without transport/weighbridge
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transport Records (Linked to Material Deliveries)
CREATE TABLE transport_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES material_deliveries(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES transport_vehicles(id),
  transport_type TEXT,
  source_location TEXT,
  amount NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weighbridge Records (Linked to Material Deliveries)
CREATE TABLE weighbridge_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES material_deliveries(id) ON DELETE CASCADE,
  weighbridge_id UUID REFERENCES weighbridges(id),
  gross_weight NUMERIC(12,3),
  tare_weight NUMERIC(12,3),
  net_weight NUMERIC(12,3) GENERATED ALWAYS AS (gross_weight - tare_weight) STORED,
  fee NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General Store Records
CREATE TABLE general_store_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES general_store_items(id),
  shop_id UUID REFERENCES parties(id),
  quantity NUMERIC(10,2),
  unit TEXT,
  amount NUMERIC(15,2),
  date DATE NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General Site Expenses (Electricity, Internet, etc.)
CREATE TABLE general_site_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  expense_category TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  date DATE NOT NULL,
  paid_to_id UUID REFERENCES parties(id),
  payment_method payment_method DEFAULT 'cash',
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_labour_project ON labour_records(project_id);
CREATE INDEX idx_materials_project ON material_deliveries(project_id);
CREATE INDEX idx_food_project ON food_records(project_id);
CREATE INDEX idx_transactions_project ON transactions(project_id);
