-- Sales module schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/sales endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS sales_projects (
  id BIGSERIAL PRIMARY KEY,

  ma_kh TEXT NOT NULL,
  ma_du_an TEXT NOT NULL UNIQUE,
  ten_khach TEXT NOT NULL,
  sdt TEXT,
  zalo_fb TEXT,
  nguon_khach TEXT,
  nhu_cau TEXT,
  san_pham_dv TEXT,
  website TEXT,

  sale_id TEXT,
  ky_thuat_id TEXT,
  pm_id TEXT,

  trang_thai_chot TEXT NOT NULL DEFAULT 'DangCham' CHECK (trang_thai_chot IN ('DangCham', 'DaKy', 'Huy')),
  trang_thai_thu_tien TEXT NOT NULL DEFAULT 'Chua' CHECK (trang_thai_thu_tien IN ('Chua', 'MotPhan', 'Du')),
  trang_thai_trien_khai TEXT,

  ngay_tao DATE,
  lich_hen DATE,
  ghi_chu TEXT,
  ngay_cham_cuoi DATE,
  hinh_thuc_cham TEXT,

  phi_dich_vu BIGINT NOT NULL DEFAULT 0,
  phat_sinh BIGINT NOT NULL DEFAULT 0,
  ngay_doi_cuoi DATE,
  so_lan_doi INT NOT NULL DEFAULT 0,

  ngay_ban_giao DATE,
  ngay_tat_toan DATE,
  ly_do_lau TEXT,
  chi_phi_outsource BIGINT NOT NULL DEFAULT 0,

  gia_han_domain BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_hh_domain DATE,
  phi_gh_domain BIGINT NOT NULL DEFAULT 0,

  gia_han_hosting BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_hh_hosting DATE,
  phi_gh_hosting BIGINT NOT NULL DEFAULT 0,

  gia_han_email BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_hh_email DATE,
  phi_gh_email BIGINT NOT NULL DEFAULT 0,

  gia_han_content BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_hh_content DATE,
  phi_gh_content BIGINT NOT NULL DEFAULT 0,

  gia_han_ads BOOLEAN NOT NULL DEFAULT FALSE,
  ngay_hh_ads DATE,
  phi_gh_ads BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales_payments (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES sales_projects(id) ON DELETE CASCADE,

  lan_thanh_toan INT NOT NULL,
  so_tien BIGINT NOT NULL,
  ngay_thanh_toan DATE,
  ghi_chu TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_projects_ma_du_an ON sales_projects(ma_du_an);
CREATE INDEX IF NOT EXISTS idx_sales_projects_ten_khach ON sales_projects(ten_khach);
CREATE INDEX IF NOT EXISTS idx_sales_payments_project_id ON sales_payments(project_id);

COMMIT;
