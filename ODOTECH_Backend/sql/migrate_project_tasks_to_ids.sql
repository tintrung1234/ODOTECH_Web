-- Migration script to convert project_tasks assignment fields from TEXT to BIGINT
-- This script converts nguoi_phu_trach, nguoi_chinh, nguoi_ho_tro from names to IDs
-- Run this migration after backing up your database

BEGIN;

-- Step 1: Add new temporary columns with BIGINT type
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS nguoi_phu_trach_id BIGINT;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS nguoi_chinh_id BIGINT;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS nguoi_ho_tro_id BIGINT;

-- Step 2: Migrate existing data by matching names to account IDs
-- This attempts to match by username first, then by name
UPDATE project_tasks pt
SET nguoi_phu_trach_id = (
  SELECT a.id FROM accounts a 
  WHERE TRIM(pt.nguoi_phu_trach) != '' 
    AND (LOWER(a.username) = LOWER(TRIM(pt.nguoi_phu_trach)) 
         OR LOWER(a.name) = LOWER(TRIM(pt.nguoi_phu_trach)))
  LIMIT 1
)
WHERE pt.nguoi_phu_trach IS NOT NULL AND TRIM(pt.nguoi_phu_trach) != '';

UPDATE project_tasks pt
SET nguoi_chinh_id = (
  SELECT a.id FROM accounts a 
  WHERE TRIM(pt.nguoi_chinh) != '' 
    AND (LOWER(a.username) = LOWER(TRIM(pt.nguoi_chinh)) 
         OR LOWER(a.name) = LOWER(TRIM(pt.nguoi_chinh)))
  LIMIT 1
)
WHERE pt.nguoi_chinh IS NOT NULL AND TRIM(pt.nguoi_chinh) != '';

UPDATE project_tasks pt
SET nguoi_ho_tro_id = (
  SELECT a.id FROM accounts a 
  WHERE TRIM(pt.nguoi_ho_tro) != '' 
    AND (LOWER(a.username) = LOWER(TRIM(pt.nguoi_ho_tro)) 
         OR LOWER(a.name) = LOWER(TRIM(pt.nguoi_ho_tro)))
  LIMIT 1
)
WHERE pt.nguoi_ho_tro IS NOT NULL AND TRIM(pt.nguoi_ho_tro) != '';

-- Step 3: Drop old TEXT columns
ALTER TABLE project_tasks DROP COLUMN IF EXISTS nguoi_phu_trach;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS nguoi_chinh;
ALTER TABLE project_tasks DROP COLUMN IF EXISTS nguoi_ho_tro;

-- Step 4: Rename new columns to original names
ALTER TABLE project_tasks RENAME COLUMN nguoi_phu_trach_id TO nguoi_phu_trach;
ALTER TABLE project_tasks RENAME COLUMN nguoi_chinh_id TO nguoi_chinh;
ALTER TABLE project_tasks RENAME COLUMN nguoi_ho_tro_id TO nguoi_ho_tro;

-- Step 5: Add foreign key constraints
ALTER TABLE project_tasks 
  ADD CONSTRAINT fk_project_tasks_nguoi_phu_trach 
  FOREIGN KEY (nguoi_phu_trach) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE project_tasks 
  ADD CONSTRAINT fk_project_tasks_nguoi_chinh 
  FOREIGN KEY (nguoi_chinh) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE project_tasks 
  ADD CONSTRAINT fk_project_tasks_nguoi_ho_tro 
  FOREIGN KEY (nguoi_ho_tro) REFERENCES accounts(id) ON DELETE SET NULL;

-- Step 6: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_nguoi_phu_trach ON project_tasks(nguoi_phu_trach);
CREATE INDEX IF NOT EXISTS idx_project_tasks_nguoi_chinh ON project_tasks(nguoi_chinh);
CREATE INDEX IF NOT EXISTS idx_project_tasks_nguoi_ho_tro ON project_tasks(nguoi_ho_tro);

COMMIT;

-- Verification queries (run these after migration):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name IN ('nguoi_phu_trach', 'nguoi_chinh', 'nguoi_ho_tro');
-- SELECT pt.id, pt.tieu_de, pt.nguoi_chinh, a.username, a.name FROM project_tasks pt LEFT JOIN accounts a ON pt.nguoi_chinh = a.id LIMIT 10;
