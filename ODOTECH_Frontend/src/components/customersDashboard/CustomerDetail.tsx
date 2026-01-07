import { useState, useEffect } from 'react';
import type { Customer, CustomerProject } from './interface/types';
import { buildAuthHeaders } from '../../utils/auth';
import { formatCurrency } from '../../utils/formatDate';
import {
    ArrowLeft,
    Save,
    User,
    Phone,
    Globe,
    MessageCircle,
    Building2,
    TrendingUp,
    DollarSign,
} from 'lucide-react';

interface Props {
    customer: Customer;
    onBack: () => void;
    onSave: (data: Customer) => void;
    readOnly?: boolean;
}

export default function CustomerDetail({ customer, onBack, onSave, readOnly = false }: Props) {
    const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);
    const [projects, setProjects] = useState<CustomerProject[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';

    useEffect(() => {
        setEditedCustomer(customer);
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer]);

    const loadProjects = async () => {
        setLoadingProjects(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/customers/${customer.ma_kh}/projects`, {
                headers: buildAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data.items || []);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleSave = () => {
        onSave(editedCustomer);
    };

    const handleChange = (field: keyof Customer, value: string) => {
        setEditedCustomer(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Quay lại danh sách</span>
                    </button>
                    {!readOnly && (
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                        >
                            <Save size={18} />
                            Lưu thay đổi
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Customer Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User size={20} className="text-blue-600" />
                                Thông tin khách hàng
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mã khách hàng</label>
                                    <input
                                        type="text"
                                        value={editedCustomer.ma_kh}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên khách hàng</label>
                                    <input
                                        type="text"
                                        value={editedCustomer.ten_khach}
                                        onChange={(e) => handleChange('ten_khach', e.target.value)}
                                        disabled={readOnly}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <Phone size={14} />
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        value={editedCustomer.sdt}
                                        onChange={(e) => handleChange('sdt', e.target.value)}
                                        disabled={readOnly}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <MessageCircle size={14} />
                                        Zalo / Facebook
                                    </label>
                                    <input
                                        type="text"
                                        value={editedCustomer.zalo_fb}
                                        onChange={(e) => handleChange('zalo_fb', e.target.value)}
                                        disabled={readOnly}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <Globe size={14} />
                                        Website
                                    </label>
                                    <input
                                        type="text"
                                        value={editedCustomer.website}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                        disabled={readOnly}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nguồn khách</label>
                                    <input
                                        type="text"
                                        value={editedCustomer.nguon_khach}
                                        onChange={(e) => handleChange('nguon_khach', e.target.value)}
                                        disabled={readOnly}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Stats */}
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Thống kê</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Building2 size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tổng dự án</p>
                                            <p className="text-2xl font-bold text-gray-900">{customer.total_projects || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <DollarSign size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tổng doanh thu</p>
                                            <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.total_revenue || 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <TrendingUp size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Ngày tạo</p>
                                            <p className="text-sm font-medium text-gray-900">{customer.ngay_tao || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects List - Full Width */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-purple-600" />
                        Danh sách dự án ({projects.length})
                    </h2>
                    {loadingProjects ? (
                        <div className="text-center py-8 text-gray-500">Đang tải...</div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 italic">Chưa có dự án nào</div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map((project) => (
                                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{project.ma_du_an}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{project.website || 'Chưa có website'}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.trang_thai_chot === 'DaKy'
                                                    ? 'bg-green-50 text-green-700'
                                                    : project.trang_thai_chot === 'Huy'
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-yellow-50 text-yellow-700'
                                                    }`}>
                                                    {project.trang_thai_chot === 'DaKy' ? 'Đã ký' : project.trang_thai_chot === 'Huy' ? 'Đã huỷ' : 'Đang chăm'}
                                                </span>
                                                <span className="text-xs text-gray-500">{project.ngay_tao}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(project.phi_dich_vu + project.phat_sinh)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
