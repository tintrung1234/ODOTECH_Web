const notificationService = require("../services/notificationService");
const { requireUser } = require("../utils/authz");

function canCreateBroadcast(role) {
    return ["admin", "head_sales", "head_tech"].includes(role);
}

function canCreateTargeted(role) {
    // Managers can send to selected users; support is read-only
    return ["admin", "head_sales", "head_tech", "sales_manager", "dev_manager"].includes(role);
}

async function listNotifications(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { uid } = auth;

        const { limit = 20, offset = 0, is_read } = req.query;

        // Parse is_read to boolean if present
        let isReadFilter;
        if (is_read === 'true') isReadFilter = true;
        if (is_read === 'false') isReadFilter = false;

        const notifications = await notificationService.listNotifications({
            userId: uid,
            limit: Number(limit),
            offset: Number(offset),
            isRead: isReadFilter
        });

        res.json(notifications);
    } catch (err) {
        next(err);
    }
}

async function markAsRead(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { uid } = auth;
        const { id } = req.params;

        const result = await notificationService.markAsRead(id, uid);

        if (!result) {
            return res.status(404).json({ message: "Notification not found or access denied" });
        }

        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function markAllAsRead(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { uid } = auth;

        await notificationService.markAllAsRead(uid);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

async function getUnreadCount(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { uid } = auth;

        const count = await notificationService.countUnread(uid);
        res.json({ count });
    } catch (err) {
        next(err);
    }
}

async function createCompanyNotification(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { role, uid } = auth;

        if (!canCreateBroadcast(role)) return res.status(403).json({ message: "Forbidden" });

        const type = String(req.body?.type || "company").trim() || "company";
        const title = String(req.body?.title || "").trim();
        const message = String(req.body?.message || "").trim();
        const data = req.body?.data || {};

        if (!title) return res.status(400).json({ message: "title is required" });
        if (!message) return res.status(400).json({ message: "message is required" });

        const created = await notificationService.notifyCompany({
            type,
            title,
            message,
            data: { ...data, created_by: uid, kind: "company" },
            excludeRoleSystems: req.body?.excludeRoleSystems,
            includeRoleSystems: req.body?.includeRoleSystems,
        });

        res.status(201).json({ inserted: created.length });
    } catch (err) {
        next(err);
    }
}

async function createRoleNotification(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { role, uid } = auth;

        if (!canCreateBroadcast(role)) return res.status(403).json({ message: "Forbidden" });

        const roleSystems = Array.isArray(req.body?.roleSystems) ? req.body.roleSystems : [];
        const type = String(req.body?.type || "management").trim() || "management";
        const title = String(req.body?.title || "").trim();
        const message = String(req.body?.message || "").trim();
        const data = req.body?.data || {};

        if (roleSystems.length === 0) return res.status(400).json({ message: "roleSystems is required" });
        if (!title) return res.status(400).json({ message: "title is required" });
        if (!message) return res.status(400).json({ message: "message is required" });

        const created = await notificationService.notifyRoles({
            roleSystems,
            type,
            title,
            message,
            data: { ...data, created_by: uid, kind: "role" },
            onlyActive: true,
        });

        res.status(201).json({ inserted: created.length });
    } catch (err) {
        next(err);
    }
}

async function createUserNotification(req, res, next) {
    try {
        const auth = requireUser(req, { requireUid: true });
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        const { role, uid } = auth;

        if (!canCreateTargeted(role)) return res.status(403).json({ message: "Forbidden" });

        const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
        const type = String(req.body?.type || "direct").trim() || "direct";
        const title = String(req.body?.title || "").trim();
        const message = String(req.body?.message || "").trim();
        const data = req.body?.data || {};

        if (userIds.length === 0) return res.status(400).json({ message: "userIds is required" });
        if (!title) return res.status(400).json({ message: "title is required" });
        if (!message) return res.status(400).json({ message: "message is required" });

        const created = await notificationService.notifyUsers({
            userIds,
            type,
            title,
            message,
            data: { ...data, created_by: uid, kind: "direct" },
        });

        res.status(201).json({ inserted: created.length });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    createCompanyNotification,
    createRoleNotification,
    createUserNotification
};
