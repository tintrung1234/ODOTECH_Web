-- Migration V2: Enhanced Expense Renewals with Tax Integration
-- Run this script to upgrade the expense_renewals table

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS expense_renewals_backup AS 
SELECT * FROM expense_renewals;

-- Step 2: Add new columns
ALTER TABLE expense_renewals 
ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB;

-- Step 3: Rename assignee_id to manager_id for clarity
ALTER TABLE expense_renewals 
RENAME COLUMN assignee_id TO manager_id;

-- Step 4: Migrate existing salary data
UPDATE expense_renewals 
SET 
  gross_amount = amount,
  net_amount = amount,
  tax_amount = 0,
  tax_breakdown = '{"personal_income_tax": 0, "social_insurance": 0, "health_insurance": 0, "unemployment_insurance": 0, "total": 0}'::jsonb
WHERE category = 'salary' AND amount IS NOT NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_renewals_recipient ON expense_renewals(recipient_id);
CREATE INDEX IF NOT EXISTS idx_expense_renewals_manager ON expense_renewals(manager_id);
CREATE INDEX IF NOT EXISTS idx_expense_renewals_category_status ON expense_renewals(category, status);

-- Step 6: Add comments
COMMENT ON COLUMN expense_renewals.manager_id IS 'Người phụ trách/phê duyệt chi phí';
COMMENT ON COLUMN expense_renewals.recipient_id IS 'Người nhận (dùng cho lương)';
COMMENT ON COLUMN expense_renewals.gross_amount IS 'Lương gross/tổng chi phí trước thuế';
COMMENT ON COLUMN expense_renewals.tax_amount IS 'Tổng số thuế phải nộp';
COMMENT ON COLUMN expense_renewals.net_amount IS 'Lương net/chi phí sau thuế';
COMMENT ON COLUMN expense_renewals.tax_breakdown IS 'Chi tiết thuế: TNCN, BHXH, BHYT, BHTN (JSON)';

-- Step 7: Update sample data with tax calculation
-- Example: Update a salary entry with proper tax breakdown
-- UPDATE expense_renewals 
-- SET 
--   gross_amount = 20000000,
--   tax_amount = 3600000,
--   net_amount = 16400000,
--   tax_breakdown = '{
--     "personal_income_tax": 1500000,
--     "social_insurance": 1600000,
--     "health_insurance": 300000,
--     "unemployment_insurance": 200000,
--     "total": 3600000
--   }'::jsonb,
--   recipient_id = (SELECT id FROM accounts WHERE name = 'Nguyễn Văn A' LIMIT 1)
-- WHERE id = 1 AND category = 'salary';

-- Verification queries
-- Check new structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expense_renewals'
ORDER BY ordinal_position;

-- Check migrated data
SELECT 
  id, 
  category, 
  description,
  gross_amount,
  tax_amount,
  net_amount,
  tax_breakdown
FROM expense_renewals
WHERE category = 'salary'
LIMIT 5;

COMMENT ON TABLE expense_renewals IS 'Quản lý chi phí định kỳ với tính năng tính thuế tự động cho lương';
