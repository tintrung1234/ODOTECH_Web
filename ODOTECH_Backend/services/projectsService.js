const projectsRepository = require("../repositories/projectsRepository");

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
  return projectsRepository.createProject(input);
}

async function updateProject(projectId, input) {
  return projectsRepository.updateProject(projectId, input);
}

async function deleteProject(projectId) {
  return projectsRepository.deleteProject(projectId);
}

async function getContractValuesByCodes({ codes, scope }) {
  return projectsRepository.getContractValuesByCodes({ codes, scope });
}

async function updateActualCostByCode(projectCode, actualCost) {
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
