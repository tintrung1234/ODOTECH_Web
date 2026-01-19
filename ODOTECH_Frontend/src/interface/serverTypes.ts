export interface Server {
    id: number;

    // Basic Information
    name: string;
    hostname: string;
    ip_address: string;
    server_type: 'vps' | 'dedicated' | 'cloud' | 'shared' | '';

    // Specifications
    cpu_cores: number | null;
    ram_gb: number | null;
    storage_gb: number | null;
    bandwidth_gb: number | null;

    // Provider Information
    provider: string;
    datacenter_location: string;

    // Access Credentials (encrypted)
    ssh_port: number;
    ssh_username: string;
    ssh_password: string; // masked as "***"
    ssh_key: string; // masked as "***"
    root_password: string; // masked as "***"

    // Panel Access
    panel_type: string;
    panel_url: string;
    panel_username: string;
    panel_password: string; // masked as "***"

    // Status & Monitoring
    status: 'active' | 'inactive' | 'maintenance' | 'error';
    cpu_usage: number | null;
    ram_usage: number | null;
    storage_usage: number | null;
    uptime_days: number | null;
    last_check: string;

    // Management
    manager_id: number | null;
    manager_name: string;
    purpose: string;
    notes: string;

    // Billing
    monthly_cost: number | null;
    billing_cycle: string;
    next_billing_date: string;

    created_at: string;
    updated_at: string;
}

export interface ServerStats {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    error: number;
    avg_cpu_usage: number | null;
    avg_ram_usage: number | null;
    avg_storage_usage: number | null;
    total_monthly_cost: number | null;
    by_type: Array<{ server_type: string; count: number }>;
    by_provider: Array<{ provider: string; count: number }>;
}

export const SERVER_TYPE_OPTIONS = [
    { value: 'vps', label: 'VPS' },
    { value: 'dedicated', label: 'Dedicated Server' },
    { value: 'cloud', label: 'Cloud Server' },
    { value: 'shared', label: 'Shared Hosting' },
];

export const SERVER_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'error', label: 'Error' },
];

export const PANEL_TYPE_OPTIONS = [
    { value: 'cPanel', label: 'cPanel' },
    { value: 'Plesk', label: 'Plesk' },
    { value: 'DirectAdmin', label: 'DirectAdmin' },
    { value: 'Custom', label: 'Custom' },
    { value: 'None', label: 'None' },
];

export const PURPOSE_OPTIONS = [
    { value: 'hosting', label: 'Web Hosting' },
    { value: 'database', label: 'Database Server' },
    { value: 'application', label: 'Application Server' },
    { value: 'backup', label: 'Backup Server' },
    { value: 'development', label: 'Development Server' },
];
