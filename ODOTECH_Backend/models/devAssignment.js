function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function mapDevAssignmentRow(row) {
    return {
        id: Number(row.id),
        virus_log_id: Number(row.virus_log_id),
        assigned_dev_id: Number(row.assigned_dev_id),
        assigned_dev_name: row.assigned_dev_name ?? "",

        assigned_at: formatTimestamp(row.assigned_at),
        status: row.status ?? "pending",

        delegation_history: row.delegation_history ?? null,
        delegation_expires_at: formatTimestamp(row.delegation_expires_at),

        accepted_at: formatTimestamp(row.accepted_at),
        started_at: formatTimestamp(row.started_at),
        completed_at: formatTimestamp(row.completed_at),
        resolution_notes: row.resolution_notes ?? "",

        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

function mapDevRotationRow(row) {
    return {
        id: Number(row.id),
        dev_id: Number(row.dev_id),
        dev_name: row.dev_name ?? "",
        rotation_order: Number(row.rotation_order),
        is_active: row.is_active ?? true,
        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

module.exports = {
    mapDevAssignmentRow,
    mapDevRotationRow,
};
