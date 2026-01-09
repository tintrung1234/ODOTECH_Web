const virusLogsService = require("../services/virusLogsService");
const devAssignmentService = require("../services/devAssignmentService");
const notificationService = require("../services/notificationService");
const { normalizeRole } = require("../utils/authz");

/**
 * Check if user can view virus logs
 */
function canViewVirusLogs(role) {
    return ["admin", "dev", "dev_manager", "support"].includes(role);
}

/**
 * Check if user can create virus logs
 */
function canCreateVirusLogs(role) {
    return ["admin", "dev", "dev_manager"].includes(role);
}

/**
 * List virus logs
 */
async function listVirusLogs(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewVirusLogs(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { limit = 50, offset = 0, website_id = "", status = "", severity = "" } = req.query;

        const logs = await virusLogsService.listVirusLogs({
            limit: parseInt(limit),
            offset: parseInt(offset),
            website_id: website_id ? parseInt(website_id) : null,
            status,
            severity,
        });

        res.json({ logs });
    } catch (error) {
        console.error("Error listing virus logs:", error);
        res.status(500).json({ message: "Lỗi khi tải log virus" });
    }
}

/**
 * Get virus log by ID
 */
async function getVirusLogById(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewVirusLogs(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const log = await virusLogsService.getVirusLogById(id);

        if (!log) {
            return res.status(404).json({ message: "Không tìm thấy log virus" });
        }

        res.json(log);
    } catch (error) {
        console.error("Error getting virus log:", error);
        res.status(500).json({ message: "Lỗi khi tải log virus" });
    }
}

/**
 * Create virus log (auto-assigns to dev)
 */
async function createVirusLog(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canCreateVirusLogs(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        // Create virus log
        const log = await virusLogsService.createVirusLog(req.body);

        // Auto-assign to next dev in rotation
        const assignment = await devAssignmentService.assignNextDev(log.id);

        // Send notification
        await notificationService.sendSecurityAlert(log, assignment);

        res.status(201).json({ log, assignment });
    } catch (error) {
        console.error("Error creating virus log:", error);
        res.status(500).json({ message: "Lỗi khi tạo log virus" });
    }
}

/**
 * Update virus log status
 */
async function updateVirusLogStatus(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canCreateVirusLogs(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const { status, resolution_notes = "" } = req.body;

        const log = await virusLogsService.updateVirusLogStatus(id, status, resolution_notes);

        if (!log) {
            return res.status(404).json({ message: "Không tìm thấy log virus" });
        }

        res.json(log);
    } catch (error) {
        console.error("Error updating virus log:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật log virus" });
    }
}

module.exports = {
    listVirusLogs,
    getVirusLogById,
    createVirusLog,
    updateVirusLogStatus,
};
