const leaveRepository = require("../repositories/leaveRepository");

async function listLeaveRequests({ limit, offset, q, accountId, trangThai }) {
  return leaveRepository.listLeaveRequests({ limit, offset, q, accountId, trangThai });
}

async function getLeaveRequestById(leaveId) {
  return leaveRepository.getLeaveRequestById(leaveId);
}

async function createLeaveRequest(input) {
  return leaveRepository.createLeaveRequest(input);
}

async function updateLeaveRequest(leaveId, input) {
  return leaveRepository.updateLeaveRequest(leaveId, input);
}

async function deleteLeaveRequest(leaveId) {
  return leaveRepository.deleteLeaveRequest(leaveId);
}

module.exports = {
  listLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
};
