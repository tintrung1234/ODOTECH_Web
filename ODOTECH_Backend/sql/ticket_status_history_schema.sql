-- Ticket Status History schema for ODOTECH
-- Track all changes to tickets for audit trail

BEGIN;

CREATE TABLE IF NOT EXISTS ticket_status_history (
  id BIGSERIAL PRIMARY KEY,
  
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Field that was changed: 'status', 'priority', 'assigned_to', 'category', etc.
  field_name VARCHAR(50) NOT NULL,
  
  old_value TEXT,
  new_value TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_created_at ON ticket_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_field_name ON ticket_status_history(field_name);

COMMIT;
