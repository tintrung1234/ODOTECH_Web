function normalizeRole(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  const noAccents = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const compact = noAccents.replace(/\s+/g, "");

  if (["admin", "administrator"].includes(compact)) return "admin";
  if (["hotrotong", "support"].includes(compact)) return "support";
  if (["sale", "sales"].includes(compact)) return "sale";
  if (["quanlysale", "salesmanager", "sales_manager"].includes(compact)) return "sales_manager";
  if (["truongphongkinhdoanh", "headsales", "head_sales"].includes(compact)) return "head_sales";
  if (["dev", "developer"].includes(compact)) return "dev";
  if (["quanlydev", "devmanager", "dev_manager"].includes(compact)) return "dev_manager";
  if (["truongphongkythuat", "headtech", "head_tech"].includes(compact)) return "head_tech";

  return compact;
}

function requireUser(req, { requireUid = false } = {}) {
  if (!req.user) return { error: { status: 401, message: "Authentication required" } };

  const role = normalizeRole(req.user.role);
  if (!role) return { error: { status: 401, message: "Authentication required" } };

  if (!requireUid) return { role };

  const uid = Number(req.user.uid);
  if (!Number.isFinite(uid)) return { error: { status: 401, message: "Authentication required" } };

  return { role, uid };
}

function getIdentityTokens(req, uid) {
  const tokens = [];
  if (Number.isFinite(uid)) tokens.push(String(uid));

  const name = typeof req.user?.name === "string" ? req.user.name.trim() : "";
  const username = typeof req.user?.username === "string" ? req.user.username.trim() : "";
  if (name) tokens.push(name);
  if (username) tokens.push(username);

  return Array.from(new Set(tokens)).filter(Boolean);
}

module.exports = {
  normalizeRole,
  requireUser,
  getIdentityTokens,
};
