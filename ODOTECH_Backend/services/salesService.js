const salesRepository = require("../repositories/salesRepository");

async function listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien, sale_id }) {
  return salesRepository.listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien, sale_id });
}

async function getProjectById(projectId, { sale_id } = {}) {
  return salesRepository.getProjectById(projectId, { sale_id });
}

async function createProject(input) {
  return salesRepository.createProject(input);
}

async function updateProject(projectId, input) {
  return salesRepository.updateProject(projectId, input);
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
};
