-- Script to drop old tech_user and customer_sender TEXT columns
-- WARNING: This will permanently delete these columns and their data
-- Make sure you have migrated the data to tech_user_id and customer_sender_id first!

BEGIN;

-- Verify that new columns exist before dropping old ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'tech_user_id'
  ) THEN
    RAISE EXCEPTION 'Column tech_user_id does not exist. Please run the migration first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'customer_sender_id'
  ) THEN
    RAISE EXCEPTION 'Column customer_sender_id does not exist. Please run the migration first.';
  END IF;
END $$;

-- Drop the old TEXT columns
ALTER TABLE projects DROP COLUMN IF EXISTS tech_user;
ALTER TABLE projects DROP COLUMN IF EXISTS customer_sender;

COMMIT;

-- Verify the columns were dropped
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('tech_user', 'customer_sender', 'tech_user_id', 'customer_sender_id')
ORDER BY column_name;
