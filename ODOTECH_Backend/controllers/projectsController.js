const projectsService = require("../services/projectsService");

const { requireUser, getIdentityTokens } = require("../utils/authz");

function canViewProjects(role) {
  return ["admin", "support", "head_sales", "head_tech", "sales_manager", "dev_manager", "sale", "dev"].includes(role);
}

function canCreateProject(role) {
  // Keep in sync with frontend.
  return ["admin", "head_sales", "head_tech", "sales_manager", "dev_manager"].includes(role);
}

function canEditProject(role, uid, project) {
  if (role === "support") return false;
  if (["admin", "head_sales", "head_tech"].includes(role)) return true;
  if (["sales_manager", "dev_manager"].includes(role)) return Number(project?.pm_id) === uid;
  if (role === "sale") return Number(project?.sale_id) === uid;
  return false;
}

function canDeleteProject(role) {
  if (role === "support") return false;
  return ["admin", "head_sales", "head_tech"].includes(role);
}

async function listProjects(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    if (!canViewProjects(role)) return res.status(403).json({ message: "Forbidden" });

    const { limit = 50, offset = 0, q = "", status = "" } = req.listQuery || {};

    let scope = null;
    if (role === "sale") scope = { saleId: uid };
    else if (role === "sales_manager" || role === "dev_manager") scope = { pmId: uid };
    else if (role === "dev") scope = { memberTokens: getIdentityTokens(req, uid) };

    const result = await projectsService.listProjects({ limit, offset, q, status, scope });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    if (!canViewProjects(role)) return res.status(403).json({ message: "Forbidden" });

    const id = Number(req.params.id);

    const project = await projectsService.getProjectById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (["admin", "support", "head_sales", "head_tech"].includes(role)) {
      return res.json(project);
    }
    if (role === "sale" && Number(project.sale_id) !== uid) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if ((role === "sales_manager" || role === "dev_manager") && Number(project.pm_id) !== uid) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (role === "dev") {
      const tokens = getIdentityTokens(req, uid).map((t) => t.toLowerCase());
      const hay = `${project.tech_user || ""},${project.assignee || ""}`.toLowerCase();
      if (!tokens.some((t) => t && hay.includes(t))) return res.status(403).json({ message: "Forbidden" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const auth = requireUser(req);
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role } = auth;
    if (!canCreateProject(role)) return res.status(403).json({ message: "Forbidden" });

    const created = await projectsService.createProject(req.projectInput);
    res.status(201).json(created);
  } catch (err) {
    // Handle unique conflict on project_code
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "project_code already exists" });
    }
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    if (role === "support") return res.status(403).json({ message: "Forbidden" });

    const id = Number(req.params.id);

    const existing = await projectsService.getProjectById(id);
    if (!existing) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (!canEditProject(role, uid, existing)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await projectsService.updateProject(id, req.projectInput);
    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(updated);
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "project_code already exists" });
    }
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    if (!canDeleteProject(role)) return res.status(403).json({ message: "Forbidden" });

    const id = Number(req.params.id);

    const existing = await projectsService.getProjectById(id);
    if (!existing) {
      return res.status(404).json({ message: "Project not found" });
    }
    // Extra safety: even for head roles we can delete; for managers we currently don't allow at all.
    if (!canEditProject(role, uid, existing)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const ok = await projectsService.deleteProject(id);
    if (!ok) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
