const { pool } = require("../config/postgres");
const projectTaskModel = require("../models/projectTask");

async function listTasksByProjectId(projectId) {
  const result = await pool.query(
    `
      SELECT *
      FROM project_tasks
      WHERE project_id = $1
      ORDER BY id DESC
    `,
    [projectId]
  );

  return result.rows.map(projectTaskModel.mapProjectTaskRow);
}

async function getTaskById(projectId, taskId) {
  const result = await pool.query(
    `
      SELECT *
      FROM project_tasks
      WHERE project_id = $1 AND id = $2
      LIMIT 1
    `,
    [projectId, taskId]
  );

  const row = result.rows[0];
  return row ? projectTaskModel.mapProjectTaskRow(row) : null;
}

async function createTask(projectId, input) {
  const result = await pool.query(
    `
      INSERT INTO project_tasks (
        project_id,
        tieu_de,
        nguoi_phu_trach,
        nguoi_chinh,
        nguoi_ho_tro,
        ngay_bat_dau,
        han_chot,
        trang_thai,
        tien_do,
        gio_cong,
        muc_uu_tien,
        ghi_chu
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `,
    [
      projectId,
      input.tieuDe,
      input.nguoiPhuTrach,
      input.nguoiChinh,
      input.nguoiHoTro,
      projectTaskModel.toDbDate(input.batDau),
      projectTaskModel.toDbDate(input.hanChot),
      input.trangThai,
      input.tienDo,
      input.gioCong,
      input.mucUuTien,
      input.ghiChu,
    ]
  );

  return projectTaskModel.mapProjectTaskRow(result.rows[0]);
}

async function updateTask(projectId, taskId, patch) {
  const fields = [];
  const params = [projectId, taskId];

  const pushField = (sql, value) => {
    params.push(value);
    fields.push(`${sql} = $${params.length}`);
  };

  if (patch.tieuDe !== undefined) pushField("tieu_de", patch.tieuDe);
  if (patch.nguoiPhuTrach !== undefined) pushField("nguoi_phu_trach", patch.nguoiPhuTrach);
  if (patch.nguoiChinh !== undefined) pushField("nguoi_chinh", patch.nguoiChinh);
  if (patch.nguoiHoTro !== undefined) pushField("nguoi_ho_tro", patch.nguoiHoTro);
  if (patch.batDau !== undefined) pushField("ngay_bat_dau", projectTaskModel.toDbDate(patch.batDau));
  if (patch.hanChot !== undefined) pushField("han_chot", projectTaskModel.toDbDate(patch.hanChot));
  if (patch.trangThai !== undefined) pushField("trang_thai", patch.trangThai);
  if (patch.tienDo !== undefined) pushField("tien_do", patch.tienDo);
  if (patch.gioCong !== undefined) pushField("gio_cong", patch.gioCong);
  if (patch.mucUuTien !== undefined) pushField("muc_uu_tien", patch.mucUuTien);
  if (patch.ghiChu !== undefined) pushField("ghi_chu", patch.ghiChu);

  if (fields.length === 0) return null;

  const result = await pool.query(
    `
      UPDATE project_tasks
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE project_id = $1 AND id = $2
      RETURNING *
    `,
    params
  );

  const row = result.rows[0];
  return row ? projectTaskModel.mapProjectTaskRow(row) : null;
}

async function deleteTask(projectId, taskId) {
  const result = await pool.query(
    `
      DELETE FROM project_tasks
      WHERE project_id = $1 AND id = $2
      RETURNING id
    `,
    [projectId, taskId]
  );

  return Boolean(result.rows[0]);
}

async function isUserMainAssigneeOfProject(projectId, accountId) {
  const result = await pool.query(
    `
      SELECT 1
      FROM project_tasks
      WHERE project_id = $1 AND nguoi_chinh = $2
      LIMIT 1
    `,
    [projectId, accountId]
  );

  return Boolean(result.rows[0]);
}

async function listTasksForDueReminders({ dueBeforeDays = 1, overdueDays = 7, limit = 500 }) {
  const dueDays = Number(dueBeforeDays);
  const overDays = Number(overdueDays);
  const lim = Number(limit);

  const safeDue = Number.isFinite(dueDays) ? Math.max(0, Math.min(30, dueDays)) : 1;
  const safeOver = Number.isFinite(overDays) ? Math.max(0, Math.min(90, overDays)) : 7;
  const safeLimit = Number.isFinite(lim) ? Math.max(1, Math.min(2000, lim)) : 500;

  const result = await pool.query(
    `
      SELECT
        pt.*,
        p.name AS project_name,
        p.project_code AS project_code
      FROM project_tasks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.han_chot IS NOT NULL
        AND COALESCE(pt.trang_thai, '') <> 'Đã xong'
        AND pt.han_chot >= (CURRENT_DATE - ($1::int))
        AND pt.han_chot <= (CURRENT_DATE + ($2::int))
      ORDER BY pt.han_chot ASC, pt.id ASC
      LIMIT $3
    `,
    [safeOver, safeDue, safeLimit]
  );

  return result.rows;
}

module.exports = {
  listTasksByProjectId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  isUserMainAssigneeOfProject,
  listTasksForDueReminders,
};
