const fs = require('fs');

const appendText = `
-- ============================================================
-- 10. FUEL TYPES SEED
-- ============================================================
INSERT INTO fuel_types (project_id, name, default_unit)
VALUES 
  ('10000000-0000-0000-0000-000000000000', 'Diesel', 'Litres'),
  ('10000000-0000-0000-0000-000000000000', 'Petrol', 'Litres')
ON CONFLICT DO NOTHING;
`;

fs.appendFileSync('./supabase/migrations/002_seed.sql', appendText);
console.log('Seed appended');
