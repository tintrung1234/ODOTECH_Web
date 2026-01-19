const serversService = require("../services/serversService");
const accessHistoryService = require("../services/accessHistoryService");
const notificationService = require("../services/notificationService");
const { normalizeRole } = require("../utils/authz");

/**
 * Check if user can view servers
 */
function canViewServers(role) {
    return ["admin", "dev", "dev_manager", "head_tech", "support"].includes(role);
}

/**
 * Check if user can edit servers
 */
function canEditServers(role) {
    return ["admin", "dev_manager", "head_tech"].includes(role);
}

/**
 * Check if user can reveal passwords
 */
function canRevealPasswords(role) {
    return ["admin", "dev", "dev_manager", "head_tech"].includes(role);
}

/**
 * List servers
 */
async function listServers(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewServers(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { limit = 50, offset = 0, search = "", status = "", server_type = "", provider = "" } = req.query;

        const servers = await serversService.listServers({
            limit: parseInt(limit),
            offset: parseInt(offset),
            search,
            status,
            server_type,
            provider,
            user_role: role,
            user_id: req.user.uid,
        });

        res.json({ servers });
    } catch (error) {
        console.error("Error listing servers:", error);
        res.status(500).json({ message: "Lỗi khi tải danh sách server" });
    }
}

/**
 * Get server by ID
 */
async function getServerById(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewServers(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const server = await serversService.getServerById(id);

        if (!server) {
            return res.status(404).json({ message: "Không tìm thấy server" });
        }

        res.json(server);
    } catch (error) {
        console.error("Error getting server:", error);
        res.status(500).json({ message: "Lỗi khi tải thông tin server" });
    }
}

/**
 * Create server
 */
async function createServer(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canEditServers(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const server = await serversService.createServer(req.body);
        res.status(201).json(server);
    } catch (error) {
        console.error("Error creating server:", error);
        res.status(500).json({
            message: "Lỗi khi tạo server",
            detail: error.message,
            code: error.code
        });
    }
}

/**
 * Update server
 */
async function updateServer(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canEditServers(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const { id } = req.params;
        const server = await serversService.updateServer(id, req.body);

        if (!server) {
            return res.status(404).json({ message: "Không tìm thấy server" });
        }

        res.json(server);
    } catch (error) {
        console.error("Error updating server:", error);
        res.status(500).json({
            message: "Lỗi khi cập nhật server",
            detail: error.message,
            code: error.code
        });
    }
}

/**
 * Delete server
 */
async function deleteServer(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (role !== "admin") {
            return res.status(403).json({ message: "Only admins can delete servers" });
        }

        const { id } = req.params;
        const deleted = await serversService.deleteServer(id);

        if (!deleted) {
            return res.status(404).json({ message: "Không tìm thấy server" });
        }

        res.json({ message: "Đã xóa server thành công" });
    } catch (error) {
        console.error("Error deleting server:", error);
        res.status(500).json({ message: "Lỗi khi xóa server" });
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

        // Get server info for logging
        const server = await serversService.getServerById(id);
        if (!server) {
            return res.status(404).json({ message: "Không tìm thấy server" });
        }

        // Reveal password
        const { password } = await serversService.revealPassword(id, credential_type);

        // Log access (reuse access history for servers)
        const accessLog = await accessHistoryService.logAccess({
            user_id: req.user.uid,
            user_name: req.user.name || req.user.username || "Unknown",
            website_id: null, // No website for servers
            website_name: `Server: ${server.name}`,
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
 * Get server statistics
 */
async function getServerStats(req, res) {
    try {
        const role = normalizeRole(req.user?.role);

        if (!canViewServers(role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        const stats = await serversService.getServerStats();
        res.json(stats);
    } catch (error) {
        console.error("Error getting server stats:", error);
        res.status(500).json({ message: "Lỗi khi tải thống kê" });
    }
}

module.exports = {
    listServers,
    getServerById,
    createServer,
    updateServer,
    deleteServer,
    revealPassword,
    getServerStats,
};
