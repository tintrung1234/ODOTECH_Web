const crypto = require("crypto");
const authRepository = require("../repositories/authRepository");

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
  return authRepository.getAccountForAuthByEmail(email);
}

async function getAccountForAuthByUsername(username) {
  return authRepository.getAccountForAuthByUsername(username);
}

async function registerAccount({ username, password_hash, role_system = "employee", status = "active", email: providedEmail }) {
  const name = String(username || "").trim();
  const email = providedEmail ? providedEmail.trim() : buildPlaceholderEmail(username);

  return authRepository.registerAccount({
    username,
    name,
    email,
    role_system,
    status,
    password_hash,
  });
}

async function updateAccount(id, updates) {
  return authRepository.updateAccount(id, updates);
}

module.exports = {
  getAccountForAuthByEmail,
  getAccountForAuthByUsername,
  registerAccount,
  updateAccount,
};
