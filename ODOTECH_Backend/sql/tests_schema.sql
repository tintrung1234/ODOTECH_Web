-- Tests/Quizzes schema for ODOTECH Training System
-- Run this on your PostgreSQL database before calling /api/tests endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS tests (
  id BIGSERIAL PRIMARY KEY,
  
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  duration_minutes INTEGER DEFAULT 30,
  passing_score NUMERIC(5, 2) DEFAULT 70.00,
  max_attempts INTEGER DEFAULT 3,
  
  status TEXT NOT NULL DEFAULT 'draft',
  created_by BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_course ON tests(course_id);
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);

COMMIT;
