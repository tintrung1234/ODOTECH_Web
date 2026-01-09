function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function mapVirusLogRow(row) {
    return {
        id: Number(row.id),
        website_id: Number(row.website_id),
        website_name: row.website_name ?? "",

        detected_at: formatTimestamp(row.detected_at),
        threat_type: row.threat_type ?? "",
        severity: row.severity ?? "medium",

        affected_files: row.affected_files ?? [],
        threat_description: row.threat_description ?? "",
        scanner_name: row.scanner_name ?? "",

        action_taken: row.action_taken ?? "",
        status: row.status ?? "detected",

        resolved_at: formatTimestamp(row.resolved_at),
        resolution_notes: row.resolution_notes ?? "",

        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

module.exports = {
    mapVirusLogRow,
};
