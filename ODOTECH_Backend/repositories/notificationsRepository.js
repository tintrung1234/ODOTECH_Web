const { pool } = require("../config/postgres");

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
    return result.rows[0];
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

    return result.rows;
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
    return result.rows[0];
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
    listNotifications,
    markAsRead,
    markAllAsRead,
    countUnread
};
