const projectTasksService = require("../services/projectTasksService");
const projectsService = require("../services/projectsService");

const { requireUser, getIdentityTokens } = require("../utils/authz");

async function canViewProject(role, uid, project, identityTokens) {
  // Debug logging
  // console.log(`[canViewProject] role=${role} uid=${uid} projectId=${project?.id}`);
  if (["admin", "support", "head_sales", "head_tech"].includes(role)) return true;
  if (!project) return false;
  if (role === "sale") return Number(project.sale_id) === uid;
  if (role === "sales_manager" || role === "dev_manager") return Number(project.pm_id) === uid;
  if (role === "dev") {
    if (Number(project.tech_user_id) === uid) return true;
    try {
      return await projectTasksService.isUserMainAssigneeOfProject(Number(project.id), uid);
    } catch (e) {
      console.error("Error in isUserMainAssigneeOfProject:", e);
      return false;
    }
  }
  return false;
}

function canManageTasks(role, uid, project) {
  if (role === "support") return false;
  if (["admin", "head_sales", "head_tech"].includes(role)) return true;
  if (role === "sales_manager" || role === "dev_manager") return Number(project?.pm_id) === uid;
  return false;
}

function isTaskAssignedTo(identityTokens, task) {
  const hay = [task?.nguoiChinh, task?.nguoiPhuTrach, task?.nguoiHoTro]
    .filter(Boolean)
    .join(",")
    .toLowerCase();
  return identityTokens.some((t) => t && hay.includes(String(t).toLowerCase()));
}

function canEditTask(role, uid, project, task, identityTokens) {
  if (role === "support") return false;
  if (["admin", "head_sales", "head_tech"].includes(role)) return true;
  if (role === "sales_manager" || role === "dev_manager") return Number(project?.pm_id) === uid;
  if (role === "dev") return Boolean(task && isTaskAssignedTo(identityTokens, task));
  return false;
}

function canDeleteTask(role, uid, project) {
  if (role === "support") return false;
  if (["admin", "head_sales", "head_tech"].includes(role)) return true;
  if (role === "sales_manager" || role === "dev_manager") return Number(project?.pm_id) === uid;
  return false;
}

async function listProjectTasks(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    const identityTokens = getIdentityTokens(req, uid);

    const projectId = Number(req.params.id);
    const project = await projectsService.getProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Add try-catch block for authorization check specifically
    try {
      const authorized = await canViewProject(role, uid, project, identityTokens);
      if (!authorized) return res.status(403).json({ message: "Forbidden" });
    } catch (authErr) {
      console.error("Authorization check failed:", authErr);
      throw authErr; // Re-throw to be caught by main catch
    }

    const items = await projectTasksService.listTasksByProjectId(projectId);
    res.json({ items });
  } catch (err) {
    console.error("Error in listProjectTasks:", err);
    next(err);
  }
}

async function createProjectTask(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;

    const projectId = Number(req.params.id);
    const project = await projectsService.getProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!canManageTasks(role, uid, project)) return res.status(403).json({ message: "Forbidden" });

    const created = await projectTasksService.createTask(projectId, req.taskInput);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateProjectTask(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    const identityTokens = getIdentityTokens(req, uid);

    const projectId = Number(req.params.id);
    const taskId = Number(req.params.taskId);

    const project = await projectsService.getProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!(await canViewProject(role, uid, project, identityTokens))) return res.status(403).json({ message: "Forbidden" });

    const existingTask = await projectTasksService.getTaskById(projectId, taskId);
    if (!existingTask) return res.status(404).json({ message: "Task not found" });
    if (!canEditTask(role, uid, project, existingTask, identityTokens)) return res.status(403).json({ message: "Forbidden" });

    const updated = await projectTasksService.updateTask(projectId, taskId, req.taskPatch);
    if (!updated) return res.status(404).json({ message: "Task not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteProjectTask(req, res, next) {
  try {
    const auth = requireUser(req, { requireUid: true });
    if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
    const { role, uid } = auth;
    const identityTokens = getIdentityTokens(req, uid);

    const projectId = Number(req.params.id);
    const taskId = Number(req.params.taskId);

    const project = await projectsService.getProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!(await canViewProject(role, uid, project, identityTokens))) return res.status(403).json({ message: "Forbidden" });
    if (!canDeleteTask(role, uid, project)) return res.status(403).json({ message: "Forbidden" });

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
