-- Check if clients table exists and show its structure
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'clients';

-- Show columns in clients table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clients'
ORDER BY ordinal_position;