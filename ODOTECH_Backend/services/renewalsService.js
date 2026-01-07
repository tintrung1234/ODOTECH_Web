const renewalsRepository = require("../repositories/renewalsRepository");

async function listRenewalItems(params) {
  return renewalsRepository.listRenewalItems(params);
}

async function upsertRenewalPackage(payload) {
  return renewalsRepository.upsertRenewalPackage(payload);
}

async function getRenewalPackageByProjectAndKind(payload) {
  return renewalsRepository.getRenewalPackageByProjectAndKind(payload);
}

async function logCredentialAccess(payload) {
  return renewalsRepository.logCredentialAccess(payload);
}

module.exports = {
  listRenewalItems,
  upsertRenewalPackage,
  getRenewalPackageByProjectAndKind,
  logCredentialAccess,
};
