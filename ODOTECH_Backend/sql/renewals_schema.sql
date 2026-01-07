-- Renewals module schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/renewals endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS renewal_packages (
  id BIGSERIAL PRIMARY KEY,
  sales_project_id BIGINT NOT NULL REFERENCES sales_projects(id) ON DELETE CASCADE,

  kind TEXT NOT NULL CHECK (kind IN ('domain','hosting','email','manage','content','ads')),

  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Optional override fields ("nhập tay")
  renewal_date DATE,
  amount BIGINT,

  provider TEXT,
  management_place TEXT,
  management_url TEXT,

  login_username TEXT,
  login_password TEXT,

  hosting_used_mb INT,
  hosting_limit_mb INT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (sales_project_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_renewal_packages_sales_project_id ON renewal_packages(sales_project_id);
CREATE INDEX IF NOT EXISTS idx_renewal_packages_kind ON renewal_packages(kind);

CREATE TABLE IF NOT EXISTS renewal_credential_access_logs (
  id BIGSERIAL PRIMARY KEY,
  renewal_package_id BIGINT NOT NULL REFERENCES renewal_packages(id) ON DELETE CASCADE,
  requested_by_uid BIGINT NOT NULL,
  requested_by_username TEXT,
  requested_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renewal_cred_logs_pkg_id ON renewal_credential_access_logs(renewal_package_id);
CREATE INDEX IF NOT EXISTS idx_renewal_cred_logs_created_at ON renewal_credential_access_logs(created_at);

COMMIT;
