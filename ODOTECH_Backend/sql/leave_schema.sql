-- Leave requests module schema for ODOTECH
-- Run this on your PostgreSQL database before calling /api/leave-requests endpoints.

BEGIN;

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  tu_ngay DATE NOT NULL,
  den_ngay DATE NOT NULL,
  ly_do TEXT,

  trang_thai TEXT NOT NULL DEFAULT 'pending' CHECK (trang_thai IN ('pending', 'approved', 'rejected')),
  ngay_tao DATE NOT NULL DEFAULT CURRENT_DATE,
  nguoi_duyet TEXT,
  ngay_xu_ly DATE,
  ghi_chu TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_account_id ON leave_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_trang_thai ON leave_requests(trang_thai);
CREATE INDEX IF NOT EXISTS idx_leave_requests_ngay_tao ON leave_requests(ngay_tao);

COMMIT;
