BEGIN;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS competency_framework JSONB DEFAULT '{}'::jsonb;

COMMIT;
