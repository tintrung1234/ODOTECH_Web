/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
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
    manager_name: string;
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

    useEffect(() => {
        fetchWebsites();
        fetchStats();
    }, [searchTerm, statusFilter]);

    const fetchWebsites = async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`${apiUrl}/api/websites?${params}`, {
                credentials: 'include', // Send cookies
            });

            if (response.ok) {
                const data = await response.json();
                setWebsites(data.websites || []);
            }
        } catch (error) {
            console.error('Error fetching websites:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
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
    };

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
                alert(`Lỗi: ${errorData.message || 'Không thể lưu website'}`);
            }
        } catch (error) {
            console.error('Error saving website:', error);
            alert('Đã xảy ra lỗi khi lưu website');
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <Globe className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Quản lý Website</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Theo dõi hosting, bảo mật và dung lượng</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setModalState({ open: true })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Thêm Website</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng Website</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Globe className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Cảnh báo dung lượng</p>
                                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.storage_alerts}</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <HardDrive className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tạm ngưng</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{stats.suspended}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm website, URL, mã dự án..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
