const projectTasksRepository = require("../repositories/projectTasksRepository");
const notificationService = require("./notificationService");

function makeTaskLabel(task) {
  const title = task?.tieuDe ? String(task.tieuDe).trim() : "";
  return title || `#${task?.id ?? ""}`;
}

async function notifyTaskAssignee(userId, { projectId, task, role }) {
  const label = makeTaskLabel(task);
  const roleText = role === "main" ? "Người chính" : role === "owner" ? "Người phụ trách" : "Hỗ trợ";
  return notificationService.notifyUser({
    userId,
    type: "task_assignment",
    title: "Bạn được thêm vào task",
    message: `Bạn được gán vào task ${label} (${roleText}).`,
    data: { project_id: projectId, task_id: task?.id, role },
  });
}

async function listTasksByProjectId(projectId) {
  return projectTasksRepository.listTasksByProjectId(projectId);
}

async function getTaskById(projectId, taskId) {
  return projectTasksRepository.getTaskById(projectId, taskId);
}

async function createTask(projectId, input) {
  const created = await projectTasksRepository.createTask(projectId, input);

  const targets = [
    { id: created?.nguoiChinh, role: "main" },
    { id: created?.nguoiPhuTrach, role: "owner" },
    { id: created?.nguoiHoTro, role: "support" },
  ];

  for (const t of targets) {
    const uid = notificationService.toNullableInt(t.id);
    if (uid) await notifyTaskAssignee(uid, { projectId, task: created, role: t.role });
  }

  return created;
}

async function updateTask(projectId, taskId, patch) {
  const before = await projectTasksRepository.getTaskById(projectId, taskId);
  const updated = await projectTasksRepository.updateTask(projectId, taskId, patch);

  if (before && updated) {
    const beforeMain = notificationService.toNullableInt(before.nguoiChinh);
    const afterMain = notificationService.toNullableInt(updated.nguoiChinh);
    if (afterMain && afterMain !== beforeMain) {
      await notifyTaskAssignee(afterMain, { projectId, task: updated, role: "main" });
    }

    const beforeOwner = notificationService.toNullableInt(before.nguoiPhuTrach);
    const afterOwner = notificationService.toNullableInt(updated.nguoiPhuTrach);
    if (afterOwner && afterOwner !== beforeOwner) {
      await notifyTaskAssignee(afterOwner, { projectId, task: updated, role: "owner" });
    }

    const beforeSupport = notificationService.toNullableInt(before.nguoiHoTro);
    const afterSupport = notificationService.toNullableInt(updated.nguoiHoTro);
    if (afterSupport && afterSupport !== beforeSupport) {
      await notifyTaskAssignee(afterSupport, { projectId, task: updated, role: "support" });
    }
  }

  return updated;
}

async function deleteTask(projectId, taskId) {
  return projectTasksRepository.deleteTask(projectId, taskId);
}

async function isUserMainAssigneeOfProject(projectId, accountId) {
  return projectTasksRepository.isUserMainAssigneeOfProject(projectId, accountId);
}

module.exports = {
  listTasksByProjectId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  isUserMainAssigneeOfProject,
};
