-- Update existing worker types to have a role (optional, as role will default to general)
UPDATE parties SET role = 'labour' WHERE worker_type_id IS NOT NULL;
