const { pool } = require("../config/postgres");
const authAccountModel = require("../models/authAccount");

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

  return authAccountModel.mapAuthAccountRow(result.rows[0]);
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

  return authAccountModel.mapAuthAccountRow(result.rows[0]);
}

async function registerAccount({ username, name, email, role_system, status, password_hash }) {
  const result = await pool.query(
    `
      INSERT INTO accounts (username, name, email, role_system, status, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, name, email, role_system, status
    `,
    [username, name, email, role_system, status, password_hash]
  );

  return authAccountModel.mapRegisteredAccountRow(result.rows[0]);
}

async function updateAccount(id, updates) {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (updates.username) {
    fields.push(`username = $${paramIndex}`);
    params.push(updates.username);
    paramIndex++;
  }

  if (updates.password_hash) {
    fields.push(`password_hash = $${paramIndex}`);
    params.push(updates.password_hash);
    paramIndex++;
  }

  if (updates.status) {
    fields.push(`status = $${paramIndex}`);
    params.push(updates.status);
    paramIndex++;
  }

  if (fields.length === 0) return null;

  params.push(id);
  const query = `
    UPDATE accounts
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING id, username, name, email, role_system, status
  `;

  const result = await pool.query(query, params);
  return result.rows.length > 0 ? authAccountModel.mapAuthAccountRow(result.rows[0]) : null;
}

module.exports = {
  getAccountForAuthByEmail,
  getAccountForAuthByUsername,
  registerAccount,
  updateAccount,
};
