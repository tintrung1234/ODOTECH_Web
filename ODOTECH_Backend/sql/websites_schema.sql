-- Websites Management schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/websites endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS websites (
  id BIGSERIAL PRIMARY KEY,

  -- Basic Information
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  project_code TEXT,
  manager_id BIGINT REFERENCES accounts(id),
  
  -- Hosting Information
  hosting_package TEXT,
  hosting_provider TEXT,
  
  -- Storage Information
  storage_used BIGINT DEFAULT 0, -- in MB
  storage_limit BIGINT DEFAULT 0, -- in MB
  storage_alert_threshold NUMERIC(5, 2) DEFAULT 90.00, -- percentage
  
  -- Credentials (encrypted)
  admin_login_url TEXT,
  admin_username TEXT,
  admin_password TEXT, -- encrypted
  
  hosting_login_url TEXT,
  hosting_username TEXT,
  hosting_password TEXT, -- encrypted
  
  vps_login_url TEXT,
  vps_username TEXT,
  vps_password TEXT, -- encrypted
  
  ssh_host TEXT,
  ssh_port INTEGER DEFAULT 22,
  ssh_username TEXT,
  ssh_password TEXT, -- encrypted
  ssh_key TEXT, -- encrypted
  
  -- Management
  sale_manager_id BIGINT REFERENCES accounts(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_websites_name ON websites(name);
CREATE INDEX IF NOT EXISTS idx_websites_url ON websites(url);
CREATE INDEX IF NOT EXISTS idx_websites_project_code ON websites(project_code);
CREATE INDEX IF NOT EXISTS idx_websites_manager_id ON websites(manager_id);
CREATE INDEX IF NOT EXISTS idx_websites_sale_manager_id ON websites(sale_manager_id);
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_storage_alert ON websites(storage_used, storage_limit);

COMMIT;
