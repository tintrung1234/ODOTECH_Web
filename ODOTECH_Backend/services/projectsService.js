const { pool } = require("../config/postgres");

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function formatTimestamp(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toDbDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function toDbTimestamp(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function mapProjectRow(row) {
  return {
    id: Number(row.id),
    project_code: row.project_code ?? "",
    project_type: row.project_type ?? "",
    name: row.name ?? "",

    client_id: row.client_id === null || row.client_id === undefined ? null : Number(row.client_id),
    sale_id: row.sale_id === null || row.sale_id === undefined ? null : Number(row.sale_id),
    pm_id: row.pm_id === null || row.pm_id === undefined ? null : Number(row.pm_id),

    status: row.status ?? "",
    priority: row.priority ?? "",

    budget: Number(row.budget ?? 0),
    contract_value: Number(row.contract_value ?? 0),
    actual_cost: Number(row.actual_cost ?? 0),
    deposit_received: Number(row.deposit_received ?? 0),

    payment_status: row.payment_status ?? "",
    total_hours: Number(row.total_hours ?? 0),

    technology_stack: row.technology_stack ?? "",
    domain_url: row.domain_url ?? "",
    production_url: row.production_url ?? "",

    start_date: formatDate(row.start_date),
    deadline: formatDate(row.deadline),
    completed_at: formatTimestamp(row.completed_at),

    description: row.description ?? "",

    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
  };
}

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
    items: listResult.rows.map(mapProjectRow),
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
  return row ? mapProjectRow(row) : null;
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
      toDbDate(input.start_date),
      toDbDate(input.deadline),
      toDbTimestamp(input.completed_at),
      input.description,
    ]
  );

  return mapProjectRow(result.rows[0]);
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
      toDbDate(input.start_date),
      toDbDate(input.deadline),
      toDbTimestamp(input.completed_at),
      input.description,
    ]
  );

  const row = result.rows[0];
  return row ? mapProjectRow(row) : null;
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
