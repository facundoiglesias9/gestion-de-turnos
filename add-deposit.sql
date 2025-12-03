-- Add deposit column to turns table
ALTER TABLE turns ADD COLUMN IF NOT EXISTS deposit DECIMAL(10, 2) DEFAULT 0;
