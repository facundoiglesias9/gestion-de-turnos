-- Add estimated_price column to turns table
ALTER TABLE turns ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10, 2);
