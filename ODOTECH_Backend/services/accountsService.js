const accountsRepository = require("../repositories/accountsRepository");

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
  return accountsRepository.updateAccount(accountId, input);
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
