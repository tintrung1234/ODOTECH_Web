/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Globe, Key, Database, Server, Save, Eye, EyeOff } from 'lucide-react';

interface WebsiteFormData {
    name: string;
    url: string;
    project_code: string;
    manager_id?: number;
    manager_name: string;
    sale_manager_id?: number;
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
    const [submitError, setSubmitError] = useState<string | null>(null);

    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL as string | undefined;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    const [formData, setFormData] = useState<WebsiteFormData>({
        name: '',
        url: '',
        project_code: '',
        manager_id: undefined,
        manager_name: '',
        sale_manager_id: undefined,
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
                manager_id: initialData.manager_id || undefined,
                manager_name: initialData.manager_name || '',
                sale_manager_id: initialData.sale_manager_id || undefined,
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

    const touchedInfoFieldsRef = useRef({ manager_name: false, sale_manager_name: false });
    const projectLookupAbortRef = useRef<AbortController | null>(null);
    const [projectLookup, setProjectLookup] = useState<{
        loading: boolean;
        message?: string;
        projectName?: string;
        projectStatus?: string;
        techUserId?: number;
        techUserName?: string;
        saleName?: string;
    }>({ loading: false });

    const readErrorMessage = async (res: Response) => {
        const contentType = res.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                const json = (await res.json()) as { message?: string };
                return json?.message || `HTTP ${res.status}`;
            }
            const text = await res.text();
            return text || `HTTP ${res.status}`;
        } catch {
            return `HTTP ${res.status}`;
        }
    };

    const loadAccountNameById = async (id: number, signal: AbortSignal) => {
        const res = await fetch(`${apiBaseUrl}/api/accounts/${id}`, { credentials: 'include', signal });
        if (!res.ok) throw new Error(await readErrorMessage(res));
        const json = (await res.json()) as { name?: unknown; username?: unknown };
        const name = String((json as any)?.name ?? '').trim();
        if (name) return name;
        const username = String((json as any)?.username ?? '').trim();
        return username || `#${id}`;
    };

    useEffect(() => {
        const code = String(formData.project_code ?? '').trim();
        if (!code) {
            projectLookupAbortRef.current?.abort();
            projectLookupAbortRef.current = null;
            setProjectLookup({ loading: false });
            return;
        }

        const timer = window.setTimeout(async () => {
            projectLookupAbortRef.current?.abort();
            const controller = new AbortController();
            projectLookupAbortRef.current = controller;
            setProjectLookup({ loading: true, message: 'Đang tìm dự án...' });
            try {
                const url = new URL(`${apiBaseUrl}/api/projects`);
                url.searchParams.set('limit', '50');
                url.searchParams.set('offset', '0');
                url.searchParams.set('q', code);

                const res = await fetch(url.toString(), { credentials: 'include', signal: controller.signal });
                if (!res.ok) throw new Error(await readErrorMessage(res));
                const json = await res.json();
                const items: any[] = Array.isArray(json) ? json : (Array.isArray((json as any)?.items) ? (json as any).items : []);

                const exact = items.find((p) => String(p?.project_code ?? '').trim().toLowerCase() === code.toLowerCase());
                const project = exact ?? items[0];
                if (!project) {
                    setProjectLookup({ loading: false, message: 'Không tìm thấy dự án theo mã này' });
                    return;
                }

                const techUserId = Number(project?.tech_user_id);
                const saleId = Number(project?.sale_id);
                const uniqueIds = Array.from(new Set([techUserId, saleId].filter((x) => Number.isFinite(x) && x > 0)));

                let techUserName: string | undefined;
                let saleName: string | undefined;
                if (uniqueIds.length > 0) {
                    const results = await Promise.all(
                        uniqueIds.map(async (id) => ({ id, name: await loadAccountNameById(id, controller.signal) }))
                    );
                    const map = new Map<number, string>(results.map((r) => [r.id, r.name]));
                    if (Number.isFinite(techUserId) && techUserId > 0) techUserName = map.get(techUserId);
                    if (Number.isFinite(saleId) && saleId > 0) saleName = map.get(saleId);
                }

                setProjectLookup({
                    loading: false,
                    projectName: String(project?.name ?? '').trim() || String(project?.project_code ?? '').trim(),
                    projectStatus: String(project?.status ?? '').trim() || undefined,
                    techUserId,
                    techUserName,
                    saleName,
                });

                setFormData((prev) => {
                    const next = { ...prev };
                    if (!touchedInfoFieldsRef.current.manager_name && Number.isFinite(techUserId) && techUserId > 0) {
                        next.manager_id = techUserId;
                        next.manager_name = techUserName || '';
                    }
                    if (!touchedInfoFieldsRef.current.sale_manager_name && Number.isFinite(saleId) && saleId > 0) {
                        next.sale_manager_id = saleId;
                        next.sale_manager_name = saleName || '';
                    }
                    return next;
                });
            } catch (e: unknown) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                setProjectLookup({ loading: false, message: e instanceof Error ? e.message : 'Không tìm được dự án' });
            }
        }, 350);

        return () => {
            window.clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBaseUrl, formData.project_code]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (submitError) setSubmitError(null);

        if (name === 'manager_name') touchedInfoFieldsRef.current.manager_name = true;
        if (name === 'sale_manager_name') touchedInfoFieldsRef.current.sale_manager_name = true;
        if (name === 'project_code') {
            touchedInfoFieldsRef.current.manager_name = false;
            touchedInfoFieldsRef.current.sale_manager_name = false;
        }

        setFormData(prev => ({
            ...prev,
            [name]: name === 'storage_limit' || name === 'storage_alert_threshold' || name === 'ssh_port' || name === 'manager_id' || name === 'sale_manager_id'
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

        const name = String(formData.name ?? '').trim();
        const url = String(formData.url ?? '').trim();
        if (!name || !url) {
            setActiveTab('info');
            setSubmitError('Vui lòng nhập đầy đủ Tên Website và URL trước khi lưu.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error(error);
            setSubmitError(error instanceof Error ? error.message : 'Không thể lưu website');
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between rounded-t-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative flex items-center gap-4 text-white">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                            <Globe className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{isEditing ? 'Chỉnh sửa Website' : 'Thêm Website mới'}</h2>
                            <p className="text-sm text-blue-100 mt-1">{isEditing ? 'Cập nhật thông tin website' : 'Nhập thông tin quản lý website'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative p-2.5 hover:bg-white/20 rounded-xl text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/30 px-8 pt-3">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2.5 px-5 py-3.5 font-semibold text-sm transition-all relative group ${activeTab === tab.id
                                        ? 'text-blue-600 bg-white rounded-t-2xl shadow-md -mb-px border-t border-x border-gray-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-2xl'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-full"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 min-h-0 overflow-y-auto p-8 bg-gradient-to-br from-gray-50/50 to-white">
                        <div className={`${activeTab === 'info' ? 'block' : 'hidden'} space-y-6`}>
                            <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                                    Thông tin chung
                                </h3>
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
                                        {(projectLookup.loading || projectLookup.message || projectLookup.projectName) && (
                                            <div className="mt-2 text-xs text-gray-600">
                                                {projectLookup.loading ? (
                                                    <span>{projectLookup.message ?? 'Đang tìm dự án...'}</span>
                                                ) : projectLookup.projectName ? (
                                                    <span>
                                                        Dự án: <span className="font-semibold text-gray-800">{projectLookup.projectName}</span>
                                                        {projectLookup.projectStatus ? <span className="text-gray-500"> — {projectLookup.projectStatus}</span> : null}
                                                        {projectLookup.techUserName ? <span className="text-gray-500"> — Dev: {projectLookup.techUserName}</span> : null}
                                                        {projectLookup.saleName ? <span className="text-gray-500"> — Sale: {projectLookup.saleName}</span> : null}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-700">{projectLookup.message}</span>
                                                )}
                                            </div>
                                        )}
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
                                            type="text"
                                            name="manager_name"
                                            value={formData.manager_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="Tên người quản lý"
                                            readOnly={!!projectLookup.techUserName}
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

                        <div className={`${activeTab === 'hosting' ? 'block' : 'hidden'} space-y-6`}>
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

                        <div className={`${activeTab === 'credentials' ? 'block' : 'hidden'} space-y-6`}>
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
                                                    className="w-full px-4 py-2 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('admin')}
                                                    aria-label={showPasswords['admin'] ? 'Ẩn mật khẩu admin' : 'Hiện mật khẩu admin'}
                                                    className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-gray-500"
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
                                                    className="w-full px-4 py-2 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('hosting')}
                                                    aria-label={showPasswords['hosting'] ? 'Ẩn mật khẩu hosting' : 'Hiện mật khẩu hosting'}
                                                    className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-gray-500"
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
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">URL đăng nhập VPS</label>
                                            <input
                                                name="vps_login_url"
                                                value={formData.vps_login_url}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">VPS Username</label>
                                            <input
                                                name="vps_username"
                                                value={formData.vps_username}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">VPS Password {isEditing && <span className="text-xs font-normal text-gray-400">(Để trống nếu không đổi)</span>}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords['vps'] ? 'text' : 'password'}
                                                    name="vps_password"
                                                    value={formData.vps_password}
                                                    onChange={handleChange}
                                                    placeholder={isEditing ? '••••••••' : ''}
                                                    className="w-full px-4 py-2 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('vps')}
                                                    aria-label={showPasswords['vps'] ? 'Ẩn mật khẩu VPS' : 'Hiện mật khẩu VPS'}
                                                    className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-gray-500"
                                                >
                                                    {showPasswords['vps'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
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
                                                    className="w-full px-4 py-2 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('ssh')}
                                                    aria-label={showPasswords['ssh'] ? 'Ẩn mật khẩu SSH' : 'Hiện mật khẩu SSH'}
                                                    className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-gray-500"
                                                >
                                                    {showPasswords['ssh'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="relative p-8 border-t border-gray-200 flex justify-center gap-4 rounded-b-3xl bg-gradient-to-r from-gray-50 to-gray-100/50">
                        {submitError && (
                            <div className="absolute left-6 right-6 -translate-y-10 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                                {submitError}
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            type="button"
                            className="px-6 py-3 cursor-pointer text-gray-700 font-semibold hover:bg-white hover:text-gray-900 rounded-xl transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            disabled={loading}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {isEditing ? 'Lưu thay đổi' : 'Tạo Website'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
