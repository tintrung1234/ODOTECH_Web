-- Courses schema for ODOTECH Training System
-- Run this on your PostgreSQL database before calling /api/courses endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  
  title TEXT NOT NULL,
  description TEXT,
  instructor_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  
  category TEXT NOT NULL DEFAULT 'general',
  level TEXT NOT NULL DEFAULT 'beginner',
  duration_hours NUMERIC(5, 1) DEFAULT 0,
  
  thumbnail_url TEXT,
  content TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

COMMIT;
