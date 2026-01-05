-- Project tasks schema for ODOTECH
-- Run this on your PostgreSQL database to enable /api/projects/:id/tasks endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS project_tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  tieu_de TEXT NOT NULL,
  nguoi_phu_trach TEXT,
  nguoi_chinh TEXT,
  nguoi_ho_tro TEXT,
  ngay_bat_dau DATE,
  han_chot DATE,
  trang_thai TEXT NOT NULL DEFAULT 'Chưa làm',
  tien_do NUMERIC(5, 2) NOT NULL DEFAULT 0,
  gio_cong NUMERIC(12, 2) NOT NULL DEFAULT 0,
  muc_uu_tien TEXT,
  ghi_chu TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For existing databases, ensure new columns exist
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS nguoi_chinh TEXT;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS nguoi_ho_tro TEXT;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS ngay_bat_dau DATE;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS tien_do NUMERIC(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS gio_cong NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS muc_uu_tien TEXT;

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_trang_thai ON project_tasks(trang_thai);
CREATE INDEX IF NOT EXISTS idx_project_tasks_han_chot ON project_tasks(han_chot);
CREATE INDEX IF NOT EXISTS idx_project_tasks_ngay_bat_dau ON project_tasks(ngay_bat_dau);

COMMIT;
