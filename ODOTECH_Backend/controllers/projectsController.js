const projectsService = require("../services/projectsService");

function toInt(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalizeDate(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeNullableId(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProjectInput(body, { requireBasics }) {
  const project_code = toString(body?.project_code).trim();
  const name = toString(body?.name).trim();

  if (requireBasics) {
    if (!project_code) return { error: "project_code is required" };
    if (!name) return { error: "name is required" };
  }

  return {
    value: {
      project_code,
      project_type: toString(body?.project_type).trim(),
      name,

      client_id: normalizeNullableId(body?.client_id),
      sale_id: normalizeNullableId(body?.sale_id),
      pm_id: normalizeNullableId(body?.pm_id),

      status: toString(body?.status).trim(),
      priority: toString(body?.priority).trim(),

      budget: toNumber(body?.budget, 0),
      contract_value: toNumber(body?.contract_value, 0),
      actual_cost: toNumber(body?.actual_cost, 0),
      deposit_received: toNumber(body?.deposit_received, 0),

      payment_status: toString(body?.payment_status).trim(),
      total_hours: toNumber(body?.total_hours, 0),

      technology_stack: toString(body?.technology_stack).trim(),
      domain_url: toString(body?.domain_url).trim(),
      production_url: toString(body?.production_url).trim(),

      start_date: normalizeDate(body?.start_date),
      deadline: normalizeDate(body?.deadline),
      completed_at: toString(body?.completed_at).trim(),

      description: toString(body?.description),

      // created_at / updated_at are managed by DB
      created_at: undefined,
      updated_at: undefined,
    },
  };
}

async function listProjects(req, res, next) {
  try {
    const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), 200);
    const offset = Math.max(toInt(req.query.offset, 0), 0);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const result = await projectsService.listProjects({ limit, offset, q, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await projectsService.getProjectById(id);
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
    const normalized = normalizeProjectInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const created = await projectsService.createProject(normalized.value);
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
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const normalized = normalizeProjectInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const updated = await projectsService.updateProject(id, normalized.value);
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
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid project id" });
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
