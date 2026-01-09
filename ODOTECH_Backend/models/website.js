function formatDate(value) {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
}

function formatTimestamp(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function mapWebsiteRow(row) {
    return {
        id: Number(row.id),
        name: row.name ?? "",
        url: row.url ?? "",
        project_code: row.project_code ?? "",
        manager_id: row.manager_id ?? null,
        manager_name: row.manager_name ?? "",

        hosting_package: row.hosting_package ?? "",
        hosting_provider: row.hosting_provider ?? "",

        storage_used: row.storage_used ? Number(row.storage_used) : 0,
        storage_limit: row.storage_limit ? Number(row.storage_limit) : 0,
        storage_alert_threshold: row.storage_alert_threshold ? Number(row.storage_alert_threshold) : 90,
        storage_percentage: row.storage_limit > 0
            ? Math.round((row.storage_used / row.storage_limit) * 100)
            : 0,

        admin_login_url: row.admin_login_url ?? "",
        admin_username: row.admin_username ?? "",
        admin_password: row.admin_password ?? "", // encrypted

        hosting_login_url: row.hosting_login_url ?? "",
        hosting_username: row.hosting_username ?? "",
        hosting_password: row.hosting_password ?? "", // encrypted

        vps_login_url: row.vps_login_url ?? "",
        vps_username: row.vps_username ?? "",
        vps_password: row.vps_password ?? "", // encrypted

        ssh_host: row.ssh_host ?? "",
        ssh_port: row.ssh_port ?? 22,
        ssh_username: row.ssh_username ?? "",
        ssh_password: row.ssh_password ?? "", // encrypted
        ssh_key: row.ssh_key ?? "", // encrypted

        sale_manager_id: row.sale_manager_id ?? null,
        sale_manager_name: row.sale_manager_name ?? "",
        status: row.status ?? "active",
        notes: row.notes ?? "",

        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

module.exports = {
    mapWebsiteRow,
};
