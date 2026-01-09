function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function mapAccessHistoryRow(row) {
    return {
        id: Number(row.id),
        user_id: Number(row.user_id),
        user_name: row.user_name ?? "",

        website_id: Number(row.website_id),
        website_name: row.website_name ?? "",
        credential_type: row.credential_type ?? "",

        accessed_at: formatTimestamp(row.accessed_at),
        ip_address: row.ip_address ?? "",
        user_agent: row.user_agent ?? "",

        created_at: formatTimestamp(row.created_at),
    };
}

module.exports = {
    mapAccessHistoryRow,
};
