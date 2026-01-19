import { useEffect, useState, useMemo } from 'react';
import type { Server, ServerStats } from '../interface/serverTypes';
import { getTokenUser, normalizeRole } from '../utils/auth';
import {
    Server as ServerIcon,
    Plus,
    Search,
    Filter,
    Activity,
    HardDrive,
    Cpu,
    DollarSign,
    Eye,
    Edit,
    Trash2,
    X
} from 'lucide-react';

export default function Servers() {
    const [role, setRole] = useState<ReturnType<typeof normalizeRole>>('unknown');
    const [servers, setServers] = useState<Server[]>([]);
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        hostname: '',
        ip_address: '',
        server_type: 'vps' as 'vps' | 'dedicated' | 'cloud' | 'shared',
        cpu_cores: '',
        ram_gb: '',
        storage_gb: '',
        bandwidth_gb: '',
        provider: '',
        datacenter_location: '',
        ssh_port: '22',
        ssh_username: '',
        ssh_password: '',
        ssh_key: '',
        root_password: '',
        panel_type: '',
        panel_url: '',
        panel_username: '',
        panel_password: '',
        status: 'active' as 'active' | 'inactive' | 'maintenance' | 'error',
        cpu_usage: '',
        ram_usage: '',
        purpose: '',
        notes: '',
        monthly_cost: '',
        billing_cycle: 'monthly',
        next_billing_date: '',
    });

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const canView = ['admin', 'dev', 'dev_manager', 'head_tech', 'support'].includes(role);
    const canEdit = ['admin', 'dev_manager', 'head_tech'].includes(role);

    useEffect(() => {
        (async () => {
            const user = await getTokenUser();
            setRole(normalizeRole(user?.role));
        })();
    }, []);

    useEffect(() => {
        if (!canView) return;
        loadServers();
        loadStats();
    }, [canView, statusFilter, typeFilter]);

    const loadServers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (typeFilter) params.set('server_type', typeFilter);

            const res = await fetch(`${apiBaseUrl}/api/servers?${params}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load servers');

            const data = await res.json();
            setServers(data.servers || []);
        } catch (error) {
            console.error('Error loading servers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/servers/stats`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load stats');

            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleCreateServer = async () => {
        try {
            const payload = {
                ...formData,
                cpu_cores: formData.cpu_cores ? Number(formData.cpu_cores) : null,
                ram_gb: formData.ram_gb ? Number(formData.ram_gb) : null,
                storage_gb: formData.storage_gb ? Number(formData.storage_gb) : null,
                bandwidth_gb: formData.bandwidth_gb ? Number(formData.bandwidth_gb) : null,
                ssh_port: Number(formData.ssh_port),
                cpu_usage: formData.cpu_usage ? Number(formData.cpu_usage) : null,
                ram_usage: formData.ram_usage ? Number(formData.ram_usage) : null,
                monthly_cost: formData.monthly_cost ? Number(formData.monthly_cost) : null,
            };

            const url = isEditMode && selectedServer
                ? `${apiBaseUrl}/api/servers/${selectedServer.id}`
                : `${apiBaseUrl}/api/servers`;

            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} server`);

            setShowCreateModal(false);
            setIsEditMode(false);
            setSelectedServer(null);
            setFormData({
                name: '',
                hostname: '',
                ip_address: '',
                server_type: 'vps',
                cpu_cores: '',
                ram_gb: '',
                storage_gb: '',
                bandwidth_gb: '',
                provider: '',
                datacenter_location: '',
                ssh_port: '22',
                ssh_username: '',
                ssh_password: '',
                ssh_key: '',
                root_password: '',
                panel_type: '',
                panel_url: '',
                panel_username: '',
                panel_password: '',
                status: 'active',
                cpu_usage: '',
                ram_usage: '',
                purpose: '',
                notes: '',
                monthly_cost: '',
                billing_cycle: 'monthly',
                next_billing_date: '',
            });
            loadServers();
            loadStats();
        } catch (error) {
            console.error('Error creating server:', error);
            alert(`Lỗi khi ${isEditMode ? 'cập nhật' : 'tạo'} server`);
        }
    };

    const handleViewServer = (server: Server) => {
        setSelectedServer(server);
        setShowDetailModal(true);
    };

    const handleEditServer = (server: Server) => {
        setSelectedServer(server);
        setIsEditMode(true);
        setFormData({
            name: server.name,
            hostname: server.hostname,
            ip_address: server.ip_address,
            server_type: server.server_type as any,
            cpu_cores: server.cpu_cores?.toString() || '',
            ram_gb: server.ram_gb?.toString() || '',
            storage_gb: server.storage_gb?.toString() || '',
            bandwidth_gb: server.bandwidth_gb?.toString() || '',
            provider: server.provider || '',
            datacenter_location: server.datacenter_location || '',
            ssh_port: server.ssh_port?.toString() || '22',
            ssh_username: server.ssh_username || '',
            ssh_password: '', // Don't populate password
            ssh_key: '',
            root_password: '',
            panel_type: server.panel_type || '',
            panel_url: server.panel_url || '',
            panel_username: server.panel_username || '',
            panel_password: '',
            status: server.status,
            cpu_usage: server.cpu_usage?.toString() || '',
            ram_usage: server.ram_usage?.toString() || '',
            purpose: server.purpose || '',
            notes: server.notes || '',
            monthly_cost: server.monthly_cost?.toString() || '',
            billing_cycle: server.billing_cycle || 'monthly',
            next_billing_date: server.next_billing_date || '',
        });
        setShowCreateModal(true);
    };

    const handleDeleteServer = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa server này?')) return;

        try {
            const res = await fetch(`${apiBaseUrl}/api/servers/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to delete server');

            loadServers();
            loadStats();
        } catch (error) {
            console.error('Error deleting server:', error);
            alert('Lỗi khi xóa server');
        }
    };

    const filteredServers = useMemo(() => {
        return servers.filter(server => {
            const matchesSearch = !searchQuery ||
                server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                server.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                server.ip_address.includes(searchQuery);

            return matchesSearch;
        });
    }, [servers, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'error': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (!canView) {
        return (
            <div className="p-6 text-gray-700">
                Bạn không có quyền truy cập trang Quản lý Server.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý Server</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <ServerIcon size={16} />
                        Tổng quan và quản lý hệ thống server
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Thêm Server</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-500">Tổng Server</h3>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <ServerIcon size={20} />
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {stats.active} đang hoạt động
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-500">CPU Trung bình</h3>
                            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Cpu size={20} />
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.avg_cpu_usage ? `${Number(stats.avg_cpu_usage).toFixed(1)}%` : 'N/A'}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-500">RAM Trung bình</h3>
                            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Activity size={20} />
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.avg_ram_usage ? `${Number(stats.avg_ram_usage).toFixed(1)}%` : 'N/A'}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-500">Chi phí/tháng</h3>
                            <span className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <DollarSign size={20} />
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.total_monthly_cost ? `$${Number(stats.total_monthly_cost).toFixed(0)}` : 'N/A'}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder="Tìm theo tên, hostname, IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="error">Error</option>
                    </select>

                    <select
                        className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">Tất cả loại</option>
                        <option value="vps">VPS</option>
                        <option value="dedicated">Dedicated</option>
                        <option value="cloud">Cloud</option>
                        <option value="shared">Shared</option>
                    </select>

                    <button className="h-10 w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Server List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/75 border-b border-gray-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Server</th>
                                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Specs</th>
                                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Usage</th>
                                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : filteredServers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                                        Không tìm thấy server nào
                                    </td>
                                </tr>
                            ) : (
                                filteredServers.map((server) => (
                                    <tr key={server.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{server.name}</span>
                                                <span className="text-sm text-gray-500">{server.hostname}</span>
                                                <span className="text-xs text-gray-400 font-mono">{server.ip_address}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                {server.server_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-gray-600 space-y-0.5">
                                                {server.cpu_cores && <div><Cpu size={12} className="inline mr-1" />{server.cpu_cores} cores</div>}
                                                {server.ram_gb && <div><Activity size={12} className="inline mr-1" />{server.ram_gb} GB RAM</div>}
                                                {server.storage_gb && <div><HardDrive size={12} className="inline mr-1" />{server.storage_gb} GB</div>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(server.status)}`}>
                                                {server.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {server.cpu_usage !== null ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${Number(server.cpu_usage) > 80 ? 'bg-red-500' : Number(server.cpu_usage) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                style={{ width: `${server.cpu_usage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs w-12 text-right">{server.cpu_usage}%</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400">CPU: N/A</div>
                                                )}
                                                {server.ram_usage !== null ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${Number(server.ram_usage) > 80 ? 'bg-red-500' : Number(server.ram_usage) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                style={{ width: `${server.ram_usage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs w-12 text-right">{server.ram_usage}%</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400">RAM: N/A</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleViewServer(server)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {canEdit && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditServer(server)}
                                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteServer(server.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Server Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Chỉnh sửa Server' : 'Thêm Server Mới'}</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setIsEditMode(false);
                                    setSelectedServer(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin cơ bản</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Server *</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Production Server 1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hostname *</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.hostname}
                                            onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                            placeholder="prod-01.example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">IP Address *</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.ip_address}
                                            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                                            placeholder="192.168.1.100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại Server *</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.server_type}
                                            onChange={(e) => setFormData({ ...formData, server_type: e.target.value as any })}
                                        >
                                            <option value="vps">VPS</option>
                                            <option value="dedicated">Dedicated</option>
                                            <option value="cloud">Cloud</option>
                                            <option value="shared">Shared</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Specifications */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Cấu hình</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CPU Cores</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.cpu_cores}
                                            onChange={(e) => setFormData({ ...formData, cpu_cores: e.target.value })}
                                            placeholder="4"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">RAM (GB)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.ram_gb}
                                            onChange={(e) => setFormData({ ...formData, ram_gb: e.target.value })}
                                            placeholder="16"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Storage (GB)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.storage_gb}
                                            onChange={(e) => setFormData({ ...formData, storage_gb: e.target.value })}
                                            placeholder="500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bandwidth (GB)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.bandwidth_gb}
                                            onChange={(e) => setFormData({ ...formData, bandwidth_gb: e.target.value })}
                                            placeholder="1000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Provider */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Nhà cung cấp</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.provider}
                                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                            placeholder="DigitalOcean, AWS, Vultr..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Datacenter Location</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.datacenter_location}
                                            onChange={(e) => setFormData({ ...formData, datacenter_location: e.target.value })}
                                            placeholder="Singapore, US-East..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SSH Access */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">SSH Access</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SSH Port</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.ssh_port}
                                            onChange={(e) => setFormData({ ...formData, ssh_port: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SSH Username</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.ssh_username}
                                            onChange={(e) => setFormData({ ...formData, ssh_username: e.target.value })}
                                            placeholder="root"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SSH Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.ssh_password}
                                            onChange={(e) => setFormData({ ...formData, ssh_password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SSH Key</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                                            rows={2}
                                            value={formData.ssh_key}
                                            onChange={(e) => setFormData({ ...formData, ssh_key: e.target.value })}
                                            placeholder="ssh-rsa AAAAB3..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Root Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.root_password}
                                            onChange={(e) => setFormData({ ...formData, root_password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Panel Access */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Panel Access</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Panel Type</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.panel_type}
                                            onChange={(e) => setFormData({ ...formData, panel_type: e.target.value })}
                                        >
                                            <option value="">None</option>
                                            <option value="cPanel">cPanel</option>
                                            <option value="Plesk">Plesk</option>
                                            <option value="DirectAdmin">DirectAdmin</option>
                                            <option value="Custom">Custom</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Panel URL</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.panel_url}
                                            onChange={(e) => setFormData({ ...formData, panel_url: e.target.value })}
                                            placeholder="https://panel.example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Panel Username</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.panel_username}
                                            onChange={(e) => setFormData({ ...formData, panel_username: e.target.value })}
                                            placeholder="admin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Panel Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.panel_password}
                                            onChange={(e) => setFormData({ ...formData, panel_password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Billing */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Billing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Cost ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.monthly_cost}
                                            onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                                            placeholder="50.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.billing_cycle}
                                            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Billing Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.next_billing_date}
                                            onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Monitoring (Optional) */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Monitoring (Tùy chọn)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CPU Usage (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.cpu_usage}
                                            onChange={(e) => setFormData({ ...formData, cpu_usage: e.target.value })}
                                            placeholder="45.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">RAM Usage (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.ram_usage}
                                            onChange={(e) => setFormData({ ...formData, ram_usage: e.target.value })}
                                            placeholder="67.2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Other Fields */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Khác</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.purpose}
                                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                            placeholder="hosting, database, application..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="error">Error</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Ghi chú..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setIsEditMode(false);
                                    setSelectedServer(null);
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateServer}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                {isEditMode ? 'Cập nhật' : 'Tạo Server'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedServer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Chi tiết Server</h2>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedServer(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Tên Server</h3>
                                    <p className="text-base font-medium text-gray-900">{selectedServer.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Hostname</h3>
                                    <p className="text-base font-mono text-gray-900">{selectedServer.hostname}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">IP Address</h3>
                                    <p className="text-base font-mono text-gray-900">{selectedServer.ip_address}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Loại</h3>
                                    <p className="text-base text-gray-900">{selectedServer.server_type.toUpperCase()}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Provider</h3>
                                    <p className="text-base text-gray-900">{selectedServer.provider || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Location</h3>
                                    <p className="text-base text-gray-900">{selectedServer.datacenter_location || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">CPU</h3>
                                    <p className="text-base text-gray-900">{selectedServer.cpu_cores ? `${selectedServer.cpu_cores} cores` : 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">RAM</h3>
                                    <p className="text-base text-gray-900">{selectedServer.ram_gb ? `${selectedServer.ram_gb} GB` : 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Storage</h3>
                                    <p className="text-base text-gray-900">{selectedServer.storage_gb ? `${selectedServer.storage_gb} GB` : 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Status</h3>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedServer.status)}`}>
                                        {selectedServer.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Purpose</h3>
                                    <p className="text-base text-gray-900">{selectedServer.purpose || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Monthly Cost</h3>
                                    <p className="text-base text-gray-900">{selectedServer.monthly_cost ? `$${selectedServer.monthly_cost}` : 'N/A'}</p>
                                </div>
                                {selectedServer.notes && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Notes</h3>
                                        <p className="text-base text-gray-900">{selectedServer.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedServer(null);
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                            {canEdit && (
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleEditServer(selectedServer);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
