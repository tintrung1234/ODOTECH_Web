-- Project tasks schema for ODOTECH
-- Run this on your PostgreSQL database to enable /api/projects/:id/tasks endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS project_tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  tieu_de TEXT NOT NULL,
  nguoi_phu_trach TEXT,
  han_chot DATE,
  trang_thai TEXT NOT NULL DEFAULT 'Chưa làm',
  ghi_chu TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_trang_thai ON project_tasks(trang_thai);
CREATE INDEX IF NOT EXISTS idx_project_tasks_han_chot ON project_tasks(han_chot);

COMMIT;
