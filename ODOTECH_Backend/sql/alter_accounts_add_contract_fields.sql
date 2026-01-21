-- Add contract management fields to accounts table
-- Run this migration to add contract tracking capabilities

BEGIN;

-- Add contract-related columns
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS contract_start DATE,
  ADD COLUMN IF NOT EXISTS contract_end DATE,
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS renewal_history JSONB DEFAULT '[]'::jsonb;

-- Add index for contract_end to quickly find expiring contracts
CREATE INDEX IF NOT EXISTS idx_accounts_contract_end ON accounts(contract_end);

-- Add index for contract_type
CREATE INDEX IF NOT EXISTS idx_accounts_contract_type ON accounts(contract_type);

COMMIT;
