const { pool } = require("../config/postgres");
const leaveModel = require("../models/leaveRequest");

async function listLeaveRequests({ limit, offset, q, accountId, trangThai }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(
      `(LOWER(COALESCE(lr.ly_do,'')) LIKE $${params.length} OR LOWER(a.name) LIKE $${params.length} OR LOWER(a.email) LIKE $${params.length})`
    );
  }

  if (accountId) {
    params.push(accountId);
    where.push(`lr.account_id = $${params.length}`);
  }

  if (trangThai) {
    params.push(trangThai);
    where.push(`lr.trang_thai = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const listSql = `
    SELECT lr.*
    FROM leave_requests lr
    JOIN accounts a ON a.id = lr.account_id
    ${whereSql}
    ORDER BY lr.id DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM leave_requests lr
    JOIN accounts a ON a.id = lr.account_id
    ${whereSql}
  `;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    items: listResult.rows.map(leaveModel.mapLeaveRow),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getLeaveRequestById(leaveId) {
  const result = await pool.query(
    `
      SELECT *
      FROM leave_requests
      WHERE id = $1
      LIMIT 1
    `,
    [leaveId]
  );

  const row = result.rows[0];
  return row ? leaveModel.mapLeaveRow(row) : null;
}

async function createLeaveRequest(input) {
  const result = await pool.query(
    `
      INSERT INTO leave_requests (
        account_id,
        tu_ngay,
        den_ngay,
        ly_do,
        trang_thai,
        ngay_tao,
        nguoi_duyet,
        ngay_xu_ly,
        ghi_chu
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      RETURNING *
    `,
    [
      input.accountId,
      leaveModel.toDbDate(input.tuNgay),
      leaveModel.toDbDate(input.denNgay),
      input.lyDo,
      input.trangThai,
      leaveModel.toDbDate(input.ngayTao),
      input.nguoiDuyet,
      leaveModel.toDbDate(input.ngayXuLy),
      input.ghiChu,
    ]
  );

  return leaveModel.mapLeaveRow(result.rows[0]);
}

async function updateLeaveRequest(leaveId, input) {
  const result = await pool.query(
    `
      UPDATE leave_requests
      SET
        account_id = $2,
        tu_ngay = $3,
        den_ngay = $4,
        ly_do = $5,
        trang_thai = $6,
        ngay_tao = $7,
        nguoi_duyet = $8,
        ngay_xu_ly = $9,
        ghi_chu = $10,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      leaveId,
      input.accountId,
      leaveModel.toDbDate(input.tuNgay),
      leaveModel.toDbDate(input.denNgay),
      input.lyDo,
      input.trangThai,
      leaveModel.toDbDate(input.ngayTao),
      input.nguoiDuyet,
      leaveModel.toDbDate(input.ngayXuLy),
      input.ghiChu,
    ]
  );

  const row = result.rows[0];
  return row ? leaveModel.mapLeaveRow(row) : null;
}

async function deleteLeaveRequest(leaveId) {
  const result = await pool.query(
    `
      DELETE FROM leave_requests
      WHERE id = $1
      RETURNING id
    `,
    [leaveId]
  );
  return Boolean(result.rows[0]);
}

module.exports = {
  listLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
};
