-- Add role column to parties to separate labour, salaried, cash_in (investor), etc.
ALTER TABLE parties ADD COLUMN role TEXT DEFAULT 'general';

-- Update existing worker types to have a role (optional, as role will default to general)
UPDATE parties SET role = 'labour' WHERE worker_type_id IS NOT NULL;
