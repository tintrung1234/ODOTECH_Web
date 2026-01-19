-- Servers Management schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/servers endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS servers (
  id BIGSERIAL PRIMARY KEY,
  
  -- Basic Information
  name TEXT NOT NULL,
  hostname TEXT NOT NULL,
  ip_address INET NOT NULL,
  server_type TEXT NOT NULL, -- 'vps', 'dedicated', 'cloud', 'shared'
  
  -- Specifications
  cpu_cores INTEGER,
  ram_gb INTEGER,
  storage_gb INTEGER,
  bandwidth_gb INTEGER,
  
  -- Provider Information
  provider TEXT, -- 'AWS', 'DigitalOcean', 'Vultr', 'Linode', etc.
  datacenter_location TEXT,
  
  -- Access Credentials (encrypted)
  ssh_port INTEGER DEFAULT 22,
  ssh_username TEXT,
  ssh_password TEXT, -- encrypted
  ssh_key TEXT, -- encrypted
  root_password TEXT, -- encrypted
  
  -- Panel Access
  panel_type TEXT, -- 'cPanel', 'Plesk', 'DirectAdmin', 'Custom', 'None'
  panel_url TEXT,
  panel_username TEXT,
  panel_password TEXT, -- encrypted
  
  -- Status & Monitoring
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'error'
  cpu_usage NUMERIC(5,2), -- percentage
  ram_usage NUMERIC(5,2), -- percentage
  storage_usage NUMERIC(5,2), -- percentage
  uptime_days INTEGER,
  last_check TIMESTAMPTZ,
  
  -- Management
  manager_id BIGINT REFERENCES accounts(id),
  purpose TEXT, -- 'hosting', 'database', 'application', 'backup', 'development'
  notes TEXT,
  
  -- Billing
  monthly_cost NUMERIC(10,2),
  billing_cycle TEXT, -- 'monthly', 'quarterly', 'yearly'
  next_billing_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name);
CREATE INDEX IF NOT EXISTS idx_servers_hostname ON servers(hostname);
CREATE INDEX IF NOT EXISTS idx_servers_ip_address ON servers(ip_address);
CREATE INDEX IF NOT EXISTS idx_servers_server_type ON servers(server_type);
CREATE INDEX IF NOT EXISTS idx_servers_provider ON servers(provider);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_servers_manager_id ON servers(manager_id);
CREATE INDEX IF NOT EXISTS idx_servers_purpose ON servers(purpose);
CREATE INDEX IF NOT EXISTS idx_servers_next_billing_date ON servers(next_billing_date);

COMMIT;
