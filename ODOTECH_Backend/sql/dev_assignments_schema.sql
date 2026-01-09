-- Dev Assignments schema for ODOTECH
-- Tracks developer assignments for security incidents with rotation and delegation

BEGIN;

CREATE TABLE IF NOT EXISTS dev_assignments (
  id BIGSERIAL PRIMARY KEY,
  
  virus_log_id BIGINT NOT NULL REFERENCES virus_logs(id) ON DELETE CASCADE,
  assigned_dev_id BIGINT NOT NULL REFERENCES accounts(id),
  
  -- Assignment Details
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, delegated, in_progress, completed, cancelled
  
  -- Delegation Tracking
  delegation_history JSONB, -- [{from_dev_id, to_dev_id, requested_at, responded_at, accepted}]
  delegation_expires_at TIMESTAMPTZ, -- 15 minutes from delegation request
  
  -- Completion
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track dev rotation order
CREATE TABLE IF NOT EXISTS dev_rotation (
  id BIGSERIAL PRIMARY KEY,
  dev_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  rotation_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dev_id)
);

-- Table to track last assignment for round-robin
CREATE TABLE IF NOT EXISTS dev_assignment_tracker (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_assigned_dev_id BIGINT REFERENCES accounts(id),
  last_assigned_at TIMESTAMPTZ,
  CHECK (id = 1) -- ensures only one row
);

-- Initialize tracker
INSERT INTO dev_assignment_tracker (id, last_assigned_dev_id, last_assigned_at)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_dev_assignments_virus_log_id ON dev_assignments(virus_log_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_assigned_dev_id ON dev_assignments(assigned_dev_id);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_status ON dev_assignments(status);
CREATE INDEX IF NOT EXISTS idx_dev_assignments_delegation_expires ON dev_assignments(delegation_expires_at);

CREATE INDEX IF NOT EXISTS idx_dev_rotation_order ON dev_rotation(rotation_order);
CREATE INDEX IF NOT EXISTS idx_dev_rotation_active ON dev_rotation(is_active);

COMMIT;
