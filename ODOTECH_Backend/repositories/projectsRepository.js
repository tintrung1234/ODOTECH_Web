const { pool } = require("../config/postgres");
const projectModel = require("../models/project");

async function listProjects({ limit, offset, q, status, scope }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(LOWER(p.name) LIKE $${params.length} OR LOWER(p.project_code) LIKE $${params.length})`);
  }

  if (status) {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }

  if (scope && scope.saleId !== undefined && scope.saleId !== null) {
    params.push(scope.saleId);
    where.push(`p.sale_id = $${params.length}`);
  }

  if (scope && scope.pmId !== undefined && scope.pmId !== null) {
    params.push(scope.pmId);
    where.push(`p.pm_id = $${params.length}`);
  }

  if (scope && Array.isArray(scope.memberTokens) && scope.memberTokens.length > 0) {
    const tokens = scope.memberTokens
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .slice(0, 10);

    if (tokens.length > 0) {
      const sub = [];
      for (const t of tokens) {
        params.push(`%${t.toLowerCase()}%`);
        const idx = params.length;
        sub.push(
          `(LOWER(COALESCE(p.tech_user,'')) LIKE $${idx} OR LOWER(COALESCE(p.assignee,'')) LIKE $${idx})`
        );
      }
      where.push(`(${sub.join(' OR ')})`);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const listSql = `
    SELECT
      p.*,
      COALESCE(ts.total_hours, 0) AS total_hours
    FROM projects p
    LEFT JOIN (
      SELECT project_id, SUM(COALESCE(gio_cong, 0))::numeric AS total_hours
      FROM project_tasks
      GROUP BY project_id
    ) ts ON ts.project_id = p.id
    ${whereSql}
    ORDER BY p.id DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `SELECT COUNT(*)::int AS total FROM projects p ${whereSql}`;

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
      SELECT
        p.*,
        COALESCE(ts.total_hours, 0) AS total_hours
      FROM projects p
      LEFT JOIN (
        SELECT project_id, SUM(COALESCE(gio_cong, 0))::numeric AS total_hours
        FROM project_tasks
        WHERE project_id = $1
        GROUP BY project_id
      ) ts ON ts.project_id = p.id
      WHERE p.id = $1
      LIMIT 1
    `,
    [projectId]
  );

  const row = result.rows[0];
  return row ? projectModel.mapProjectRow(row) : null;
}

async function getProjectByCode(projectCode) {
  const code = String(projectCode || '').trim();
  if (!code) return null;
  const result = await pool.query(
    `
      SELECT p.*
      FROM projects p
      WHERE p.project_code = $1
      LIMIT 1
    `,
    [code]
  );
  const row = result.rows[0];
  return row ? projectModel.mapProjectRow(row) : null;
}

async function updateActualCostByCode(projectCode, actualCost) {
  const code = String(projectCode || '').trim();
  if (!code) return null;
  const result = await pool.query(
    `
      UPDATE projects
      SET actual_cost = $2,
          updated_at = NOW()
      WHERE project_code = $1
      RETURNING *
    `,
    [code, actualCost]
  );
  const row = result.rows[0];
  return row ? projectModel.mapProjectRow(row) : null;
}

async function updateDepositReceivedByCode(projectCode, depositReceived) {
  const code = String(projectCode || '').trim();
  if (!code) return null;
  const result = await pool.query(
    `
      UPDATE projects
      SET deposit_received = $2,
          updated_at = NOW()
      WHERE project_code = $1
      RETURNING *
    `,
    [code, depositReceived]
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
        technology_stack,
        domain_url,
        production_url,
        start_date,
        deadline,
        completed_at,
        description,
        requirements,
        source,
        progress_percent,
        assignee,
        tech_user_id,
        customer_sender_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
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
      input.technology_stack,
      input.domain_url,
      input.production_url,
      projectModel.toDbDate(input.start_date),
      projectModel.toDbDate(input.deadline),
      projectModel.toDbTimestamp(input.completed_at),
      input.description,
      input.requirements,
      input.source,
      input.progress_percent,
      input.assignee,
      input.tech_user_id,
      input.customer_sender_id,
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
        technology_stack = $15,
        domain_url = $16,
        production_url = $17,
        start_date = $18,
        deadline = $19,
        completed_at = $20,
        description = $21,
        requirements = $22,
        source = $23,
        progress_percent = $24,
        assignee = $25,
        tech_user_id = $26,
        customer_sender_id = $27,
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
      input.technology_stack,
      input.domain_url,
      input.production_url,
      projectModel.toDbDate(input.start_date),
      projectModel.toDbDate(input.deadline),
      projectModel.toDbTimestamp(input.completed_at),
      input.description,
      input.requirements,
      input.source,
      input.progress_percent,
      input.assignee,
      input.tech_user_id,
      input.customer_sender_id,
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

async function getContractValuesByCodes({ codes, scope }) {
  const where = [];
  const params = [];

  const normalizedCodes = Array.isArray(codes) ? codes : [];
  const cleaned = normalizedCodes
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .slice(0, 200);

  if (cleaned.length === 0) {
    return [];
  }

  params.push(cleaned);
  where.push(`p.project_code = ANY($${params.length}::text[])`);

  if (scope && scope.saleId !== undefined && scope.saleId !== null) {
    params.push(scope.saleId);
    where.push(`p.sale_id = $${params.length}`);
  }

  if (scope && scope.pmId !== undefined && scope.pmId !== null) {
    params.push(scope.pmId);
    where.push(`p.pm_id = $${params.length}`);
  }

  if (scope && Array.isArray(scope.memberTokens) && scope.memberTokens.length > 0) {
    const tokens = scope.memberTokens
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .slice(0, 10);

    if (tokens.length > 0) {
      const sub = [];
      for (const t of tokens) {
        params.push(`%${t.toLowerCase()}%`);
        const idx = params.length;
        sub.push(
          `(LOWER(COALESCE(p.tech_user,'')) LIKE $${idx} OR LOWER(COALESCE(p.assignee,'')) LIKE $${idx})`
        );
      }
      where.push(`(${sub.join(' OR ')})`);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await pool.query(
    `
      SELECT p.project_code, p.contract_value
      FROM projects p
      ${whereSql}
    `,
    params
  );

  return result.rows.map((r) => ({
    project_code: r.project_code ?? '',
    contract_value: Number(r.contract_value ?? 0),
  }));
}

module.exports = {
  listProjects,
  getProjectById,
  getProjectByCode,
  createProject,
  updateProject,
  deleteProject,
  getContractValuesByCodes,
  updateActualCostByCode,
  updateDepositReceivedByCode,
};
