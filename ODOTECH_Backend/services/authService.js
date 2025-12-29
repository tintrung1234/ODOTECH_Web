const { pool } = require("../config/postgres");
const crypto = require("crypto");

function buildPlaceholderEmail(username) {
  const base = String(username || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .slice(0, 40);
  const safeBase = base || "user";
  const hash = crypto.createHash("sha256").update(String(username)).digest("hex").slice(0, 10);
  return `${safeBase}_${hash}@odotech.local`;
}

async function getAccountForAuthByEmail(email) {
  const result = await pool.query(
    `
      SELECT id, username, name, email, role_system, status, password_hash
      FROM accounts
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    username: row.username ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    role_system: row.role_system ?? "",
    status: row.status ?? "",
    password_hash: row.password_hash ?? "",
  };
}

async function getAccountForAuthByUsername(username) {
  const result = await pool.query(
    `
      SELECT id, username, name, email, role_system, status, password_hash
      FROM accounts
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1
    `,
    [username]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    username: row.username ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    role_system: row.role_system ?? "",
    status: row.status ?? "",
    password_hash: row.password_hash ?? "",
  };
}

async function registerAccount({ username, password_hash, role_system = "employee", status = "active" }) {
  const name = String(username || "").trim();
  const email = buildPlaceholderEmail(username);

  const result = await pool.query(
    `
      INSERT INTO accounts (username, name, email, role_system, status, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, name, email, role_system, status
    `,
    [username, name, email, role_system, status, password_hash]
  );

  const row = result.rows[0];
  return {
    id: Number(row.id),
    username: row.username ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    role_system: row.role_system ?? "",
    status: row.status ?? "",
  };
}

module.exports = {
  getAccountForAuthByEmail,
  getAccountForAuthByUsername,
  registerAccount,
};
