import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService, categoryService } from '../services/ticketService';
import type { CreateTicketData, TicketCategory } from '../interface/ticket.interface';
import { getTokenUser, normalizeRole } from '../utils/auth';

type AccountLite = { id: number; name?: string; username?: string };
type CustomerLite = { id: number; name?: string; ma_kh?: string };
type ProjectLite = { id: number; name?: string; project_code?: string };

const NewTicket: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [accounts, setAccounts] = useState<AccountLite[]>([]);
    const [customers, setCustomers] = useState<CustomerLite[]>([]);
    const [projects, setProjects] = useState<ProjectLite[]>([]);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateTicketData>({
        type: 'internal',
        title: '',
        description: '',
        priority: 'medium',
    });
    const [selectedProject, setSelectedProject] = useState<ProjectLite | null>(null);

    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    useEffect(() => {
        loadCategories();
    }, [formData.type]);

    useEffect(() => {
        void initializeForm();
        void loadAccounts();
        // customers/projects are role-guarded on backend; errors are handled gracefully
        void loadCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializeForm = async () => {
        try {
            const user = await getTokenUser();
            const role = normalizeRole(user?.role);
            setUserRole(role);

            if (role === 'customer') {
                // Customer users can only create customer tickets
                // We need to fetch the customer profile to get the real customer_id (PK in customers table)
                // because user.uid is likely the account_id, which might differ.
                try {
                    const res = await fetch(`${apiBaseUrl}/api/customer-portal/profile`, { credentials: 'include' });
                    if (res.ok) {
                        const profile = await res.json();
                        // profile should have id
                        if (profile && profile.id) {
                            setFormData(prev => ({
                                ...prev,
                                type: 'customer',
                                customer_id: Number(profile.id)
                            }));
                            // Load projects for this customer
                            void loadCustomerProjects(Number(profile.id));
                        }
                    } else {
                        console.error('Failed to fetch customer profile to get ID');
                    }
                } catch (err) {
                    console.error('Error fetching customer profile:', err);
                }
            } else {
                // Non-customer users can only create internal tickets
                setFormData(prev => ({ ...prev, type: 'internal' }));
            }
        } catch (error) {
            console.error('Error initializing form:', error);
        }
    };

    useEffect(() => {
        if (formData.type !== 'customer') {
            setProjects([]);
            return;
        }

        if (!formData.customer_id) {
            setProjects([]);
            return;
        }

        void loadCustomerProjects(formData.customer_id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.type, formData.customer_id]);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAllCategories(formData.type);
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadAccounts = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000&offset=0`, { credentials: 'include' });
            if (!res.ok) return;
            const json = await res.json() as any;
            const items: any[] = Array.isArray(json) ? json : (json.items ?? []);
            setAccounts(items.map((x) => ({ id: Number(x.id), name: x.name, username: x.username })));
        } catch {
            // ignore
        }
    };

    const loadCustomers = async () => {
        try {
            setLookupError(null);

            const user = await getTokenUser();
            const role = normalizeRole(user?.role);

            // Backend currently only allows admin/sale/sales_manager/head_sales to view customers.
            // For other roles, skip the request to avoid noisy 403s.
            if (!['admin', 'sale', 'sales_manager', 'head_sales'].includes(role)) {
                setCustomers([]);
                return;
            }

            const res = await fetch(`${apiBaseUrl}/api/customers?limit=200&offset=0`, { credentials: 'include' });
            if (!res.ok) {
                setCustomers([]);
                return;
            }
            const json = await res.json() as any;
            const items: any[] = Array.isArray(json) ? json : (json.items ?? []);
            setCustomers(items.map((x) => ({ id: Number(x.id), name: x.name, ma_kh: x.ma_kh })));
        } catch {
            setLookupError('Không thể tải danh sách khách hàng');
        }
    };

    const loadCustomerProjects = async (customerId: number) => {
        try {
            setLookupError(null);
            // Revert to using customer-portal/services as it is accessible (no 403)
            // and provides the data user expects.
            const user = await getTokenUser();
            const role = normalizeRole(user?.role);

            if (role === 'customer') {
                const res = await fetch(`${apiBaseUrl}/api/customer-portal/services`, { credentials: 'include' });
                if (!res.ok) {
                    setProjects([]);
                    return;
                }
                const json = await res.json();
                const items: any[] = Array.isArray(json) ? json : [];
                setProjects(items.map((x) => ({
                    id: Number(x.id),
                    name: x.website || x.ten_khach || `Project ${x.id}`,
                    project_code: x.ma_du_an
                })));
            } else {
                const res = await fetch(`${apiBaseUrl}/api/customers/${customerId}/projects`, { credentials: 'include' });
                if (!res.ok) {
                    setProjects([]);
                    return;
                }
                const json = await res.json() as any;
                const items: any[] = Array.isArray(json?.projects) ? json.projects : [];
                setProjects(items.map((x) => ({ id: Number(x.id), name: x.name, project_code: x.project_code })));
            }
        } catch {
            setProjects([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            const payload = { ...formData };

            // For customer, related_project_id comes from Sale Project (Services) 
            // which often causes FK error with Technical Projects table.
            // Safe workaround: Append project info to description and clear ID.
            if (isCustomerRole && selectedProject) {
                payload.related_project_id = undefined;
                payload.description = `${payload.description}\n\n[System Note]\nKhách hàng đã chọn dự án liên quan:\nMã: ${selectedProject.project_code || 'N/A'}\nTên: ${selectedProject.name}`;
            }

            const ticket = await ticketService.createTicket(payload);
            navigate(`/tickets/${ticket.id}`);
        } catch (error: any) {
            alert(error?.message || 'Không thể tạo ticket');
            console.error('Error creating ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CreateTicketData, value: any) => {
        setFormData(prev => {
            if (field === 'type') {
                const nextType = value as 'customer' | 'internal';
                return {
                    ...prev,
                    type: nextType,
                    // reset cross-type fields to avoid sending inconsistent payloads
                    customer_id: nextType === 'customer' ? prev.customer_id : undefined,
                    related_project_id: nextType === 'customer' ? prev.related_project_id : undefined,
                };
            }

            if (field === 'customer_id') {
                return {
                    ...prev,
                    customer_id: value,
                    related_project_id: undefined,
                };
            }

            if (field === 'related_project_id') {
                const rawId = Number(value);
                const proj = projects.find(p => p.id === rawId) || null;
                setSelectedProject(proj);
            }

            return ({ ...prev, [field]: value });
        });
    };

    // Check if user can assign tickets (all roles except customer)
    const canAssignTicket = userRole !== 'customer';

    // Check if user is customer (to hide customer selection)
    const isCustomerRole = userRole === 'customer';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto p-6">
                <nav className="mb-6">
                    <ol className="flex items-center space-x-2 text-sm">
                        <li>
                            <button
                                onClick={() => navigate('/tickets')}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                Tickets
                            </button>
                        </li>
                        <li className="text-gray-400 dark:text-gray-600">/</li>
                        <li className="text-gray-900 dark:text-white font-medium">Tạo mới</li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tạo Ticket Mới</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Điền thông tin để tạo ticket mới trong hệ thống</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {lookupError && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-amber-800 dark:text-amber-200 text-sm">{lookupError}</p>
                            </div>
                        </div>
                    )}

                    {/* Basic Information Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Thông tin cơ bản
                        </h2>

                        <div className="space-y-6">
                            {/* Type - Only show for NON-customer users */}
                            {!isCustomerRole && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Loại Ticket <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'customer'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                            } cursor-pointer`}>
                                            <input
                                                type="radio"
                                                name="type"
                                                value="customer"
                                                checked={formData.type === 'customer'}
                                                onChange={(e) => handleChange('type', e.target.value as 'customer' | 'internal')}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.type === 'customer' ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                                                    }`}>
                                                    <svg className={`w-5 h-5 ${formData.type === 'customer' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <span className={`font-medium ${formData.type === 'customer' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    Khách hàng
                                                </span>
                                            </div>
                                            {formData.type === 'customer' && (
                                                <div className="absolute top-2 right-2">
                                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>
                                        <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'internal'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                            } cursor-pointer`}>
                                            <input
                                                type="radio"
                                                name="type"
                                                value="internal"
                                                checked={formData.type === 'internal'}
                                                onChange={(e) => handleChange('type', e.target.value as 'customer' | 'internal')}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.type === 'internal' ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-700'
                                                    }`}>
                                                    <svg className={`w-5 h-5 ${formData.type === 'internal' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <span className={`font-medium ${formData.type === 'internal' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    Nội bộ
                                                </span>
                                            </div>
                                            {formData.type === 'internal' && (
                                                <div className="absolute top-2 right-2">
                                                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        required
                                        placeholder="Nhập tiêu đề ticket"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mô tả <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    required
                                    rows={6}
                                    placeholder="Mô tả chi tiết vấn đề..."
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Độ ưu tiên
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                                        </svg>
                                    </div>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none cursor-pointer"
                                    >
                                        <option value="low">🟢 Thấp</option>
                                        <option value="medium">🟡 Trung bình</option>
                                        <option value="high">🟠 Cao</option>
                                        <option value="urgent">🔴 Khẩn cấp</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignment & Classification Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Phân loại & Phân công
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Danh mục
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                    <select
                                        value={formData.category_id || ''}
                                        onChange={(e) => handleChange('category_id', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Assignee - Only show for non-customer users */}
                            {canAssignTicket && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Giao cho
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <select
                                            value={formData.assigned_to_id || ''}
                                            onChange={(e) => handleChange('assigned_to_id', e.target.value ? Number(e.target.value) : undefined)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Chưa giao --</option>
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {(a.name || a.username || `User ${a.id}`).trim()}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                                        <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Nếu để trống, ticket sẽ ở trạng thái "Chưa giao"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Information Section (conditional) */}
                    {formData.type === 'customer' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Thông tin khách hàng
                            </h2>

                            <div className="space-y-6">
                                {/* Customer - Hide for customer role since it's auto-populated */}
                                {!isCustomerRole && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Khách hàng
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <select
                                                value={formData.customer_id || ''}
                                                onChange={(e) => handleChange('customer_id', e.target.value ? Number(e.target.value) : undefined)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none cursor-pointer"
                                            >
                                                <option value="">-- Chọn khách hàng --</option>
                                                {customers.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {`${c.ma_kh ? `${c.ma_kh} - ` : ''}${c.name || `Customer ${c.id}`}`}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {customers.length === 0 && (
                                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Nếu bạn không thấy danh sách, có thể tài khoản chưa có quyền xem khách hàng
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Project */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Dự án liên quan
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        </div>
                                        <select
                                            value={formData.related_project_id || ''}
                                            onChange={(e) => handleChange('related_project_id', e.target.value ? Number(e.target.value) : undefined)}
                                            disabled={!isCustomerRole && !formData.customer_id}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">-- Chọn dự án --</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {`${p.project_code ? `${p.project_code} - ` : ''}${p.name || `Project ${p.id}`}`}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {!isCustomerRole && (
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                                            <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Chọn khách hàng trước để tải danh sách dự án
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => navigate('/tickets')}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tạo Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewTicket;
