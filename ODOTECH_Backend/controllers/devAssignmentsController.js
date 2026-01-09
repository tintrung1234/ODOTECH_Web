const devAssignmentService = require("../services/devAssignmentService");
const notificationService = require("../services/notificationService");
const { normalizeRole } = require("../utils/authz");

/**
 * Check if user can view assignments
 */
function canViewAssignments(role) {
    return ["admin", "dev", "dev_manager"].includes(role);
}

/**
 * Check if user can manage rotation
 */
function canManageRotation(role) {
    return ["admin", "dev_manager"].includes(role);
}

/**
 * List assignments
 */
async function listAssignments(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewAssignments(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { limit = 50, offset = 0, dev_id = "", status = "" } = req.query;

        // Devs can only see their own assignments
        let filters = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            status,
        };

        if (role === "dev") {
            filters.dev_id = req.user.uid;
        } else if (dev_id) {
            filters.dev_id = parseInt(dev_id);
        }

        const assignments = await devAssignmentService.listAssignments(filters);

        res.json({ assignments });
    } catch (error) {
        console.error("Error listing assignments:", error);
        res.status(500).json({ message: "Lỗi khi tải danh sách phân công" });
    }
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewAssignments(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const assignment = await devAssignmentService.getAssignmentById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Không tìm thấy phân công" });
        }

        // Devs can only see their own assignments
        if (role === "dev" && assignment.assigned_dev_id !== req.user.uid) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        res.json(assignment);
    } catch (error) {
        console.error("Error getting assignment:", error);
        res.status(500).json({ message: "Lỗi khi tải phân công" });
    }
}

/**
 * Accept assignment
 */
async function acceptAssignment(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (role !== "dev") {
            return res.status(403).json({ message: "Only developers can accept assignments" });
        }

        const { id } = req.params;
        const assignment = await devAssignmentService.getAssignmentById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Không tìm thấy phân công" });
        }

        // Check if this dev is assigned
        if (assignment.assigned_dev_id !== req.user.uid) {
            return res.status(403).json({ message: "This assignment is not assigned to you" });
        }

        const updated = await devAssignmentService.acceptAssignment(id);

        res.json(updated);
    } catch (error) {
        console.error("Error accepting assignment:", error);
        res.status(500).json({ message: "Lỗi khi chấp nhận phân công" });
    }
}

/**
 * Delegate assignment
 */
async function delegateAssignment(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (role !== "dev") {
            return res.status(403).json({ message: "Only developers can delegate assignments" });
        }

        const { id } = req.params;
        const { to_dev_id, to_dev_name } = req.body;

        const assignment = await devAssignmentService.getAssignmentById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Không tìm thấy phân công" });
        }

        // Check if this dev is assigned
        if (assignment.assigned_dev_id !== req.user.uid) {
            return res.status(403).json({ message: "This assignment is not assigned to you" });
        }

        const delegated = await devAssignmentService.handleDelegation(id, req.user.uid, to_dev_id);

        // Send notification to target dev
        await notificationService.sendDelegationRequest(delegated, to_dev_name);

        res.json(delegated);
    } catch (error) {
        console.error("Error delegating assignment:", error);
        res.status(500).json({ message: "Lỗi khi ủy quyền phân công" });
    }
}

/**
 * Accept delegation
 */
async function acceptDelegation(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (role !== "dev") {
            return res.status(403).json({ message: "Only developers can accept delegations" });
        }

        const { id } = req.params;
        const assignment = await devAssignmentService.getAssignmentById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Không tìm thấy phân công" });
        }

        // Check if delegation is for this dev
        const delegationHistory = assignment.delegation_history || [];
        if (delegationHistory.length === 0) {
            return res.status(400).json({ message: "No delegation found" });
        }

        const lastDelegation = delegationHistory[delegationHistory.length - 1];
        if (lastDelegation.to_dev_id !== req.user.uid) {
            return res.status(403).json({ message: "This delegation is not for you" });
        }

        const accepted = await devAssignmentService.acceptDelegation(id, req.user.uid);

        res.json(accepted);
    } catch (error) {
        console.error("Error accepting delegation:", error);
        res.status(500).json({ message: "Lỗi khi chấp nhận ủy quyền" });
    }
}

/**
 * Complete assignment
 */
async function completeAssignment(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (role !== "dev") {
            return res.status(403).json({ message: "Only developers can complete assignments" });
        }

        const { id } = req.params;
        const { resolution_notes = "" } = req.body;

        const assignment = await devAssignmentService.getAssignmentById(id);

        if (!assignment) {
            return res.status(404).json({ message: "Không tìm thấy phân công" });
        }

        // Check if this dev is assigned
        if (assignment.assigned_dev_id !== req.user.uid) {
            return res.status(403).json({ message: "This assignment is not assigned to you" });
        }

        const completed = await devAssignmentService.completeAssignment(id, resolution_notes);

        res.json(completed);
    } catch (error) {
        console.error("Error completing assignment:", error);
        res.status(500).json({ message: "Lỗi khi hoàn thành phân công" });
    }
}

/**
 * List dev rotation
 */
async function listDevRotation(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canManageRotation(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const rotation = await devAssignmentService.listDevRotation();

        res.json({ rotation });
    } catch (error) {
        console.error("Error listing dev rotation:", error);
        res.status(500).json({ message: "Lỗi khi tải danh sách luân phiên" });
    }
}

/**
 * Add dev to rotation
 */
async function addDevToRotation(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canManageRotation(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { dev_id } = req.body;

        const rotation = await devAssignmentService.addDevToRotation(dev_id);

        res.json(rotation);
    } catch (error) {
        console.error("Error adding dev to rotation:", error);
        res.status(500).json({ message: "Lỗi khi thêm dev vào luân phiên" });
    }
}

/**
 * Remove dev from rotation
 */
async function removeDevFromRotation(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canManageRotation(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { dev_id } = req.params;

        const rotation = await devAssignmentService.removeDevFromRotation(dev_id);

        if (!rotation) {
            return res.status(404).json({ message: "Không tìm thấy dev trong luân phiên" });
        }

        res.json(rotation);
    } catch (error) {
        console.error("Error removing dev from rotation:", error);
        res.status(500).json({ message: "Lỗi khi xóa dev khỏi luân phiên" });
    }
}

module.exports = {
    listAssignments,
    getAssignmentById,
    acceptAssignment,
    delegateAssignment,
    acceptDelegation,
    completeAssignment,
    listDevRotation,
    addDevToRotation,
    removeDevFromRotation,
};
