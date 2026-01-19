-- Test Results schema for ODOTECH Training System
-- Run this on your PostgreSQL database before calling /api/tests endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS test_results (
  id BIGSERIAL PRIMARY KEY,
  
  test_id BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  enrollment_id BIGINT REFERENCES course_enrollments(id) ON DELETE SET NULL,
  
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  passed BOOLEAN NOT NULL DEFAULT false,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_test ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_account ON test_results(account_id);
CREATE INDEX IF NOT EXISTS idx_test_results_enrollment ON test_results(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_test_results_passed ON test_results(passed);

COMMIT;
