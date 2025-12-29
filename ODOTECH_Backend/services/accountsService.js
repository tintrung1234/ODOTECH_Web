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

function mapAccountRow(row) {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role_system: row.role_system ?? "",
    point: Number(row.point ?? 0),
    position: row.position ?? "",
    salary: Number(row.salary ?? 0),
    payable: Number(row.payable ?? 0),
    join_date: formatDate(row.join_date),
    status: row.status ?? "",
    password_hash: row.password_hash ?? "",
    last_login_at: formatTimestamp(row.last_login_at),
    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
  };
}

async function listAccounts({ limit, offset, q, status, role_system }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(
      `(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(COALESCE(phone,'')) LIKE $${params.length})`
    );
  }

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  if (role_system) {
    params.push(role_system);
    where.push(`role_system = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const listSql = `
    SELECT *
    FROM accounts
    ${whereSql}
    ORDER BY id DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `SELECT COUNT(*)::int AS total FROM accounts ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    items: listResult.rows.map(mapAccountRow),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getAccountById(accountId) {
  const result = await pool.query(
    `
      SELECT *
      FROM accounts
      WHERE id = $1
      LIMIT 1
    `,
    [accountId]
  );

  const row = result.rows[0];
  return row ? mapAccountRow(row) : null;
}

async function createAccount(input) {
  const result = await pool.query(
    `
      INSERT INTO accounts (
        name,
        email,
        phone,
        role_system,
        point,
        position,
        salary,
        payable,
        join_date,
        status,
        password_hash,
        last_login_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      RETURNING *
    `,
    [
      input.name,
      input.email,
      input.phone,
      input.role_system,
      input.point,
      input.position,
      input.salary,
      input.payable,
      toDbDate(input.join_date),
      input.status,
      input.password_hash,
      toDbTimestamp(input.last_login_at),
    ]
  );

  return mapAccountRow(result.rows[0]);
}

async function updateAccount(accountId, input) {
  const result = await pool.query(
    `
      UPDATE accounts
      SET
        name = $2,
        email = $3,
        phone = $4,
        role_system = $5,
        point = $6,
        position = $7,
        salary = $8,
        payable = $9,
        join_date = $10,
        status = $11,
        password_hash = $12,
        last_login_at = $13,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      accountId,
      input.name,
      input.email,
      input.phone,
      input.role_system,
      input.point,
      input.position,
      input.salary,
      input.payable,
      toDbDate(input.join_date),
      input.status,
      input.password_hash,
      toDbTimestamp(input.last_login_at),
    ]
  );

  const row = result.rows[0];
  return row ? mapAccountRow(row) : null;
}

async function deleteAccount(accountId) {
  const result = await pool.query(
    `
      DELETE FROM accounts
      WHERE id = $1
      RETURNING id
    `,
    [accountId]
  );
  return Boolean(result.rows[0]);
}

async function getAccountStats() {
  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_accounts,
        COUNT(*) FILTER (WHERE role_system = 'manager')::int AS total_managers,
        COUNT(*) FILTER (WHERE role_system = 'employee')::int AS total_employees
      FROM accounts
    `
  );

  const row = result.rows[0] ?? {};
  return {
    totalAccounts: row.total_accounts ?? 0,
    totalManagers: row.total_managers ?? 0,
    totalEmployees: row.total_employees ?? 0,
  };
}

module.exports = {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStats,
};
