const websitesService = require("../services/websitesService");
const accessHistoryService = require("../services/accessHistoryService");
const notificationService = require("../services/notificationService");
const { normalizeRole } = require("../utils/authz");

/**
 * Check if user can view websites
 */
function canViewWebsites(role) {
    return ["admin", "dev", "dev_manager", "support"].includes(role);
}

/**
 * Check if user can edit websites
 */
function canEditWebsites(role) {
    return ["admin", "dev", "dev_manager"].includes(role);
}

/**
 * Check if user can reveal passwords
 */
function canRevealPasswords(role) {
    return ["admin", "dev", "dev_manager"].includes(role);
}

/**
 * List websites
 */
async function listWebsites(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { limit = 50, offset = 0, search = "", status = "", sale_manager_id = "" } = req.query;

        const websites = await websitesService.listWebsites({
            limit: parseInt(limit),
            offset: parseInt(offset),
            search,
            status,
            sale_manager_id: sale_manager_id || null,
            user_role: role,
            user_id: req.user.uid,
        });

        res.json({ websites });
    } catch (error) {
        console.error("Error listing websites:", error);
        res.status(500).json({ message: "Lỗi khi tải danh sách website" });
    }
}

/**
 * Get website by ID
 */
async function getWebsiteById(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const website = await websitesService.getWebsiteById(id);

        if (!website) {
            return res.status(404).json({ message: "Không tìm thấy website" });
        }

        res.json(website);
    } catch (error) {
        console.error("Error getting website:", error);
        res.status(500).json({ message: "Lỗi khi tải thông tin website" });
    }
}

/**
 * Create website
 */
async function createWebsite(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canEditWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const website = await websitesService.createWebsite(req.body);
        res.status(201).json(website);
    } catch (error) {
        console.error("Error creating website:", error);
        res.status(500).json({
            message: "Lỗi khi tạo website",
            detail: error.message,
            code: error.code
        });
    }
}

/**
 * Update website
 */
async function updateWebsite(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canEditWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const website = await websitesService.updateWebsite(id, req.body);

        if (!website) {
            return res.status(404).json({ message: "Không tìm thấy website" });
        }

        res.json(website);
    } catch (error) {
        console.error("Error updating website:", error);
        res.status(500).json({
            message: "Lỗi khi cập nhật website",
            detail: error.message,
            code: error.code
        });
    }
}

/**
 * Delete website
 */
async function deleteWebsite(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (role !== "admin") {
            return res.status(403).json({ message: "Only admins can delete websites" });
        }

        const { id } = req.params;
        const deleted = await websitesService.deleteWebsite(id);

        if (!deleted) {
            return res.status(404).json({ message: "Không tìm thấy website" });
        }

        res.json({ message: "Đã xóa website thành công" });
    } catch (error) {
        console.error("Error deleting website:", error);
        res.status(500).json({ message: "Lỗi khi xóa website" });
    }
}

/**
 * Reveal password
 */
async function revealPassword(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canRevealPasswords(role)) {
            return res.status(403).json({ message: "Insufficient permissions to reveal passwords" });
        }

        const { id } = req.params;
        const { credential_type } = req.body;

        // Get website info for logging
        const website = await websitesService.getWebsiteById(id);
        if (!website) {
            return res.status(404).json({ message: "Không tìm thấy website" });
        }

        // Reveal password
        const { password } = await websitesService.revealPassword(id, credential_type);

        // Log access
        const accessLog = await accessHistoryService.logAccess({
            user_id: req.user.uid,
            user_name: req.user.name || req.user.username || "Unknown",
            website_id: id,
            website_name: website.name,
            credential_type,
            ip_address: req.ip || req.connection.remoteAddress || "",
            user_agent: req.get("user-agent") || "",
        });

        // Send notification
        await notificationService.sendPasswordAccessAlert(accessLog);

        res.json({ password });
    } catch (error) {
        console.error("Error revealing password:", error);
        res.status(500).json({ message: "Lỗi khi lấy mật khẩu" });
    }
}

/**
 * Get website statistics
 */
async function getWebsiteStats(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const stats = await websitesService.getWebsiteStats();
        res.json(stats);
    } catch (error) {
        console.error("Error getting website stats:", error);
        res.status(500).json({ message: "Lỗi khi tải thống kê" });
    }
}

/**
 * Get storage alerts
 */
async function getStorageAlerts(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const alerts = await websitesService.getStorageAlerts();
        res.json({ alerts });
    } catch (error) {
        console.error("Error getting storage alerts:", error);
        res.status(500).json({ message: "Lỗi khi tải cảnh báo dung lượng" });
    }
}

/**
 * Get access history
 */
async function getAccessHistory(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewWebsites(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { website_id, user_id, limit = 50, offset = 0 } = req.query;

        const history = await accessHistoryService.getAccessHistory({
            website_id: website_id ? parseInt(website_id) : null,
            user_id: user_id ? parseInt(user_id) : null,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.json({ history });
    } catch (error) {
        console.error("Error getting access history:", error);
        res.status(500).json({ message: "Lỗi khi tải lịch sử truy cập" });
    }
}

module.exports = {
    listWebsites,
    getWebsiteById,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    revealPassword,
    getWebsiteStats,
    getStorageAlerts,
    getAccessHistory,
};
