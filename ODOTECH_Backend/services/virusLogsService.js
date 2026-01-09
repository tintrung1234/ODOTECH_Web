const virusLogsRepository = require("../repositories/virusLogsRepository");

/**
 * List virus logs
 */
async function listVirusLogs(filters) {
    return await virusLogsRepository.listVirusLogs(filters);
}

/**
 * Get virus log by ID
 */
async function getVirusLogById(id) {
    return await virusLogsRepository.getVirusLogById(id);
}

/**
 * Create virus log
 */
async function createVirusLog(data) {
    return await virusLogsRepository.createVirusLog(data);
}

/**
 * Update virus log status
 */
async function updateVirusLogStatus(id, status, resolutionNotes = "") {
    return await virusLogsRepository.updateVirusLogStatus(id, status, resolutionNotes);
}

/**
 * Get unassigned logs
 */
async function getUnassignedLogs() {
    return await virusLogsRepository.getUnassignedLogs();
}

module.exports = {
    listVirusLogs,
    getVirusLogById,
    createVirusLog,
    updateVirusLogStatus,
    getUnassignedLogs,
};
