-- ============================================================
-- 1. FUEL TYPES
-- ============================================================

CREATE TABLE fuel_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_unit TEXT DEFAULT 'Litres',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. TRANSPORT TRIPS (Replaces transport_records tight coupling)
-- ============================================================

CREATE TABLE transport_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES material_deliveries(id) ON DELETE CASCADE, -- Optional link
  vehicle_id UUID REFERENCES transport_vehicles(id),
  transport_type TEXT,
  source_location TEXT,
  amount NUMERIC(15,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method DEFAULT 'cash',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transport_trips_project ON transport_trips(project_id);
