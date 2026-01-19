-- Course Enrollments schema for ODOTECH Training System
-- Run this on your PostgreSQL database before calling /api/courses endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS course_enrollments (
  id BIGSERIAL PRIMARY KEY,
  
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  progress NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'enrolled',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(course_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_account ON course_enrollments(account_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);

COMMIT;
