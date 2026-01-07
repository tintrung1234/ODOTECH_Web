const renewalsService = require("../services/renewalsService");
const { pool } = require("../config/postgres");

const { requireUser, normalizeRole } = require("../utils/authz");

function canViewRenewals(role) {
  return [
    "admin",
    "support",
    "sale",
    "sales_manager",
    "head_sales",
    "dev",
    "dev_manager",
    "head_tech",
  ].includes(role);
}

function canEditRenewalMeta(role) {
  if (role === "support") return false;
  return ["admin", "sale", "sales_manager", "head_sales"].includes(role);
}

function canGetCredentials(role) {
  // Requirement: dev/dev manager/head tech/admin can get pass.
  return ["admin", "dev", "dev_manager", "head_tech"].includes(role);
}

function getSaleScopeId(req) {
  const name = typeof req.user?.name === "string" ? req.user.name.trim() : "";
  const username = typeof req.user?.username === "string" ? req.user.username.trim() : "";
  return name || username;
}

async function listRenewals(req, res, next) {
  try {
    const auth = requireUser(req);
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });

    const role = normalizeRole(auth.role);
    if (!canViewRenewals(role)) return res.status(403).json({ message: "Forbidden" });

    const safeLimit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? 50), 10) || 50, 1), 200);
    const safeOffset = Math.max(Number.parseInt(String(req.query.offset ?? 0), 10) || 0, 0);

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const kind = typeof req.query.kind === "string" ? req.query.kind.trim() : "";
    const sale_id = typeof req.query.sale_id === "string" ? req.query.sale_id.trim() : "";
    const pm_id = typeof req.query.pm_id === "string" ? req.query.pm_id.trim() : "";
    const due = typeof req.query.due === "string" ? req.query.due.trim() : "";

    const scopedSaleId = role === "sale" ? getSaleScopeId(req) : "";

    const redactMoney = ["dev", "dev_manager", "head_tech"].includes(role);

    const result = await renewalsService.listRenewalItems({
      limit: safeLimit,
      offset: safeOffset,
      q,
      kind,
      sale_id: scopedSaleId || sale_id,
      pm_id,
      due,
      redactMoney,
    });

    let totalAmount = null;
    if (!redactMoney) {
      totalAmount = result.items.reduce((sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0), 0);
    }

    res.json({ ...result, stats: { totalAmount } });
  } catch (err) {
    next(err);
  }
}

function normalizeKind(kind) {
  const k = String(kind || "").trim().toLowerCase();
  if (!["domain", "hosting", "email", "manage", "content", "ads"].includes(k)) return "";
  return k;
}

function toOptionalString(value) {
  const s = value === undefined || value === null ? "" : String(value);
  const trimmed = s.trim();
  return trimmed;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toOptionalInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toOptionalBigint(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

async function upsertRenewalMeta(req, res, next) {
  try {
    const auth = requireUser(req);
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });

    const role = normalizeRole(auth.role);
    if (!canEditRenewalMeta(role)) return res.status(403).json({ message: "Forbidden" });

    const sales_project_id = Number(req.params.salesProjectId);
    if (!Number.isFinite(sales_project_id)) return res.status(400).json({ message: "Invalid salesProjectId" });

    const kind = normalizeKind(req.params.kind);
    if (!kind) return res.status(400).json({ message: "Invalid kind" });

    // Sale can only edit their own projects.
    if (role === "sale") {
      const saleScope = getSaleScopeId(req);
      const ownership = await pool.query(
        `SELECT sale_id FROM sales_projects WHERE id = $1 LIMIT 1`,
        [sales_project_id]
      );
      const row = ownership.rows[0];
      if (!row) return res.status(404).json({ message: "Sales project not found" });
      if (String(row.sale_id || "").trim() !== String(saleScope || "").trim()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const enabled = req.body?.enabled === undefined ? true : Boolean(req.body.enabled);

    const renewal_date = toOptionalString(req.body?.renewal_date);
    const amount = toOptionalBigint(req.body?.amount);

    const provider = toOptionalString(req.body?.provider);
    const management_place = toOptionalString(req.body?.management_place);
    const management_url = toOptionalString(req.body?.management_url);
    const login_username = toOptionalString(req.body?.login_username);
    const login_password = hasOwn(req.body, "login_password") ? toOptionalString(req.body?.login_password) : undefined;

    const hosting_used_mb = toOptionalInt(req.body?.hosting_used_mb);
    const hosting_limit_mb = toOptionalInt(req.body?.hosting_limit_mb);

    const id = await renewalsService.upsertRenewalPackage({
      sales_project_id,
      kind,
      enabled,
      renewal_date,
      amount,
      provider,
      management_place,
      management_url,
      login_username,
      login_password,
      hosting_used_mb,
      hosting_limit_mb,
    });

    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
}

async function getCredentials(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });

    const role = normalizeRole(auth.role);
    if (!canGetCredentials(role)) return res.status(403).json({ message: "Forbidden" });

    const sales_project_id = Number(req.params.salesProjectId);
    if (!Number.isFinite(sales_project_id)) return res.status(400).json({ message: "Invalid salesProjectId" });

    const kind = normalizeKind(req.params.kind);
    if (!kind) return res.status(400).json({ message: "Invalid kind" });

    const pkg = await renewalsService.getRenewalPackageByProjectAndKind({ sales_project_id, kind });
    if (!pkg) return res.status(404).json({ message: "No credentials configured" });

    if (!pkg.login_password) return res.status(404).json({ message: "No credentials configured" });

    await renewalsService.logCredentialAccess({
      renewal_package_id: pkg.id,
      requested_by_uid: auth.uid,
      requested_by_username: req.user?.username,
      requested_by_name: req.user?.name,
    });

    // Notification integrations (app/mail/tele) are not wired yet; keep an audit log in DB.
    console.log(
      `[renewals] credential access: uid=${auth.uid} role=${role} sales_project_id=${sales_project_id} kind=${kind}`
    );

    res.json({
      login_username: pkg.login_username,
      login_password: pkg.login_password,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRenewals,
  upsertRenewalMeta,
  getCredentials,
};
