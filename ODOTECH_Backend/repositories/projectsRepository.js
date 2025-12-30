const { pool } = require("../config/postgres");
const projectModel = require("../models/project");

async function listProjects({ limit, offset, q, status }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(LOWER(name) LIKE $${params.length} OR LOWER(project_code) LIKE $${params.length})`);
  }

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const listSql = `
    SELECT *
    FROM projects
    ${whereSql}
    ORDER BY id DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `SELECT COUNT(*)::int AS total FROM projects ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    items: listResult.rows.map(projectModel.mapProjectRow),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getProjectById(projectId) {
  const result = await pool.query(
    `
      SELECT *
      FROM projects
      WHERE id = $1
      LIMIT 1
    `,
    [projectId]
  );

  const row = result.rows[0];
  return row ? projectModel.mapProjectRow(row) : null;
}

async function createProject(input) {
  const result = await pool.query(
    `
      INSERT INTO projects (
        project_code,
        project_type,
        name,
        client_id,
        sale_id,
        pm_id,
        status,
        priority,
        budget,
        contract_value,
        actual_cost,
        deposit_received,
        payment_status,
        total_hours,
        technology_stack,
        domain_url,
        production_url,
        start_date,
        deadline,
        completed_at,
        description
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING *
    `,
    [
      input.project_code,
      input.project_type,
      input.name,
      input.client_id,
      input.sale_id,
      input.pm_id,
      input.status,
      input.priority,
      input.budget,
      input.contract_value,
      input.actual_cost,
      input.deposit_received,
      input.payment_status,
      input.total_hours,
      input.technology_stack,
      input.domain_url,
      input.production_url,
      projectModel.toDbDate(input.start_date),
      projectModel.toDbDate(input.deadline),
      projectModel.toDbTimestamp(input.completed_at),
      input.description,
    ]
  );

  return projectModel.mapProjectRow(result.rows[0]);
}

async function updateProject(projectId, input) {
  const result = await pool.query(
    `
      UPDATE projects
      SET
        project_code = $2,
        project_type = $3,
        name = $4,
        client_id = $5,
        sale_id = $6,
        pm_id = $7,
        status = $8,
        priority = $9,
        budget = $10,
        contract_value = $11,
        actual_cost = $12,
        deposit_received = $13,
        payment_status = $14,
        total_hours = $15,
        technology_stack = $16,
        domain_url = $17,
        production_url = $18,
        start_date = $19,
        deadline = $20,
        completed_at = $21,
        description = $22,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      projectId,
      input.project_code,
      input.project_type,
      input.name,
      input.client_id,
      input.sale_id,
      input.pm_id,
      input.status,
      input.priority,
      input.budget,
      input.contract_value,
      input.actual_cost,
      input.deposit_received,
      input.payment_status,
      input.total_hours,
      input.technology_stack,
      input.domain_url,
      input.production_url,
      projectModel.toDbDate(input.start_date),
      projectModel.toDbDate(input.deadline),
      projectModel.toDbTimestamp(input.completed_at),
      input.description,
    ]
  );

  const row = result.rows[0];
  return row ? projectModel.mapProjectRow(row) : null;
}

async function deleteProject(projectId) {
  const result = await pool.query(
    `
      DELETE FROM projects
      WHERE id = $1
      RETURNING id
    `,
    [projectId]
  );
  return Boolean(result.rows[0]);
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
