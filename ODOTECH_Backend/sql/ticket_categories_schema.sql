-- Ticket Categories schema for ODOTECH
-- Categories for organizing tickets by type

BEGIN;

CREATE TABLE IF NOT EXISTS ticket_categories (
  id BIGSERIAL PRIMARY KEY,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'internal')),
  description TEXT,
  
  -- Display properties
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color code
  icon VARCHAR(50) DEFAULT 'ticket',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_categories_type ON ticket_categories(type);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_is_active ON ticket_categories(is_active);

-- Seed data for customer ticket categories
INSERT INTO ticket_categories (name, type, description, color, icon) VALUES
  ('Hỗ trợ kỹ thuật', 'customer', 'Technical support and troubleshooting', '#3B82F6', 'wrench'),
  ('Báo lỗi', 'customer', 'Bug reports and issues', '#EF4444', 'bug'),
  ('Yêu cầu tính năng', 'customer', 'Feature requests and enhancements', '#10B981', 'lightbulb'),
  ('Vấn đề tài khoản', 'customer', 'Account-related issues', '#F59E0B', 'user')
ON CONFLICT DO NOTHING;

-- Seed data for internal ticket categories
INSERT INTO ticket_categories (name, type, description, color, icon) VALUES
  ('Khiếu nại nội bộ', 'internal', 'Internal complaints and issues', '#EF4444', 'alert-circle'),
  ('Đề xuất cải tiến quy trình', 'internal', 'Process improvement suggestions', '#8B5CF6', 'trending-up'),
  ('Góp ý phát triển hệ thống', 'internal', 'System development suggestions', '#06B6D4', 'code'),
  ('Vấn đề HR', 'internal', 'HR-related issues', '#EC4899', 'users'),
  ('Yêu cầu thiết bị', 'internal', 'Equipment and resource requests', '#F97316', 'package')
ON CONFLICT DO NOTHING;

COMMIT;
