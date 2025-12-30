const projectTasksService = require("../services/projectTasksService");

function toInt(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
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

const ALLOWED_STATUSES = new Set(["Chưa làm", "Đang làm", "Đã xong"]);

function normalizeTaskInput(body, { requireTitle }) {
  const tieuDe = toString(body?.tieuDe).trim();
  const nguoiPhuTrach = toString(body?.nguoiPhuTrach).trim();
  const hanChot = normalizeDate(body?.hanChot);
  const trangThai = toString(body?.trangThai, "Chưa làm").trim() || "Chưa làm";
  const ghiChu = toString(body?.ghiChu).trim();

  if (requireTitle && !tieuDe) return { error: "tieuDe is required" };
  if (trangThai && !ALLOWED_STATUSES.has(trangThai)) {
    return { error: "Invalid trangThai" };
  }

  return {
    value: {
      tieuDe,
      nguoiPhuTrach,
      hanChot,
      trangThai: trangThai || "Chưa làm",
      ghiChu,
    },
  };
}

async function listProjectTasks(req, res, next) {
  try {
    const projectId = toInt(req.params.id, NaN);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const items = await projectTasksService.listTasksByProjectId(projectId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function createProjectTask(req, res, next) {
  try {
    const projectId = toInt(req.params.id, NaN);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const normalized = normalizeTaskInput(req.body, { requireTitle: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const created = await projectTasksService.createTask(projectId, normalized.value);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateProjectTask(req, res, next) {
  try {
    const projectId = toInt(req.params.id, NaN);
    const taskId = toInt(req.params.taskId, NaN);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    if (!Number.isFinite(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const normalized = normalizeTaskInput(req.body, { requireTitle: false });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    // Keep PATCH semantics: only pass provided fields.
    const patch = {};
    if (req.body?.tieuDe !== undefined) patch.tieuDe = normalized.value.tieuDe;
    if (req.body?.nguoiPhuTrach !== undefined) patch.nguoiPhuTrach = normalized.value.nguoiPhuTrach;
    if (req.body?.hanChot !== undefined) patch.hanChot = normalized.value.hanChot;
    if (req.body?.trangThai !== undefined) patch.trangThai = normalized.value.trangThai;
    if (req.body?.ghiChu !== undefined) patch.ghiChu = normalized.value.ghiChu;

    const updated = await projectTasksService.updateTask(projectId, taskId, patch);
    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteProjectTask(req, res, next) {
  try {
    const projectId = toInt(req.params.id, NaN);
    const taskId = toInt(req.params.taskId, NaN);
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: "Invalid project id" });
    }
    if (!Number.isFinite(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const ok = await projectTasksService.deleteTask(projectId, taskId);
    if (!ok) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
};
