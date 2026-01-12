-- Migration script to convert tech_user and customer_sender from TEXT to BIGINT
-- This script helps migrate existing data if needed

BEGIN;

-- Step 1: Add new columns if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_user_id BIGINT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_sender_id BIGINT;

-- Step 2: If you have existing data in tech_user/customer_sender as text,
-- you would need to manually map them to account IDs here.
-- Example (uncomment and modify as needed):
-- UPDATE projects SET tech_user_id = (SELECT id FROM accounts WHERE name = tech_user) WHERE tech_user IS NOT NULL;
-- UPDATE projects SET customer_sender_id = (SELECT id FROM accounts WHERE name = customer_sender) WHERE customer_sender IS NOT NULL;

-- Step 3: Drop old columns (ONLY after you've migrated the data)
-- WARNING: This will permanently delete the old text data
-- Uncomment these lines only when you're ready:
-- ALTER TABLE projects DROP COLUMN IF EXISTS tech_user;
-- ALTER TABLE projects DROP COLUMN IF EXISTS customer_sender;

COMMIT;
