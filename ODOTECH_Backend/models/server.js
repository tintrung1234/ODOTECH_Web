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

function mapServerRow(row) {
    return {
        id: Number(row.id),

        // Basic Information
        name: row.name ?? "",
        hostname: row.hostname ?? "",
        ip_address: row.ip_address ?? "",
        server_type: row.server_type ?? "",

        // Specifications
        cpu_cores: row.cpu_cores ? Number(row.cpu_cores) : null,
        ram_gb: row.ram_gb ? Number(row.ram_gb) : null,
        storage_gb: row.storage_gb ? Number(row.storage_gb) : null,
        bandwidth_gb: row.bandwidth_gb ? Number(row.bandwidth_gb) : null,

        // Provider Information
        provider: row.provider ?? "",
        datacenter_location: row.datacenter_location ?? "",

        // Access Credentials
        ssh_port: row.ssh_port ?? 22,
        ssh_username: row.ssh_username ?? "",
        ssh_password: row.ssh_password ?? "", // encrypted
        ssh_key: row.ssh_key ?? "", // encrypted
        root_password: row.root_password ?? "", // encrypted

        // Panel Access
        panel_type: row.panel_type ?? "",
        panel_url: row.panel_url ?? "",
        panel_username: row.panel_username ?? "",
        panel_password: row.panel_password ?? "", // encrypted

        // Status & Monitoring
        status: row.status ?? "active",
        cpu_usage: row.cpu_usage ? Number(row.cpu_usage) : null,
        ram_usage: row.ram_usage ? Number(row.ram_usage) : null,
        storage_usage: row.storage_usage ? Number(row.storage_usage) : null,
        uptime_days: row.uptime_days ? Number(row.uptime_days) : null,
        last_check: formatTimestamp(row.last_check),

        // Management
        manager_id: row.manager_id ?? null,
        manager_name: row.manager_name ?? "",
        purpose: row.purpose ?? "",
        notes: row.notes ?? "",

        // Billing
        monthly_cost: row.monthly_cost ? Number(row.monthly_cost) : null,
        billing_cycle: row.billing_cycle ?? "",
        next_billing_date: formatDate(row.next_billing_date),

        created_at: formatTimestamp(row.created_at),
        updated_at: formatTimestamp(row.updated_at),
    };
}

module.exports = {
    mapServerRow,
};
