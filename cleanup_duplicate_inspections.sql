-- Delete duplicate inspection records, keeping only the latest one per reservation per type
-- This will clean up old inspection records and keep only the most recent ones

-- Find and delete duplicate departure inspections (keep the latest)
DELETE FROM vehicle_inspections vi1
WHERE type = 'departure'
  AND id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY reservation_id, type ORDER BY created_at DESC) as rn
      FROM vehicle_inspections
      WHERE type = 'departure'
    ) ranked
    WHERE rn = 1
  );

-- Find and delete duplicate return inspections (keep the latest)
DELETE FROM vehicle_inspections vi1
WHERE type = 'return'
  AND id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY reservation_id, type ORDER BY created_at DESC) as rn
      FROM vehicle_inspections
      WHERE type = 'return'
    ) ranked
    WHERE rn = 1
  );

-- Verify only latest inspections remain per reservation per type
SELECT 
  reservation_id,
  type,
  COUNT(*) as count,
  MAX(created_at) as latest_created_at
FROM vehicle_inspections
GROUP BY reservation_id, type
ORDER BY reservation_id, type;
