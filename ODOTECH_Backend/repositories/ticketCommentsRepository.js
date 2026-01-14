const { pool } = require("../config/postgres");
const { mapTicketCommentRow } = require("../models/ticketComment");

/**
 * Get comments for a ticket
 */
async function getCommentsByTicket(ticketId, includeInternal = true) {
    let query = `
        SELECT 
            tc.*,
            a.name as user_name
        FROM ticket_comments tc
        LEFT JOIN accounts a ON tc.user_id = a.id
        WHERE tc.ticket_id = $1
    `;

    // Filter out internal comments if not requested
    if (!includeInternal) {
        query += ` AND tc.is_internal = false`;
    }

    query += ` ORDER BY tc.created_at ASC`;

    const result = await pool.query(query, [ticketId]);
    return result.rows.map(mapTicketCommentRow);
}

/**
 * Create new comment
 */
async function createComment(data) {
    const query = `
        INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    const params = [
        data.ticket_id,
        data.user_id,
        data.comment,
        data.is_internal || false,
    ];

    const result = await pool.query(query, params);

    // Get the comment with user name
    const commentQuery = `
        SELECT 
            tc.*,
            a.name as user_name
        FROM ticket_comments tc
        LEFT JOIN accounts a ON tc.user_id = a.id
        WHERE tc.id = $1
    `;

    const commentResult = await pool.query(commentQuery, [result.rows[0].id]);
    return mapTicketCommentRow(commentResult.rows[0]);
}

/**
 * Update comment
 */
async function updateComment(id, data) {
    const query = `
        UPDATE ticket_comments
        SET comment = $1
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [data.comment, id]);

    if (result.rows.length === 0) {
        return null;
    }

    // Get the comment with user name
    const commentQuery = `
        SELECT 
            tc.*,
            a.name as user_name
        FROM ticket_comments tc
        LEFT JOIN accounts a ON tc.user_id = a.id
        WHERE tc.id = $1
    `;

    const commentResult = await pool.query(commentQuery, [id]);
    return mapTicketCommentRow(commentResult.rows[0]);
}

/**
 * Delete comment
 */
async function deleteComment(id) {
    const query = `DELETE FROM ticket_comments WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
}

/**
 * Get comment by ID
 */
async function getCommentById(id) {
    const query = `
        SELECT 
            tc.*,
            a.name as user_name
        FROM ticket_comments tc
        LEFT JOIN accounts a ON tc.user_id = a.id
        WHERE tc.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? mapTicketCommentRow(result.rows[0]) : null;
}

module.exports = {
    getCommentsByTicket,
    createComment,
    updateComment,
    deleteComment,
    getCommentById,
};
