function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

/**
 * Map ticket comment row from database to API response
 */
function mapTicketCommentRow(row) {
    return {
        id: Number(row.id),
        ticket_id: Number(row.ticket_id),
        user_id: Number(row.user_id),
        user_name: row.user_name ?? null,
        comment: row.comment ?? "",
        is_internal: Boolean(row.is_internal),
        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

/**
 * Validate ticket comment data
 */
function validateTicketCommentData(data) {
    const errors = [];

    if (!data.comment || typeof data.comment !== 'string' || data.comment.trim() === '') {
        errors.push('comment is required and must be a non-empty string');
    }

    if (data.comment && data.comment.length > 5000) {
        errors.push('comment must not exceed 5000 characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

module.exports = {
    formatTimestamp,
    mapTicketCommentRow,
    validateTicketCommentData,
};
