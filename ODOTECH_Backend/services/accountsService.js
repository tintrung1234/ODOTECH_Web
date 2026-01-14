const accountsRepository = require("../repositories/accountsRepository");
const notificationService = require("./notificationService");

async function listAccounts({ limit, offset, q, status, role_system }) {
  return accountsRepository.listAccounts({ limit, offset, q, status, role_system });
}

async function getAccountById(accountId) {
  return accountsRepository.getAccountById(accountId);
}

async function createAccount(input) {
  return accountsRepository.createAccount(input);
}

async function updateAccount(accountId, input) {
  const before = await accountsRepository.getAccountById(accountId);
  const updated = await accountsRepository.updateAccount(accountId, input);

  if (updated) {
    const beforeSalary = before?.salary === null || before?.salary === undefined ? null : Number(before.salary);
    const afterSalary = updated?.salary === null || updated?.salary === undefined ? null : Number(updated.salary);

    if (Number.isFinite(afterSalary) && beforeSalary !== afterSalary) {
      await notificationService.notifyUser({
        userId: accountId,
        type: "salary",
        title: "Lương của bạn vừa được cập nhật",
        message: "Thông tin lương của bạn vừa được cập nhật. Vui lòng kiểm tra lại.",
        data: { account_id: accountId },
      });
    }
  }

  return updated;
}

async function updateAccountEmail(accountId, email) {
  return accountsRepository.updateAccountEmail(accountId, email);
}

async function deleteAccount(accountId) {
  return accountsRepository.deleteAccount(accountId);
}

async function getAccountStats() {
  return accountsRepository.getAccountStats();
}

module.exports = {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  updateAccountEmail,
  deleteAccount,
  getAccountStats,
};
