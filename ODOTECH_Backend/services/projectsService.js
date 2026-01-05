const projectsRepository = require("../repositories/projectsRepository");

async function listProjects({ limit, offset, q, status, scope }) {
  return projectsRepository.listProjects({ limit, offset, q, status, scope });
}

async function getProjectById(projectId) {
  return projectsRepository.getProjectById(projectId);
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

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
