-- Indexes to speed up common operations on the cars table

-- ordering by creation date for the main listing
CREATE INDEX IF NOT EXISTS idx_cars_created_at_desc ON cars (created_at DESC);

-- searches by brand/model during filtering
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars (brand);
CREATE INDEX IF NOT EXISTS idx_cars_model ON cars (model);

-- optional partial index for "available" status if that's a common query
CREATE INDEX IF NOT EXISTS idx_cars_status_available ON cars (id) WHERE status = 'available';

-- update statistics
ANALYZE cars;
