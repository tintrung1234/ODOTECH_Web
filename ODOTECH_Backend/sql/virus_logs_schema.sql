-- Virus Logs schema for ODOTECH
-- Tracks security incidents and virus detections

BEGIN;

CREATE TABLE IF NOT EXISTS virus_logs (
  id BIGSERIAL PRIMARY KEY,
  
  website_id BIGINT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  
  -- Detection Information
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  threat_type TEXT NOT NULL, -- malware, virus, backdoor, suspicious_file, etc.
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  
  -- Details
  affected_files TEXT[], -- array of file paths
  threat_description TEXT,
  scanner_name TEXT, -- which antivirus/scanner detected it
  
  -- Action & Status
  action_taken TEXT, -- quarantined, deleted, cleaned, pending
  status TEXT NOT NULL DEFAULT 'detected', -- detected, assigned, in_progress, resolved, false_positive
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virus_logs_website_id ON virus_logs(website_id);
CREATE INDEX IF NOT EXISTS idx_virus_logs_status ON virus_logs(status);
CREATE INDEX IF NOT EXISTS idx_virus_logs_severity ON virus_logs(severity);
CREATE INDEX IF NOT EXISTS idx_virus_logs_detected_at ON virus_logs(detected_at DESC);

COMMIT;
