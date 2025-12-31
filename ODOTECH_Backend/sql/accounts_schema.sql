-- Accounts (HR) module schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/accounts endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS accounts (
  id BIGSERIAL PRIMARY KEY,

  username TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,

  role_system TEXT NOT NULL DEFAULT 'employee',
  point NUMERIC(8, 2) NOT NULL DEFAULT 0,
  position TEXT,
  salary BIGINT NOT NULL DEFAULT 0,
  payable BIGINT NOT NULL DEFAULT 0,
  join_date DATE,
  status TEXT NOT NULL DEFAULT 'active',

  password_hash TEXT,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_username_unique ON accounts (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_role_system ON accounts(role_system);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

COMMIT;
