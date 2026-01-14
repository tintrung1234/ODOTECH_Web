function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function toDbTimestamp(value) {
    if (!value) return null;
    const str = String(value).trim();
    return str === "" ? null : str;
}

/**
 * Generate unique ticket number
 * Format: TK-YYYYMMDD-XXXX
 */
function generateTicketNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    return `TK-${year}${month}${day}-${random}`;
}

/**
 * Map ticket row from database to API response
 */
function mapTicketRow(row) {
    return {
        id: Number(row.id),
        ticket_number: row.ticket_number ?? "",
        type: row.type ?? "",
        category_id: row.category_id ? Number(row.category_id) : null,
        category_name: row.category_name ?? null,
        title: row.title ?? "",
        description: row.description ?? "",
        priority: row.priority ?? "medium",
        status: row.status ?? "new",
        created_by_id: Number(row.created_by_id),
        created_by_type: row.created_by_type ?? "",
        created_by_name: row.created_by_name ?? null,
        assigned_to_id: row.assigned_to_id ? Number(row.assigned_to_id) : null,
        assigned_to_name: row.assigned_to_name ?? null,
        customer_id: row.customer_id ? Number(row.customer_id) : null,
        customer_name: row.customer_name ?? null,
        related_project_id: row.related_project_id ? Number(row.related_project_id) : null,
        related_project_name: row.related_project_name ?? null,
        metadata: row.metadata || {},
        resolved_at: formatTimestamp(row.resolved_at),
        closed_at: formatTimestamp(row.closed_at),
        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

/**
 * Map ticket row for list view (fewer fields for performance)
 */
function mapTicketListRow(row) {
    return {
        id: Number(row.id),
        ticket_number: row.ticket_number ?? "",
        type: row.type ?? "",
        category_name: row.category_name ?? null,
        title: row.title ?? "",
        priority: row.priority ?? "medium",
        status: row.status ?? "new",
        created_by_name: row.created_by_name ?? null,
        assigned_to_name: row.assigned_to_name ?? null,
        customer_name: row.customer_name ?? null,
        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

/**
 * Validate ticket data
 */
function validateTicketData(data) {
    const errors = [];

    if (!data.type || !['customer', 'internal'].includes(data.type)) {
        errors.push('type must be either "customer" or "internal"');
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        errors.push('title is required and must be a non-empty string');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
        errors.push('description is required and must be a non-empty string');
    }

    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
        errors.push('priority must be one of: low, medium, high, urgent');
    }

    if (data.status && !['new', 'in_progress', 'resolved', 'closed'].includes(data.status)) {
        errors.push('status must be one of: new, in_progress, resolved, closed');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

module.exports = {
    formatTimestamp,
    toDbTimestamp,
    generateTicketNumber,
    mapTicketRow,
    mapTicketListRow,
    validateTicketData,
};
