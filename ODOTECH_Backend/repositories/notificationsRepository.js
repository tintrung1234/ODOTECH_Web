const { pool } = require("../config/postgres");
const { mapNotificationRow } = require("../models/notification");

function normalizeRoleKey(role) {
    return String(role ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
}


/**
 * Create a new notification
 * @param {Object} param0 
 * @param {string|number} param0.userId
 * @param {string} param0.type
 * @param {string} param0.title
 * @param {string} param0.message
 * @param {Object} [param0.data]
 */
async function createNotification({ userId, type, title, message, data = {} }) {
    const result = await pool.query(
        `
    INSERT INTO notifications (user_id, type, title, message, data, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
    `,
        [userId, type, title, message, data]
    );
    return result.rows[0] ? mapNotificationRow(result.rows[0]) : null;
}

/**
 * Batch insert notifications for explicit user IDs.
 * Uses a single INSERT ... SELECT from UNNEST for performance.
 */
async function createNotificationsForUsers({ userIds, type, title, message, data = {} }) {
    const ids = Array.from(
        new Set((Array.isArray(userIds) ? userIds : []).map((x) => Number(x)).filter((x) => Number.isFinite(x)))
    );
    if (ids.length === 0) return [];

    const result = await pool.query(
        `
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        SELECT u.user_id, $2, $3, $4, $5, NOW()
        FROM UNNEST($1::bigint[]) AS u(user_id)
        RETURNING *
        `,
        [ids, type, title, message, data]
    );

    return result.rows.map(mapNotificationRow);
}

/**
 * Broadcast to all active employees (excluding customers by default).
 */
async function createNotificationsForCompany({ type, title, message, data = {}, excludeRoleSystems = ["customer"], includeRoleSystems = [] }) {
    const excludes = (excludeRoleSystems || []).map(normalizeRoleKey).filter(Boolean);
    const includes = (includeRoleSystems || []).map(normalizeRoleKey).filter(Boolean);

    const where = [`a.status = 'active'`];
    const params = [type, title, message, data];
    let paramIndex = params.length;

    if (includes.length > 0) {
        params.push(includes);
        paramIndex = params.length;
        where.push(`regexp_replace(lower(coalesce(a.role_system,'')), '\\s+', '', 'g') = ANY($${paramIndex}::text[])`);
    } else if (excludes.length > 0) {
        params.push(excludes);
        paramIndex = params.length;
        where.push(`regexp_replace(lower(coalesce(a.role_system,'')), '\\s+', '', 'g') <> ALL($${paramIndex}::text[])`);
    }

    const result = await pool.query(
        `
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        SELECT a.id, $1, $2, $3, $4, NOW()
        FROM accounts a
        WHERE ${where.join(" AND ")}
        RETURNING *
        `,
        params
    );

    return result.rows.map(mapNotificationRow);
}

/**
 * Broadcast to accounts with selected role_system values.
 */
async function createNotificationsForRoles({ roleSystems, type, title, message, data = {}, onlyActive = true }) {
    const roles = Array.from(new Set((Array.isArray(roleSystems) ? roleSystems : []).map(normalizeRoleKey).filter(Boolean)));
    if (roles.length === 0) return [];

    const params = [type, title, message, data, roles];
    const where = [
        `regexp_replace(lower(coalesce(a.role_system,'')), '\\s+', '', 'g') = ANY($5::text[])`,
    ];
    if (onlyActive) where.push(`a.status = 'active'`);

    const result = await pool.query(
        `
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        SELECT a.id, $1, $2, $3, $4, NOW()
        FROM accounts a
        WHERE ${where.join(" AND ")}
        RETURNING *
        `,
        params
    );

    return result.rows.map(mapNotificationRow);
}

async function hasNotificationForUserToday({ userId, type, dataKind, dataTaskId }) {
    const uid = Number(userId);
    const taskId = Number(dataTaskId);
    if (!Number.isFinite(uid) || !Number.isFinite(taskId)) return false;

    const result = await pool.query(
        `
        SELECT 1
        FROM notifications
        WHERE user_id = $1
          AND type = $2
          AND COALESCE(data->>'kind','') = $3
          AND (data->>'task_id')::bigint = $4
          AND created_at >= date_trunc('day', NOW())
          AND created_at < date_trunc('day', NOW()) + interval '1 day'
        LIMIT 1
        `,
        [uid, String(type), String(dataKind ?? ""), taskId]
    );
    return Boolean(result.rows[0]);
}

/**
 * List notifications for a user
 * @param {Object} param0 
 * @param {string|number} param0.userId
 * @param {number} [param0.limit=20]
 * @param {number} [param0.offset=0]
 * @param {boolean} [param0.isRead] - Optional filter
 */
async function listNotifications({ userId, limit = 20, offset = 0, isRead }) {
    const params = [userId, limit, offset];
    let whereClause = "user_id = $1";

    if (typeof isRead === 'boolean') {
        params.push(isRead);
        whereClause += ` AND is_read = $${params.length}`;
    }

    const result = await pool.query(
        `
    SELECT *
    FROM notifications
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
        params
    );

    return result.rows.map(mapNotificationRow);
}

/**
 * Mark a specific notification as read
 * @param {string|number} id 
 * @param {string|number} userId 
 */
async function markAsRead(id, userId) {
    const result = await pool.query(
        `
    UPDATE notifications
    SET is_read = true
    WHERE id = $1 AND user_id = $2
    RETURNING *
    `,
        [id, userId]
    );
    return result.rows[0] ? mapNotificationRow(result.rows[0]) : null;
}

/**
 * Mark all notifications as read for a user
 * @param {string|number} userId 
 */
async function markAllAsRead(userId) {
    await pool.query(
        `
    UPDATE notifications
    SET is_read = true
    WHERE user_id = $1 AND is_read = false
    `,
        [userId]
    );
    return true;
}

/**
 * Count unread notifications for a user
 * @param {string|number} userId 
 */
async function countUnread(userId) {
    const result = await pool.query(
        `
    SELECT COUNT(*)::int as count
    FROM notifications
    WHERE user_id = $1 AND is_read = false
    `,
        [userId]
    );
    return result.rows[0]?.count || 0;
}

module.exports = {
    createNotification,
    createNotificationsForUsers,
    createNotificationsForCompany,
    createNotificationsForRoles,
    listNotifications,
    markAsRead,
    markAllAsRead,
    countUnread,
    hasNotificationForUserToday
};
