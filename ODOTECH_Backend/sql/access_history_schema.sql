-- Access History schema for ODOTECH
-- Audit log for credential access tracking

BEGIN;

CREATE TABLE IF NOT EXISTS access_history (
  id BIGSERIAL PRIMARY KEY,
  
  -- Who accessed
  user_id BIGINT NOT NULL REFERENCES accounts(id),
  user_name TEXT NOT NULL,
  
  -- What was accessed
  website_id BIGINT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  website_name TEXT NOT NULL,
  credential_type TEXT NOT NULL, -- admin, hosting, vps, ssh
  
  -- When and from where
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_history_user_id ON access_history(user_id);
CREATE INDEX IF NOT EXISTS idx_access_history_website_id ON access_history(website_id);
CREATE INDEX IF NOT EXISTS idx_access_history_accessed_at ON access_history(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_history_credential_type ON access_history(credential_type);

COMMIT;
