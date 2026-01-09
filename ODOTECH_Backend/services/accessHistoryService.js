const accessHistoryRepository = require("../repositories/accessHistoryRepository");

/**
 * Log credential access
 */
async function logAccess(data) {
    return await accessHistoryRepository.logAccess(data);
}

/**
 * Get access history
 */
async function getAccessHistory(filters) {
    return await accessHistoryRepository.getAccessHistory(filters);
}

module.exports = {
    logAccess,
    getAccessHistory,
};
