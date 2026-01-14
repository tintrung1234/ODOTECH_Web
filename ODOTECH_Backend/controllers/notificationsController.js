const notificationService = require("../services/notificationService");
const { requireUser } = require("../utils/authz");

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

module.exports = {
    listNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
