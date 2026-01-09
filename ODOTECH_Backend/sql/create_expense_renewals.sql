-- Migration script for Expense Renewals Management
-- Run this script to create the expense_renewals table

-- Create expense_renewals table
CREATE TABLE IF NOT EXISTS expense_renewals (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN ('salary', 'tax', 'fixed_costs')),
  description TEXT NOT NULL,
  amount DECIMAL(15, 2),
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  recurrence VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('monthly', 'quarterly', 'yearly', 'one-time')),
  assignee_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_renewals_category ON expense_renewals(category);
CREATE INDEX IF NOT EXISTS idx_expense_renewals_status ON expense_renewals(status);
CREATE INDEX IF NOT EXISTS idx_expense_renewals_due_date ON expense_renewals(due_date);
CREATE INDEX IF NOT EXISTS idx_expense_renewals_assignee_id ON expense_renewals(assignee_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expense_renewals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_renewals_updated_at
  BEFORE UPDATE ON expense_renewals
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_renewals_updated_at();

-- Insert sample data for testing (optional)
INSERT INTO expense_renewals (category, description, amount, due_date, status, recurrence, notes) VALUES
  ('salary', 'Lương tháng 1/2026', 50000000, '2026-01-31', 'pending', 'monthly', 'Lương nhân viên tháng 1'),
  ('tax', 'Thuế GTGT quý 1/2026', 15000000, '2026-03-31', 'pending', 'quarterly', 'Thuế giá trị gia tăng'),
  ('fixed_costs', 'Tiền thuê văn phòng tháng 1', 20000000, '2026-01-15', 'pending', 'monthly', 'Văn phòng tầng 5'),
  ('fixed_costs', 'Điện nước tháng 12/2025', 3000000, '2026-01-10', 'paid', 'monthly', 'Đã thanh toán'),
  ('salary', 'Thưởng Tết 2026', 100000000, '2026-01-20', 'pending', 'one-time', 'Thưởng Tết Nguyên Đán');

COMMENT ON TABLE expense_renewals IS 'Quản lý các khoản chi phí định kỳ của doanh nghiệp';
COMMENT ON COLUMN expense_renewals.category IS 'Danh mục: salary (Lương), tax (Thuế), fixed_costs (Chi phí cố định)';
COMMENT ON COLUMN expense_renewals.status IS 'Trạng thái: pending (Chờ thanh toán), paid (Đã thanh toán), overdue (Quá hạn)';
COMMENT ON COLUMN expense_renewals.recurrence IS 'Chu kỳ: monthly (Hàng tháng), quarterly (Hàng quý), yearly (Hàng năm), one-time (Một lần)';
