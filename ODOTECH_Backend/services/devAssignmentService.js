const devAssignmentsRepository = require("../repositories/devAssignmentsRepository");
const virusLogsRepository = require("../repositories/virusLogsRepository");

/**
 * Assign next dev in rotation to a virus log
 */
async function assignNextDev(virusLogId) {
    // Get next dev in rotation
    const nextDev = await devAssignmentsRepository.getNextDevInRotation();

    // Create assignment
    const assignment = await devAssignmentsRepository.createAssignment({
        virus_log_id: virusLogId,
        assigned_dev_id: nextDev.dev_id,
        status: "pending",
    });

    // Update virus log status
    await virusLogsRepository.updateVirusLogStatus(virusLogId, "assigned");

    return assignment;
}

/**
 * Handle delegation request
 */
async function handleDelegation(assignmentId, fromDevId, toDevId) {
    // Delegate assignment
    const assignment = await devAssignmentsRepository.delegateAssignment(
        assignmentId,
        fromDevId,
        toDevId
    );

    return assignment;
}

/**
 * Accept delegation
 */
async function acceptDelegation(assignmentId, devId) {
    const assignment = await devAssignmentsRepository.acceptDelegation(assignmentId, devId);

    // Update virus log status
    await virusLogsRepository.updateVirusLogStatus(assignment.virus_log_id, "in_progress");

    return assignment;
}

/**
 * Check and handle expired delegations
 */
async function checkExpiredDelegations() {
    const expiredAssignments = await devAssignmentsRepository.getExpiredDelegations();

    const results = [];

    for (const assignment of expiredAssignments) {
        // Mark current delegation as rejected
        const delegationHistory = assignment.delegation_history || [];
        if (delegationHistory.length > 0) {
            const lastDelegation = delegationHistory[delegationHistory.length - 1];
            lastDelegation.responded_at = new Date().toISOString();
            lastDelegation.accepted = false;
        }

        // Assign to next dev in rotation
        const nextDev = await devAssignmentsRepository.getNextDevInRotation();

        // Update assignment
        await devAssignmentsRepository.updateAssignmentStatus(
            assignment.id,
            "pending",
            "Delegation expired, reassigned to next dev"
        );

        // Create new assignment for next dev
        const newAssignment = await devAssignmentsRepository.createAssignment({
            virus_log_id: assignment.virus_log_id,
            assigned_dev_id: nextDev.dev_id,
            status: "pending",
        });

        results.push(newAssignment);
    }

    return results;
}

/**
 * Accept assignment
 */
async function acceptAssignment(assignmentId) {
    const assignment = await devAssignmentsRepository.updateAssignmentStatus(
        assignmentId,
        "accepted"
    );

    // Update virus log status
    await virusLogsRepository.updateVirusLogStatus(assignment.virus_log_id, "in_progress");

    return assignment;
}

/**
 * Start working on assignment
 */
async function startAssignment(assignmentId) {
    return await devAssignmentsRepository.updateAssignmentStatus(
        assignmentId,
        "in_progress"
    );
}

/**
 * Complete assignment
 */
async function completeAssignment(assignmentId, resolutionNotes) {
    const assignment = await devAssignmentsRepository.updateAssignmentStatus(
        assignmentId,
        "completed",
        resolutionNotes
    );

    // Update virus log status
    await virusLogsRepository.updateVirusLogStatus(
        assignment.virus_log_id,
        "resolved",
        resolutionNotes
    );

    return assignment;
}

/**
 * List assignments
 */
async function listAssignments(filters) {
    return await devAssignmentsRepository.listAssignments(filters);
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(id) {
    return await devAssignmentsRepository.getAssignmentById(id);
}

/**
 * Manage dev rotation
 */
async function listDevRotation() {
    return await devAssignmentsRepository.listDevRotation();
}

async function addDevToRotation(devId) {
    return await devAssignmentsRepository.addDevToRotation(devId);
}

async function removeDevFromRotation(devId) {
    return await devAssignmentsRepository.removeDevFromRotation(devId);
}

module.exports = {
    assignNextDev,
    handleDelegation,
    acceptDelegation,
    checkExpiredDelegations,
    acceptAssignment,
    startAssignment,
    completeAssignment,
    listAssignments,
    getAssignmentById,
    listDevRotation,
    addDevToRotation,
    removeDevFromRotation,
};
