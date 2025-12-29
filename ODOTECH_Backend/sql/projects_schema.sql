-- Project management module schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/projects endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,

  project_code TEXT NOT NULL UNIQUE,
  project_type TEXT,
  name TEXT NOT NULL,

  client_id BIGINT,
  sale_id BIGINT,
  pm_id BIGINT,

  status TEXT,
  priority TEXT,

  budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
  contract_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  deposit_received NUMERIC(14, 2) NOT NULL DEFAULT 0,

  payment_status TEXT,
  total_hours NUMERIC(12, 2) NOT NULL DEFAULT 0,

  technology_stack TEXT,
  domain_url TEXT,
  production_url TEXT,

  start_date DATE,
  deadline DATE,
  completed_at TIMESTAMPTZ,

  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

COMMIT;
