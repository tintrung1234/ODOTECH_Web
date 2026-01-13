const salesService = require("../services/salesService");

const { pool } = require("../config/postgres");

const { requireUser, getIdentityTokens } = require("../utils/authz");


function canViewSales(role) {
  return ["sale", "sales_manager", "head_sales", "support", "admin", "dev", "dev_manager", "head_tech"].includes(role);
}

function canEditSales(role) {
  return ["sale", "sales_manager", "head_sales", "admin"].includes(role);
}

function getPreferredScopeId(req, uid) {
  // Prefer uid for new writes; keep fallback to name/username for compatibility.
  if (Number.isFinite(uid)) return String(uid);
  const name = typeof req.user?.name === "string" ? req.user.name.trim() : "";
  const username = typeof req.user?.username === "string" ? req.user.username.trim() : "";
  return name || username;
}

async function listProjects(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    if (!canViewSales(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

    const {
      limit = 50,
      offset = 0,
      q = "",
      trang_thai_chot = "",
      trang_thai_thu_tien = "",
    } = req.listQuery || {};

    const sale_ids = auth.role === "sale" ? getIdentityTokens(req, auth.uid) : null;
    const ky_thuat_ids = auth.role === "dev" ? getIdentityTokens(req, auth.uid) : null;

    const result = await salesService.listProjects({
      limit,
      offset,
      q,
      trang_thai_chot,
      trang_thai_thu_tien,
      sale_ids,
      ky_thuat_ids,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    if (!canViewSales(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

    const id = Number(req.params.id);

    const sale_ids = auth.role === "sale" ? getIdentityTokens(req, auth.uid) : null;
    const ky_thuat_ids = auth.role === "dev" ? getIdentityTokens(req, auth.uid) : null;

    const project = await salesService.getProjectById(id, { sale_ids, ky_thuat_ids });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    if (!canEditSales(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

    const payload = { ...req.salesInput };

    // Sale can only create projects under their own sale_id.
    if (auth.role === "sale") {
      payload.sale_id = getPreferredScopeId(req, auth.uid);
    }

    const created = await salesService.createProject(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    if (!canEditSales(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

    const id = Number(req.params.id);

    const payload = { ...req.salesInput };

    if (auth.role === "sale") {
      const sale_ids = getIdentityTokens(req, auth.uid);
      const existing = await salesService.getProjectById(id, { sale_ids });
      if (!existing) return res.status(404).json({ message: "Project not found" });

      // Prevent changing ownership.
      payload.sale_id = existing.sale_id;
    }

    const updated = await salesService.updateProject(id, payload);
    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function listSalePeople(req, res, next) {
  try {
    const auth = requireUser(req);
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    if (!canViewSales(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

    const result = await pool.query(
      `
        SELECT username, name, email, role_system, status
        FROM accounts
        WHERE role_system IN ('sale', 'sales_manager', 'head_sales')
        ORDER BY name ASC, username ASC
        LIMIT 200
      `
    );

    const items = result.rows.map((row) => ({
      username: row.username ?? "",
      name: row.name ?? "",
      email: row.email ?? "",
      role_system: row.role_system ?? "",
      status: row.status ?? "",
    }));

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  listSalePeople,
};
