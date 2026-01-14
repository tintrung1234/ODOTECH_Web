-- Tickets schema for ODOTECH
-- Supports both customer tickets and internal employee tickets

BEGIN;

CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  
  -- Ticket identification
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Type: 'customer' or 'internal'
  type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'internal')),
  
  -- Category and classification
  category_id BIGINT REFERENCES ticket_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Priority: 'low', 'medium', 'high', 'urgent'
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status: 'new', 'in_progress', 'resolved', 'closed'
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  
  -- Creator information
  created_by_id BIGINT NOT NULL,
  created_by_type VARCHAR(20) NOT NULL CHECK (created_by_type IN ('employee', 'customer')),
  
  -- Assignment
  assigned_to_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Related entities (optional)
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  related_project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by_id ON tickets(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_id ON tickets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_type_status ON tickets(type, status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

COMMIT;
