-- Auto-sync trigger for customers table
-- Automatically creates/updates customer records when sales_projects are inserted/updated

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_customer_trigger ON sales_projects;
DROP FUNCTION IF EXISTS sync_customer_from_sales_project();

-- Create trigger function
CREATE OR REPLACE FUNCTION sync_customer_from_sales_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update customer based on ma_kh
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
  ) VALUES (
    NEW.ma_kh,
    NEW.ten_khach,
    NEW.sdt,
    NEW.zalo_fb,
    NEW.nguon_khach,
    NEW.nhu_cau,
    NEW.san_pham_dv,
    NEW.website,
    CASE 
      WHEN NEW.sale_id ~ '^[0-9]+$' THEN NEW.sale_id::BIGINT
      ELSE NULL
    END,
    NEW.ngay_tao
  )
  ON CONFLICT (ma_kh) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, customers.name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    zalo_fb = COALESCE(EXCLUDED.zalo_fb, customers.zalo_fb),
    nguon_khach = COALESCE(EXCLUDED.nguon_khach, customers.nguon_khach),
    nhu_cau = COALESCE(EXCLUDED.nhu_cau, customers.nhu_cau),
    san_pham_dv = COALESCE(EXCLUDED.san_pham_dv, customers.san_pham_dv),
    website = COALESCE(EXCLUDED.website, customers.website),
    sale_id = COALESCE(EXCLUDED.sale_id, customers.sale_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on sales_projects
CREATE TRIGGER sync_customer_trigger
  AFTER INSERT OR UPDATE ON sales_projects
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_from_sales_project();

-- Add comment
COMMENT ON FUNCTION sync_customer_from_sales_project() IS 'Automatically sync customer data from sales_projects to customers table';
