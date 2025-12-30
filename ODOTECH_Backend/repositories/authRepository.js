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

module.exports = {
  getAccountForAuthByEmail,
  getAccountForAuthByUsername,
  registerAccount,
};
