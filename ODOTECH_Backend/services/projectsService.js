const projectsRepository = require("../repositories/projectsRepository");
const notificationService = require("./notificationService");

function pickProjectLabel(project) {
  const code = project?.project_code ? String(project.project_code).trim() : "";
  const name = project?.name ? String(project.name).trim() : "";
  if (code && name) return `${code} - ${name}`;
  return code || name || `#${project?.id ?? ""}`;
}

async function notifyProjectAssigneesOnCreate(project) {
  const label = pickProjectLabel(project);
  const data = { project_id: project?.id, project_code: project?.project_code };

  const saleId = notificationService.toNullableInt(project?.sale_id);
  if (saleId) {
    await notificationService.notifyUser({
      userId: saleId,
      type: "project_assignment",
      title: "Bạn được thêm vào dự án (Sale)",
      message: `Bạn được gán làm Sale cho dự án ${label}.`,
      data: { ...data, role: "sale" },
    });
  }

  const pmId = notificationService.toNullableInt(project?.pm_id);
  if (pmId) {
    await notificationService.notifyUser({
      userId: pmId,
      type: "project_assignment",
      title: "Bạn được thêm vào dự án (PM)",
      message: `Bạn được gán làm PM cho dự án ${label}.`,
      data: { ...data, role: "pm" },
    });
  }

  const techUserId = notificationService.toNullableInt(project?.tech_user_id);
  if (techUserId) {
    await notificationService.notifyUser({
      userId: techUserId,
      type: "project_assignment",
      title: "Bạn được thêm vào dự án (Kỹ thuật)",
      message: `Bạn được gán phụ trách kỹ thuật cho dự án ${label}.`,
      data: { ...data, role: "tech" },
    });
  }
}

async function notifyProjectAssigneesOnUpdate(before, after) {
  if (!after) return;
  const label = pickProjectLabel(after);
  const data = { project_id: after?.id, project_code: after?.project_code };

  const beforeSale = notificationService.toNullableInt(before?.sale_id);
  const afterSale = notificationService.toNullableInt(after?.sale_id);
  if (afterSale && afterSale !== beforeSale) {
    await notificationService.notifyUser({
      userId: afterSale,
      type: "project_assignment",
      title: "Bạn được thêm vào dự án (Sale)",
      message: `Bạn vừa được gán làm Sale cho dự án ${label}.`,
      data: { ...data, role: "sale" },
    });
  }

  const beforePm = notificationService.toNullableInt(before?.pm_id);
  const afterPm = notificationService.toNullableInt(after?.pm_id);
  if (afterPm && afterPm !== beforePm) {
    await notificationService.notifyUser({
      userId: afterPm,
      type: "project_assignment",
      title: "Bạn được thêm vào dự án (PM)",
      message: `Bạn vừa được gán làm PM cho dự án ${label}.`,
      data: { ...data, role: "pm" },
    });
  }

  const beforeTech = notificationService.toNullableInt(before?.tech_user_id);
  const afterTech = notificationService.toNullableInt(after?.tech_user_id);
  if (afterTech && afterTech !== beforeTech) {
    await notificationService.notifyUser({
      userId: afterTech,
      type: "project_assignment",
      title: "Bạn được thêm vào dự án (Kỹ thuật)",
      message: `Bạn vừa được gán phụ trách kỹ thuật cho dự án ${label}.`,
      data: { ...data, role: "tech" },
    });
  }
}

async function listProjects({ limit, offset, q, status, scope }) {
  return projectsRepository.listProjects({ limit, offset, q, status, scope });
}

async function getProjectById(projectId) {
  return projectsRepository.getProjectById(projectId);
}

async function getProjectByCode(projectCode) {
  return projectsRepository.getProjectByCode(projectCode);
}

async function createProject(input) {
  const created = await projectsRepository.createProject(input);
  // Fire-and-forget is acceptable here, but await keeps behavior deterministic.
  await notifyProjectAssigneesOnCreate(created);
  return created;
}

async function updateProject(projectId, input) {
  const before = await projectsRepository.getProjectById(projectId);
  const updated = await projectsRepository.updateProject(projectId, input);
  await notifyProjectAssigneesOnUpdate(before, updated);
  return updated;
}

async function deleteProject(projectId) {
  return projectsRepository.deleteProject(projectId);
}

async function getContractValuesByCodes({ codes, scope }) {
  return projectsRepository.getContractValuesByCodes({ codes, scope });
}

async function updateActualCostByCode(projectCode, actualCost) {
  console.log(projectCode, actualCost);
  return projectsRepository.updateActualCostByCode(projectCode, actualCost);
}

async function updateDepositReceivedByCode(projectCode, depositReceived) {
  return projectsRepository.updateDepositReceivedByCode(projectCode, depositReceived);
}

module.exports = {
  listProjects,
  getProjectById,
  getProjectByCode,
  createProject,
  updateProject,
  deleteProject,
  getContractValuesByCodes,
  updateActualCostByCode,
  updateDepositReceivedByCode,
};
