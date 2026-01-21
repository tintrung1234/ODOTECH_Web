const { pool } = require("../config/postgres");
const accountModel = require("../models/account");

function normalizeRoleKey(role) {
  return String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

async function listAccounts({ limit, offset, q, status, role_system }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(
      `(LOWER(COALESCE(username,'')) LIKE $${params.length} OR LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(COALESCE(phone,'')) LIKE $${params.length})`
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
    items: listResult.rows.map(accountModel.mapAccountRow),
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
  return row ? accountModel.mapAccountRow(row) : null;
}

async function createAccount(input) {
  const result = await pool.query(
    `
      INSERT INTO accounts (
        username,
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
        last_login_at,
        competency_framework,
        contract_start,
        contract_end,
        contract_type,
        renewal_history
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *
    `,
    [
      input.username,
      input.name,
      input.email,
      input.phone,
      input.role_system,
      input.point,
      input.position,
      input.salary,
      input.payable,
      accountModel.toDbDate(input.join_date),
      input.status,
      input.password_hash,
      accountModel.toDbTimestamp(input.last_login_at),
      input.competency_framework,
      accountModel.toDbDate(input.contract_start),
      accountModel.toDbDate(input.contract_end),
      input.contract_type,
      JSON.stringify(input.renewal_history || []),
    ]
  );

  return accountModel.mapAccountRow(result.rows[0]);
}

async function updateAccount(accountId, input) {
  // Prepare contract fields - use null if undefined to trigger COALESCE
  const contractStart = input.contract_start !== undefined ? accountModel.toDbDate(input.contract_start) : null;
  const contractEnd = input.contract_end !== undefined ? accountModel.toDbDate(input.contract_end) : null;
  const contractType = input.contract_type !== undefined ? input.contract_type : null;
  const renewalHistory = input.renewal_history !== undefined ? JSON.stringify(input.renewal_history || []) : null;

  const result = await pool.query(
    `
      UPDATE accounts
      SET
        username = $2,
        name = $3,
        email = $4,
        phone = $5,
        role_system = $6,
        point = $7,
        position = $8,
        salary = $9,
        payable = $10,
        join_date = $11,
        status = $12,
        last_login_at = $13,
        competency_framework = $14,
        contract_start = COALESCE($15, contract_start),
        contract_end = COALESCE($16, contract_end),
        contract_type = COALESCE($17, contract_type),
        renewal_history = COALESCE($18, renewal_history),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      accountId,
      input.username,
      input.name,
      input.email,
      input.phone,
      input.role_system,
      input.point,
      input.position,
      input.salary,
      input.payable,
      accountModel.toDbDate(input.join_date),
      input.status,
      accountModel.toDbTimestamp(input.last_login_at),
      input.competency_framework,
      contractStart,
      contractEnd,
      contractType,
      renewalHistory,
    ]
  );

  const row = result.rows[0];
  console.log('[DEBUG updateAccount] Result from DB:', {
    id: row?.id,
    contract_start: row?.contract_start,
    contract_end: row?.contract_end,
    contract_type: row?.contract_type,
    renewal_history: row?.renewal_history
  });

  return row ? accountModel.mapAccountRow(row) : null;
}

async function updateAccountEmail(accountId, email) {
  const result = await pool.query(
    `
      UPDATE accounts
      SET email = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [accountId, email]
  );

  const row = result.rows[0];
  return row ? accountModel.mapAccountRow(row) : null;
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

async function updateAccountPasswordHash(accountId, passwordHash) {
  const result = await pool.query(
    `
      UPDATE accounts
      SET password_hash = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [accountId, passwordHash]
  );
  return Boolean(result.rows[0]);
}

async function getAccountPasswordStatus(accountId) {
  const result = await pool.query(
    `
      SELECT (password_hash IS NOT NULL AND password_hash <> '') AS has_password
      FROM accounts
      WHERE id = $1
      LIMIT 1
    `,
    [accountId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { hasPassword: Boolean(row.has_password) };
}

async function getAccountStats() {
  // Normalize role_system by trimming, lowercasing, and stripping spaces.
  // Managers include (per requirement):
  // headdev, truongphongsale, quanlydev, truongphongkinhdoanh, hotrotong, quanlysale, admin
  // Plus common aliases already used across the app.
  const managerRoleKeys = [
    'admin',
    'administrator',
    'hotrotong',
    'support',
    'quanlysale',
    'quanly_sale',
    'salesmanager',
    'sales_manager',
    'truongphongsale',
    'truongphongkinhdoanh',
    'headsales',
    'head_sales',
    'quanlydev',
    'quanly_dev',
    'devmanager',
    'dev_manager',
    'headdev',
    'headtech',
    'head_tech',
    'truongphongkythuat',
  ];

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_accounts,
        COUNT(*) FILTER (
          WHERE regexp_replace(lower(coalesce(role_system, '')), '\\s+', '', 'g') = ANY($1::text[])
        )::int AS total_managers
      FROM accounts
    `,
    [managerRoleKeys]
  );

  const row = result.rows[0] ?? {};
  const totalAccounts = row.total_accounts ?? 0;
  const totalManagers = row.total_managers ?? 0;
  return {
    totalAccounts,
    totalManagers,
    totalEmployees: Math.max(0, totalAccounts - totalManagers),
  };
}

async function listActiveNonCustomerAccountIds({ excludeIds = [] } = {}) {
  const excluded = Array.from(
    new Set((Array.isArray(excludeIds) ? excludeIds : []).map((x) => Number(x)).filter(Number.isFinite))
  );

  const params = [];
  const where = ["status = 'active'", "regexp_replace(lower(coalesce(role_system, '')), '\\s+', '', 'g') <> 'customer'"];

  if (excluded.length > 0) {
    params.push(excluded);
    where.push(`id <> ALL($${params.length}::int[])`);
  }

  const result = await pool.query(
    `
      SELECT id
      FROM accounts
      WHERE ${where.join(" AND ")}
      ORDER BY id ASC
    `,
    params
  );

  return result.rows.map((r) => Number(r.id)).filter(Number.isFinite);
}

module.exports = {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  updateAccountEmail,
  deleteAccount,
  getAccountStats,
  updateAccountPasswordHash,
  getAccountPasswordStatus,
  listActiveNonCustomerAccountIds,
};
