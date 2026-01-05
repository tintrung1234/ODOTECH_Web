const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const {
  validate,
  paramInt,
  queryIntOptional,
  queryStringOptional,
  bodyRequiredString,
  bodyIntOrNullOptional,
  bodyNumberOptional,
  bodyInOptional,
} = require("../middlewares/validate");

const {
  toInt,
  normalizeProjectInput,
  normalizeTaskInput,
  ALLOWED_TASK_STATUSES,
} = require("../utils/projectsInput");

const {
  listProjects,
  getContractValuesByCodes,
  updateActualCostByCode,
  updateDepositReceivedByCode,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectsController");

const {
  listProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
} = require("../controllers/projectTasksController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "projects" });
});

router.use(authMiddleware);

function parseProjectsListQuery(req, res, next) {
  req.listQuery = {
    limit: Math.min(Math.max(toInt(req.query.limit, 50), 1), 200),
    offset: Math.max(toInt(req.query.offset, 0), 0),
    q: typeof req.query.q === "string" ? req.query.q.trim() : "",
    status: typeof req.query.status === "string" ? req.query.status.trim() : "",
  };
  next();
}

function parseProjectCodesQuery(req, res, next) {
  const raw = typeof req.query.codes === 'string' ? req.query.codes : '';
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);
  req.codesQuery = items;
  next();
}

function parseProjectInput(req, res, next) {
  const normalized = normalizeProjectInput(req.body, { requireBasics: true });
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  req.projectInput = normalized.value;
  next();
}

function parseTaskCreateInput(req, res, next) {
  const normalized = normalizeTaskInput(req.body, { requireTitle: true });
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  req.taskInput = normalized.value;
  next();
}

function parseTaskPatch(req, res, next) {
  const normalized = normalizeTaskInput(req.body, { requireTitle: false });
  if (normalized.error) return res.status(400).json({ message: normalized.error });

  const patch = {};
  if (req.body?.tieuDe !== undefined) patch.tieuDe = normalized.value.tieuDe;
  if (req.body?.nguoiPhuTrach !== undefined) patch.nguoiPhuTrach = normalized.value.nguoiPhuTrach;
  if (req.body?.nguoiChinh !== undefined) patch.nguoiChinh = normalized.value.nguoiChinh;
  if (req.body?.nguoiHoTro !== undefined) patch.nguoiHoTro = normalized.value.nguoiHoTro;
  if (req.body?.batDau !== undefined) patch.batDau = normalized.value.batDau;
  if (req.body?.hanChot !== undefined) patch.hanChot = normalized.value.hanChot;
  if (req.body?.trangThai !== undefined) patch.trangThai = normalized.value.trangThai;
  if (req.body?.tienDo !== undefined) patch.tienDo = normalized.value.tienDo;
  if (req.body?.gioCong !== undefined) patch.gioCong = normalized.value.gioCong;
  if (req.body?.mucUuTien !== undefined) patch.mucUuTien = normalized.value.mucUuTien;
  if (req.body?.ghiChu !== undefined) patch.ghiChu = normalized.value.ghiChu;

  req.taskPatch = patch;
  next();
}

router.get(
  "/",
  validate([
    queryIntOptional("limit", { min: 1, max: 200, message: "Invalid limit" }),
    queryIntOptional("offset", { min: 0, message: "Invalid offset" }),
    queryStringOptional("q", { maxLen: 500, message: "Invalid q" }),
    queryStringOptional("status", { maxLen: 100, message: "Invalid status" }),
  ]),
  parseProjectsListQuery,
  listProjects
);

router.get(
  "/contract-values",
  validate([
    queryStringOptional("codes", { maxLen: 5000, message: "Invalid codes" }),
  ]),
  parseProjectCodesQuery,
  getContractValuesByCodes
);

router.patch(
  "/actual-cost",
  validate([
    bodyRequiredString("project_code"),
    bodyNumberOptional("actual_cost", { min: 0, message: "Invalid actual_cost" }),
  ]),
  updateActualCostByCode
);

router.patch(
  "/deposit-received",
  validate([
    bodyRequiredString("project_code"),
    bodyNumberOptional("deposit_received", { min: 0, message: "Invalid deposit_received" }),
  ]),
  updateDepositReceivedByCode
);

router.post(
  "/",
  validate([
    bodyRequiredString("project_code"),
    bodyRequiredString("name"),
    bodyIntOrNullOptional("client_id"),
    bodyIntOrNullOptional("sale_id"),
    bodyIntOrNullOptional("pm_id"),
    bodyNumberOptional("budget", { min: 0 }),
    bodyNumberOptional("contract_value", { min: 0 }),
    bodyNumberOptional("actual_cost", { min: 0 }),
    bodyNumberOptional("deposit_received", { min: 0 }),
    bodyNumberOptional("total_hours", { min: 0 }),
    bodyNumberOptional("progress_percent", { min: 0, max: 100 }),
  ]),
  parseProjectInput,
  createProject
);

router.get("/:id/tasks", validate([paramInt("id", "Invalid project id")]), listProjectTasks);

router.post(
  "/:id/tasks",
  validate([
    paramInt("id", "Invalid project id"),
    bodyRequiredString("tieuDe"),
    bodyInOptional("trangThai", ALLOWED_TASK_STATUSES, { message: "Invalid trangThai" }),
    bodyNumberOptional("tienDo", { min: 0, max: 100, message: "Invalid tienDo" }),
    bodyNumberOptional("gioCong", { min: 0, message: "Invalid gioCong" }),
  ]),
  parseTaskCreateInput,
  createProjectTask
);

router.patch(
  "/:id/tasks/:taskId",
  validate([
    paramInt("id", "Invalid project id"),
    paramInt("taskId", "Invalid task id"),
    bodyInOptional("trangThai", ALLOWED_TASK_STATUSES, { message: "Invalid trangThai" }),
    bodyNumberOptional("tienDo", { min: 0, max: 100, message: "Invalid tienDo" }),
    bodyNumberOptional("gioCong", { min: 0, message: "Invalid gioCong" }),
  ]),
  parseTaskPatch,
  updateProjectTask
);

router.delete(
  "/:id/tasks/:taskId",
  validate([paramInt("id", "Invalid project id"), paramInt("taskId", "Invalid task id")]),
  deleteProjectTask
);

router.get("/:id", validate([paramInt("id", "Invalid project id")]), getProjectById);

router.put(
  "/:id",
  validate([
    paramInt("id", "Invalid project id"),
    bodyRequiredString("project_code"),
    bodyRequiredString("name"),
    bodyIntOrNullOptional("client_id"),
    bodyIntOrNullOptional("sale_id"),
    bodyIntOrNullOptional("pm_id"),
    bodyNumberOptional("budget", { min: 0 }),
    bodyNumberOptional("contract_value", { min: 0 }),
    bodyNumberOptional("actual_cost", { min: 0 }),
    bodyNumberOptional("deposit_received", { min: 0 }),
    bodyNumberOptional("total_hours", { min: 0 }),
    bodyNumberOptional("progress_percent", { min: 0, max: 100 }),
  ]),
  parseProjectInput,
  updateProject
);

router.delete("/:id", validate([paramInt("id", "Invalid project id")]), deleteProject);

module.exports = router;
