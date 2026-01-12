import { useCallback, useEffect, useState } from 'react';
import { Globe, Plus, Search, AlertTriangle, HardDrive, Shield } from 'lucide-react';
import WebsiteList from '../components/websiteManagement/WebsiteList.tsx';
import WebsiteDetail from '../components/websiteManagement/WebsiteDetail.tsx';
import WebsiteModal from '../components/websiteManagement/WebsiteModal.tsx';
import { getTokenUser } from '../utils/auth';

interface Website {
    id: number;
    name: string;
    url: string;
    project_code: string;
    manager_id?: number;
    manager_name?: string;
    sale_manager_id?: number;
    hosting_package: string;
    hosting_provider: string;
    storage_used: number;
    storage_limit: number;
    storage_percentage: number;
    storage_alert_threshold: number;
    admin_login_url: string;
    admin_username: string;
    hosting_login_url: string;
    hosting_username: string;
    vps_login_url: string;
    vps_username: string;
    ssh_host: string;
    ssh_port: number;
    ssh_username: string;
    sale_manager_name: string;
    status: string;
    notes: string;
    created_at: string;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    storage_alerts: number;
}

export default function Websites() {
    const [websites, setWebsites] = useState<Website[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, suspended: 0, storage_alerts: 0 });
    const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{ open: boolean; website?: Website }>({ open: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [, setUser] = useState<any>(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        (async () => {
            const userData = await getTokenUser();
            setUser(userData);
        })();
    }, []);

    const fetchWebsites = useCallback(async (signal?: AbortSignal) => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`${apiUrl}/api/websites?${params}`, {
                credentials: 'include', // Send cookies
                signal,
            });

            if (response.ok) {
                const data = await response.json();
                setWebsites(data.websites || []);
            }
        } catch (error) {
            // Ignore abort errors (newer request is in-flight)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((error as any)?.name === 'AbortError') return;
            console.error('Error fetching websites:', error);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, searchTerm, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/api/websites/stats`, {
                credentials: 'include', // Send cookies
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [apiUrl]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);

        const timer = setTimeout(() => {
            fetchWebsites(controller.signal);
            fetchStats();
        }, 250);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [fetchStats, fetchWebsites]);

    // fetchStats moved to useCallback above

    const handleWebsiteSelect = (website: Website) => {
        setSelectedWebsite(website);
    };

    const handleWebsiteUpdate = () => {
        fetchWebsites();
        fetchStats();
    };

    const handleEditWebsite = (website: Website) => {
        setModalState({ open: true, website });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveWebsite = async (data: any) => {
        try {
            const isEditing = !!modalState.website;
            const url = isEditing && modalState.website
                ? `${apiUrl}/api/websites/${modalState.website.id}`
                : `${apiUrl}/api/websites`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setModalState({ open: false });
                fetchWebsites();
                fetchStats();
                // If editing, also update the selected website detail view if it's open
                if (isEditing && selectedWebsite && modalState.website && selectedWebsite.id === modalState.website.id) {
                    // We might need to refresh the selected website data too, but fetchWebsites updates the list
                    // Ideally we should refetch the specific website or just close it.
                    // For now, let's close the detail view to be safe or maybe keep it and let the user reopen.
                    // Better UX: update selectedWebsite with the new data + existing id
                    setSelectedWebsite({ ...selectedWebsite, ...data });
                }
            } else {
                const errorData = await response.json();
                console.error("Server error data:", errorData);
                const errorMessage = typeof errorData.message === 'string'
                    ? errorData.message
                    : JSON.stringify(errorData.message || errorData);
                alert(`Lỗi: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error saving website:', error);
            alert('Đã xảy ra lỗi khi lưu website');
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20"></div>
                                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                    <Globe className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Website</h1>
                                <p className="text-sm text-gray-600 mt-0.5">Theo dõi hosting, bảo mật và dung lượng</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { fetchWebsites(); fetchStats(); }}
                                className="px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all border border-gray-200 hover:border-gray-300"
                            >
                                Làm mới
                            </button>
                            <button
                                onClick={() => setModalState({ open: true })}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Thêm Website</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Total Websites */}
                    <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tổng Website</p>
                                <p className="text-4xl font-bold text-gray-900 mt-3 mb-1">{stats.total}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <span>Tất cả dự án</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <Globe className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Active Websites */}
                    <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Hoạt động</p>
                                <p className="text-4xl font-bold text-green-600 mt-3 mb-1">{stats.active}</p>
                                <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span>Online</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Storage Alerts */}
                    <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cảnh báo</p>
                                <p className="text-4xl font-bold text-orange-600 mt-3 mb-1">{stats.storage_alerts}</p>
                                <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                    <span>Dung lượng cao</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <HardDrive className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    {/* Suspended */}
                    <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-red-200 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tạm ngưng</p>
                                <p className="text-4xl font-bold text-red-600 mt-3 mb-1">{stats.suspended}</p>
                                <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <span>Cần xử lý</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm website, URL, mã dự án..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-gray-50"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-gray-50 font-medium text-gray-700 min-w-[180px]"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="suspended">Tạm ngưng</option>
                        </select>
                    </div>
                </div>

                {/* Website List */}
                <div className="mt-6">
                    <WebsiteList
                        websites={websites}
                        loading={loading}
                        onSelect={handleWebsiteSelect}
                        selectedId={selectedWebsite?.id}
                    />
                </div>
            </div>

            {/* Detail Panel */}
            {selectedWebsite && (
                <WebsiteDetail
                    website={selectedWebsite}
                    onClose={() => setSelectedWebsite(null)}
                    onUpdate={handleWebsiteUpdate}
                    onEdit={() => handleEditWebsite(selectedWebsite)}
                />
            )}

            {/* Add/Edit Modal */}
            {modalState.open && (
                <WebsiteModal
                    initialData={modalState.website}
                    onClose={() => setModalState({ open: false })}
                    onSubmit={handleSaveWebsite}
                />
            )}
        </div>
    );
}
