-- Create customers table
-- This table stores customer information separately from sales_projects
-- Data is automatically synced from sales_projects via trigger

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  ma_kh VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  zalo_fb VARCHAR(255),
  company VARCHAR(255),
  nguon_khach VARCHAR(100),
  nhu_cau TEXT,
  san_pham_dv TEXT,
  website VARCHAR(255),
  sale_id BIGINT REFERENCES accounts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_ma_kh ON customers(ma_kh);
CREATE INDEX IF NOT EXISTS idx_customers_sale_id ON customers(sale_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_nguon_khach ON customers(nguon_khach);

-- Add comment
COMMENT ON TABLE customers IS 'Customer master data, auto-synced from sales_projects';
COMMENT ON COLUMN customers.ma_kh IS 'Customer code (unique identifier)';
COMMENT ON COLUMN customers.name IS 'Customer name';
COMMENT ON COLUMN customers.nguon_khach IS 'Customer source (e.g., Facebook, Google, Referral)';
