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

function mapNotificationRow(row) {
    return {
        id: Number(row.id),
        user_id: Number(row.user_id),
        type: row.type ?? "",
        title: row.title ?? "",
        message: row.message ?? "",
        data: row.data || {},
        is_read: Boolean(row.is_read),
        created_at: formatTimestamp(row.created_at),
    };
}

module.exports = {
    formatTimestamp,
    toDbTimestamp,
    mapNotificationRow,
};
