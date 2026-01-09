/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Globe, Key, Database, Server, Save, Eye, EyeOff } from 'lucide-react';

interface WebsiteFormData {
    name: string;
    url: string;
    project_code: string;
    manager_name: string;
    sale_manager_name: string;
    status: string;

    // Hosting
    hosting_package: string;
    hosting_provider: string;
    storage_limit: number;
    storage_alert_threshold: number;

    // Credentials
    admin_login_url: string;
    admin_username: string;
    admin_password?: string;

    hosting_login_url: string;
    hosting_username: string;
    hosting_password?: string;

    vps_login_url: string;
    vps_username: string;
    vps_password?: string;

    ssh_host: string;
    ssh_port: number;
    ssh_username: string;
    ssh_password?: string;

    notes: string;
}

interface Props {
    initialData?: any;
    onClose: () => void;
    onSubmit: (data: WebsiteFormData) => Promise<void>;
}

export default function WebsiteModal({ initialData, onClose, onSubmit }: Props) {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'hosting' | 'credentials'>('info');

    const [formData, setFormData] = useState<WebsiteFormData>({
        name: '',
        url: '',
        project_code: '',
        manager_name: '',
        sale_manager_name: '',
        status: 'active',
        hosting_package: '',
        hosting_provider: '',
        storage_limit: 1024,
        storage_alert_threshold: 80,
        admin_login_url: '',
        admin_username: '',
        admin_password: '',
        hosting_login_url: '',
        hosting_username: '',
        hosting_password: '',
        vps_login_url: '',
        vps_username: '',
        vps_password: '',
        ssh_host: '',
        ssh_port: 22,
        ssh_username: '',
        ssh_password: '',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                url: initialData.url || '',
                project_code: initialData.project_code || '',
                manager_name: initialData.manager_name || '',
                sale_manager_name: initialData.sale_manager_name || '',
                status: initialData.status || 'active',
                hosting_package: initialData.hosting_package || '',
                hosting_provider: initialData.hosting_provider || '',
                storage_limit: initialData.storage_limit || 1024,
                storage_alert_threshold: initialData.storage_alert_threshold || 80,
                admin_login_url: initialData.admin_login_url || '',
                admin_username: initialData.admin_username || '',
                admin_password: '', // Don't pre-fill password for security/simplicity unless required
                hosting_login_url: initialData.hosting_login_url || '',
                hosting_username: initialData.hosting_username || '',
                hosting_password: '',
                vps_login_url: initialData.vps_login_url || '',
                vps_username: initialData.vps_username || '',
                vps_password: '',
                ssh_host: initialData.ssh_host || '',
                ssh_port: initialData.ssh_port || 22,
                ssh_username: initialData.ssh_username || '',
                ssh_password: '',
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'storage_limit' || name === 'storage_alert_threshold' || name === 'ssh_port'
                ? Number(value)
                : value
        }));
    };

    const togglePasswordVisibility = (field: string) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'info', label: 'Thông tin cơ bản', icon: Globe },
        { id: 'hosting', label: 'Hosting & Server', icon: Database },
        { id: 'credentials', label: 'Thông tin đăng nhập', icon: Key },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{isEditing ? 'Chỉnh sửa Website' : 'Thêm Website mới'}</h2>
                            <p className="text-sm text-blue-100 mt-0.5">{isEditing ? 'Cập nhật thông tin website' : 'Nhập thông tin quản lý website'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 pt-2">
                    <div className="flex gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative ${activeTab === tab.id
                                        ? 'text-blue-600 bg-white rounded-t-lg border border-b-0 border-gray-100 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 rounded-t-lg'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    <div className={`${activeTab === 'info' ? 'block' : 'hidden'} space-y-6 animate-in slide-in-from-right-4 duration-300`}>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin chung</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Website <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="VD: ODOTECH Website"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        name="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã dự án</label>
                                    <input
                                        name="project_code"
                                        value={formData.project_code}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="VD: WEB001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    >
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Không hoạt động</option>
                                        <option value="suspended">Tạm ngưng</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Người quản lý (Dev)</label>
                                    <input
                                        name="manager_name"
                                        value={formData.manager_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale phụ trách</label>
                                    <input
                                        name="sale_manager_name"
                                        value={formData.sale_manager_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${activeTab === 'hosting' ? 'block' : 'hidden'} space-y-6 animate-in slide-in-from-right-4 duration-300`}>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mb-6 transition-all hover:bg-blue-50">
                                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <Database className="w-5 h-5 text-blue-600" />
                                    Thông tin Hosting
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                                        <input
                                            name="hosting_provider"
                                            value={formData.hosting_provider}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gói hosting</label>
                                        <input
                                            name="hosting_package"
                                            value={formData.hosting_package}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100 transition-all hover:bg-orange-50">
                                <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-orange-600" />
                                    Dung lượng & Cảnh báo
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn dung lượng (MB)</label>
                                        <input
                                            type="number"
                                            name="storage_limit"
                                            value={formData.storage_limit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng cảnh báo (%)</label>
                                        <input
                                            type="number"
                                            name="storage_alert_threshold"
                                            value={formData.storage_alert_threshold}
                                            onChange={handleChange}
                                            max="100"
                                            min="1"
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${activeTab === 'credentials' ? 'block' : 'hidden'} space-y-6 animate-in slide-in-from-right-4 duration-300`}>
                        <div className="space-y-6">
                            {/* Admin */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Admin Website
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL Đăng nhập</label>
                                        <input
                                            name="admin_login_url"
                                            value={formData.admin_login_url}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="https://example.com/wp-admin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            name="admin_username"
                                            value={formData.admin_username}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditing && <span className="text-xs font-normal text-gray-400">(Để trống nếu không đổi)</span>}</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords['admin'] ? "text" : "password"}
                                                name="admin_password"
                                                value={formData.admin_password}
                                                onChange={handleChange}
                                                placeholder={isEditing ? '••••••••' : ''}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('admin')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPasswords['admin'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hosting */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    Hosting Control Panel
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL CPANEL / DirectAdmin</label>
                                        <input
                                            name="hosting_login_url"
                                            value={formData.hosting_login_url}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            name="hosting_username"
                                            value={formData.hosting_username}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditing && <span className="text-xs font-normal text-gray-400">(Để trống nếu không đổi)</span>}</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords['hosting'] ? "text" : "password"}
                                                name="hosting_password"
                                                value={formData.hosting_password}
                                                onChange={handleChange}
                                                placeholder={isEditing ? '••••••••' : ''}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('hosting')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPasswords['hosting'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VPS/SSH */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-slate-200 transition-colors">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                    VPS / SSH
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SSH Host / IP</label>
                                        <input
                                            name="ssh_host"
                                            value={formData.ssh_host}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SSH Port</label>
                                        <input
                                            type="number"
                                            name="ssh_port"
                                            value={formData.ssh_port}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            name="ssh_username"
                                            value={formData.ssh_username}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditing && <span className="text-xs font-normal text-gray-400">(Để trống nếu không đổi)</span>}</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords['ssh'] ? "text" : "password"}
                                                name="ssh_password"
                                                value={formData.ssh_password}
                                                onChange={handleChange}
                                                placeholder={isEditing ? '••••••••' : ''}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('ssh')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPasswords['ssh'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl bg-gray-50/80 backdrop-blur-sm">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100/80 hover:text-gray-900 rounded-lg transition-all"
                        disabled={loading}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xử lý...' : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Lưu thay đổi' : 'Tạo Website'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
