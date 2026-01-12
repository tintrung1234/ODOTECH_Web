-- Migrate existing customer data from sales_projects to customers table
-- This script should be run after creating the customers table

INSERT INTO customers (
  ma_kh,
  name,
  phone,
  zalo_fb,
  nguon_khach,
  nhu_cau,
  san_pham_dv,
  website,
  sale_id,
  created_at
)
SELECT DISTINCT ON (ma_kh)
  ma_kh,
  ten_khach as name,
  sdt as phone,
  zalo_fb,
  nguon_khach,
  nhu_cau,
  san_pham_dv,
  website,
  CASE 
    WHEN sale_id ~ '^[0-9]+$' THEN sale_id::BIGINT
    ELSE NULL
  END as sale_id,
  MIN(ngay_tao) as created_at
FROM sales_projects
WHERE ma_kh IS NOT NULL AND ma_kh != ''
GROUP BY ma_kh, ten_khach, sdt, zalo_fb, nguon_khach, nhu_cau, san_pham_dv, website, sale_id
ON CONFLICT (ma_kh) DO NOTHING;

-- Verify migration
SELECT 
  COUNT(*) as total_customers,
  COUNT(DISTINCT ma_kh) as unique_ma_kh
FROM customers;
