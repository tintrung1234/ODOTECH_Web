const projectTasksRepository = require("../repositories/projectTasksRepository");

async function listTasksByProjectId(projectId) {
  return projectTasksRepository.listTasksByProjectId(projectId);
}

async function createTask(projectId, input) {
  return projectTasksRepository.createTask(projectId, input);
}

async function updateTask(projectId, taskId, patch) {
  return projectTasksRepository.updateTask(projectId, taskId, patch);
}

async function deleteTask(projectId, taskId) {
  return projectTasksRepository.deleteTask(projectId, taskId);
}

module.exports = {
  listTasksByProjectId,
  createTask,
  updateTask,
  deleteTask,
};
