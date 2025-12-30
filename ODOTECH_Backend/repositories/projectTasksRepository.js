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

async function createTask(projectId, input) {
  const result = await pool.query(
    `
      INSERT INTO project_tasks (
        project_id,
        tieu_de,
        nguoi_phu_trach,
        han_chot,
        trang_thai,
        ghi_chu
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
    [
      projectId,
      input.tieuDe,
      input.nguoiPhuTrach,
      projectTaskModel.toDbDate(input.hanChot),
      input.trangThai,
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
  if (patch.hanChot !== undefined) pushField("han_chot", projectTaskModel.toDbDate(patch.hanChot));
  if (patch.trangThai !== undefined) pushField("trang_thai", patch.trangThai);
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

module.exports = {
  listTasksByProjectId,
  createTask,
  updateTask,
  deleteTask,
};
