function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

/**
 * Map ticket category row from database to API response
 */
function mapTicketCategoryRow(row) {
    return {
        id: Number(row.id),
        name: row.name ?? "",
        type: row.type ?? "",
        description: row.description ?? "",
        color: row.color ?? "#6B7280",
        icon: row.icon ?? "ticket",
        is_active: Boolean(row.is_active),
        created_at: formatTimestamp(row.created_at),
    };
}

/**
 * Validate ticket category data
 */
function validateTicketCategoryData(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }

    if (!data.type || !['customer', 'internal'].includes(data.type)) {
        errors.push('type must be either "customer" or "internal"');
    }

    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
        errors.push('color must be a valid hex color code (e.g., #FF5733)');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

module.exports = {
    formatTimestamp,
    mapTicketCategoryRow,
    validateTicketCategoryData,
};
