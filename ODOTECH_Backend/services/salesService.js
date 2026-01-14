const salesRepository = require("../repositories/salesRepository");
const notificationService = require("./notificationService");

function makeSalesLabel(project) {
  const code = project?.ma_du_an ? String(project.ma_du_an).trim() : "";
  const name = project?.ten_khach ? String(project.ten_khach).trim() : "";
  if (code && name) return `${code} - ${name}`;
  return code || name || `#${project?.id ?? ""}`;
}

async function notifySalesAssignee(userId, { project, role }) {
  const label = makeSalesLabel(project);
  const roleText = role === "sale" ? "Sale" : role === "tech" ? "Kỹ thuật" : "PM";
  return notificationService.notifyUser({
    userId,
    type: "sales_assignment",
    title: "Bạn được thêm vào Sales Project",
    message: `Bạn được gán làm ${roleText} cho sales project ${label}.`,
    data: { sales_project_id: project?.id, ma_du_an: project?.ma_du_an, role },
  });
}

async function notifySalesOnCreate(project) {
  const saleId = notificationService.toNullableInt(project?.sale_id);
  if (saleId) await notifySalesAssignee(saleId, { project, role: "sale" });

  const techId = notificationService.toNullableInt(project?.ky_thuat_id);
  if (techId) await notifySalesAssignee(techId, { project, role: "tech" });

  const pmId = notificationService.toNullableInt(project?.pm_id);
  if (pmId) await notifySalesAssignee(pmId, { project, role: "pm" });
}

async function notifySalesOnUpdate(before, after) {
  if (!before || !after) return;

  const beforeSale = notificationService.toNullableInt(before?.sale_id);
  const afterSale = notificationService.toNullableInt(after?.sale_id);
  if (afterSale && afterSale !== beforeSale) await notifySalesAssignee(afterSale, { project: after, role: "sale" });

  const beforeTech = notificationService.toNullableInt(before?.ky_thuat_id);
  const afterTech = notificationService.toNullableInt(after?.ky_thuat_id);
  if (afterTech && afterTech !== beforeTech) await notifySalesAssignee(afterTech, { project: after, role: "tech" });

  const beforePm = notificationService.toNullableInt(before?.pm_id);
  const afterPm = notificationService.toNullableInt(after?.pm_id);
  if (afterPm && afterPm !== beforePm) await notifySalesAssignee(afterPm, { project: after, role: "pm" });
}

async function listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien, sale_ids, ky_thuat_ids }) {
  return salesRepository.listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien, sale_ids, ky_thuat_ids });
}

async function getProjectById(projectId, { sale_ids, ky_thuat_ids } = {}) {
  return salesRepository.getProjectById(projectId, { sale_ids, ky_thuat_ids });
}

async function createProject(input) {
  const created = await salesRepository.createProject(input);
  await notifySalesOnCreate(created);
  return created;
}

async function updateProject(projectId, input) {
  const before = await salesRepository.getProjectById(projectId);
  const updated = await salesRepository.updateProject(projectId, input);
  await notifySalesOnUpdate(before, updated);
  return updated;
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
};
