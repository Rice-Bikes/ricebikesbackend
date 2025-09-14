-- Migration: Add bike sales fields
-- Date: 2025-09-04
-- Description: Add fields needed for bike sales workflow

BEGIN;

-- Add new columns to Bikes table (capitalized table name)
ALTER TABLE "Bikes" 
ADD COLUMN IF NOT EXISTS bike_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS size_cm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'New',
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reservation_customer_id UUID,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);

-- Add foreign key constraint for reservation_customer_id
ALTER TABLE "Bikes" 
ADD CONSTRAINT fk_bikes_reservation_customer 
FOREIGN KEY (reservation_customer_id) REFERENCES "Customers"(customer_id);

-- Add check constraints
ALTER TABLE "Bikes" 
ADD CONSTRAINT bikes_price_check CHECK (price IS NULL OR price >= 0),
ADD CONSTRAINT bikes_weight_check CHECK (weight_kg IS NULL OR weight_kg > 0),
ADD CONSTRAINT bikes_deposit_check CHECK (deposit_amount IS NULL OR deposit_amount >= 0);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bikes_bike_type ON "Bikes"(bike_type);
CREATE INDEX IF NOT EXISTS idx_bikes_size_cm ON "Bikes"(size_cm);
CREATE INDEX IF NOT EXISTS idx_bikes_condition ON "Bikes"(condition);
CREATE INDEX IF NOT EXISTS idx_bikes_is_available ON "Bikes"(is_available);
CREATE INDEX IF NOT EXISTS idx_bikes_reservation_customer ON "Bikes"(reservation_customer_id);

-- Update any existing bikes with default values if needed
UPDATE "Bikes" 
SET 
  condition = 'Used',
  is_available = true
WHERE condition IS NULL OR is_available IS NULL;

COMMIT;
