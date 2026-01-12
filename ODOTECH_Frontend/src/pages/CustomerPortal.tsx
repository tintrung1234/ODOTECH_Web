import { useCallback, useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatDate';


interface CustomerProfile {
    ma_kh: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    zalo_fb: string;
    nguon_khach: string;
    nhu_cau: string;
    san_pham_dv: string;
    website: string;
}

interface SaleProject {
    id: number;
    ma_du_an: string;
    ten_khach: string;
    website: string;
    san_pham_dv: string;
    trang_thai_chot: string;
    trang_thai_thu_tien: string;
    trang_thai_trien_khai: string;
    ngay_tao: string;
    phi_dich_vu: number;
    phat_sinh: number;
    ngay_ban_giao: string;
}

export default function CustomerPortal() {
    const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [services, setServices] = useState<SaleProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileDraft, setProfileDraft] = useState<CustomerProfile | null>(null);
    const [saveBusy, setSaveBusy] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('');

    const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';

    const fetchProfile = useCallback(async () => {
        const res = await fetch(`${apiBaseUrl}/api/customer-portal/profile`, { credentials: 'include' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status} `);
        }
        const data = await res.json();
        setProfile(data);
        setProfileDraft(data);
    }, [apiBaseUrl]);

    const fetchServices = useCallback(async () => {
        const res = await fetch(`${apiBaseUrl}/api/customer-portal/services`, { credentials: 'include' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status} `);
        }
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
    }, [apiBaseUrl]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        setSaveMessage('');
        try {
            await Promise.all([fetchProfile(), fetchServices()]);
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại sau.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [fetchProfile, fetchServices]);

    const saveProfile = useCallback(async () => {
        if (!profileDraft) return;

        const name = profileDraft.name.trim();
        if (!name) {
            setSaveMessage('Vui lòng nhập họ và tên.');
            return;
        }

        setSaveBusy(true);
        setSaveMessage('');
        try {
            const payload = {
                name,
                phone: profileDraft.phone,
                email: profileDraft.email,
                company: profileDraft.company,
                website: profileDraft.website,
                zalo_fb: profileDraft.zalo_fb,
            };

            const res = await fetch(`${apiBaseUrl}/api/customer-portal/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            const updated = (await res.json()) as CustomerProfile;
            setProfile(updated);
            setProfileDraft(updated);
            setIsEditingProfile(false);
            setSaveMessage('Đã lưu thay đổi.');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Không thể lưu thay đổi.';
            setSaveMessage(message);
        } finally {
            setSaveBusy(false);
        }
    }, [apiBaseUrl, profileDraft]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getServiceStatus = (value?: string) => {
        const key = String(value ?? '').trim().toLowerCase();
        if (!key) {
            return { label: 'Chưa xử lý', className: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200' };
        }

        if (['xong', 'done', 'hoanthanh', 'hoàn thành', 'completed'].includes(key)) {
            return { label: value ?? 'Xong', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
        }

        if (['danglam', 'đang làm', 'inprogress', 'in progress', 'processing'].includes(key)) {
            return { label: value ?? 'Đang làm', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
        }

        if (['tamngung', 'tạm ngưng', 'paused', 'hold', 'onhold'].includes(key)) {
            return { label: value ?? 'Tạm ngưng', className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' };
        }

        return { label: value ?? String(value), className: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200' };
    };

    const formatMoney = (value: number | undefined | null) => {
        const n = Number(value ?? 0);
        if (!Number.isFinite(n)) return formatCurrency(0);
        return formatCurrency(n);
    };

    if (loading) {
        return (
            <div className="w-[90%] mx-auto p-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="h-7 w-72 bg-gray-200 rounded animate-pulse" />
                            <div className="mt-3 h-4 w-96 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-24 rounded-xl bg-gray-50 border border-gray-200 animate-pulse" />
                        <div className="h-24 rounded-xl bg-gray-50 border border-gray-200 animate-pulse" />
                        <div className="h-24 rounded-xl bg-gray-50 border border-gray-200 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-[90%] mx-auto p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                    <div className="font-semibold">Không thể tải dữ liệu</div>
                    <div className="mt-1 text-sm">{error}</div>
                    <button
                        type="button"
                        className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        onClick={loadData}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[90%] mx-auto p-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.7),transparent_60%)]" />

                    <div className="relative p-6 md:p-8 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                                    Customer Portal
                                </div>
                                <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
                                    {profile?.company ? profile.company : 'Cổng thông tin khách hàng'}
                                </h1>
                                <p className="mt-2 text-white/90 text-sm md:text-base">
                                    {profile?.name ? `Xin chào, ${profile.name}.` : 'Theo dõi thông tin cá nhân và dịch vụ của bạn.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="shrink-0 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/20"
                                onClick={loadData}
                            >
                                Tải lại
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-xl bg-white/12 p-4 ring-1 ring-white/20">
                                <div className="text-xs text-white/80">Mã khách hàng</div>
                                <div className="mt-1 font-semibold">{profile?.ma_kh || '-'}</div>
                            </div>
                            <div className="rounded-xl bg-white/12 p-4 ring-1 ring-white/20">
                                <div className="text-xs text-white/80">Email</div>
                                <div className="mt-1 font-semibold truncate">{profile?.email || '-'}</div>
                            </div>
                            <div className="rounded-xl bg-white/12 p-4 ring-1 ring-white/20">
                                <div className="text-xs text-white/80">Số dịch vụ</div>
                                <div className="mt-1 font-semibold">{services.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 md:px-8 pt-5">
                    <div className="inline-flex rounded-xl bg-gray-50 p-1 ring-1 ring-gray-200">
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'profile'
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Thông tin cá nhân
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'services'
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            onClick={() => setActiveTab('services')}
                        >
                            Dịch vụ
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 md:px-8 pb-8 pt-6">
                    {activeTab === 'profile' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Thông tin</div>
                                        <div className="mt-1 text-xs text-gray-500">Cập nhật từ hệ thống</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {saveMessage ? (
                                            <div className={`text-xs ${saveMessage === 'Đã lưu thay đổi.' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {saveMessage}
                                            </div>
                                        ) : null}

                                        {!isEditingProfile ? (
                                            <button
                                                type="button"
                                                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                                                onClick={() => {
                                                    setSaveMessage('');
                                                    setIsEditingProfile(true);
                                                    setProfileDraft(profile);
                                                }}
                                            >
                                                Chỉnh sửa
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60"
                                                    disabled={saveBusy}
                                                    onClick={() => {
                                                        setSaveMessage('');
                                                        setIsEditingProfile(false);
                                                        setProfileDraft(profile);
                                                    }}
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                                                    disabled={saveBusy}
                                                    onClick={saveProfile}
                                                >
                                                    {saveBusy ? 'Đang lưu...' : 'Lưu'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                                        <div className="text-xs text-gray-500">Họ và tên</div>
                                        {isEditingProfile ? (
                                            <input
                                                value={profileDraft?.name ?? ''}
                                                onChange={(e) => setProfileDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                                                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-600"
                                                placeholder="Họ và tên"
                                            />
                                        ) : (
                                            <div className="mt-1 font-semibold text-gray-900">{profile?.name || '-'}</div>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                                        <div className="text-xs text-gray-500">Số điện thoại</div>
                                        {isEditingProfile ? (
                                            <input
                                                value={profileDraft?.phone ?? ''}
                                                onChange={(e) => setProfileDraft((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                                                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-600"
                                                placeholder="Số điện thoại"
                                            />
                                        ) : (
                                            <div className="mt-1 font-semibold text-gray-900">{profile?.phone || '-'}</div>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                                        <div className="text-xs text-gray-500">Email</div>
                                        {isEditingProfile ? (
                                            <input
                                                type="email"
                                                value={profileDraft?.email ?? ''}
                                                onChange={(e) => setProfileDraft((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                                                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-600"
                                                placeholder="Email"
                                            />
                                        ) : (
                                            <div className="mt-1 font-semibold text-gray-900 break-words">{profile?.email || '-'}</div>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                                        <div className="text-xs text-gray-500">Zalo/Facebook</div>
                                        {isEditingProfile ? (
                                            <input
                                                value={profileDraft?.zalo_fb ?? ''}
                                                onChange={(e) => setProfileDraft((prev) => (prev ? { ...prev, zalo_fb: e.target.value } : prev))}
                                                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-600"
                                                placeholder="Zalo / Facebook"
                                            />
                                        ) : (
                                            <div className="mt-1 font-semibold text-gray-900 break-words">{profile?.zalo_fb || '-'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                <div className="text-sm font-semibold text-gray-900">Thông tin thêm</div>
                                <div className="mt-5 space-y-4">
                                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                                        <div className="text-xs text-gray-500">Công ty</div>
                                        {isEditingProfile ? (
                                            <input
                                                value={profileDraft?.company ?? ''}
                                                onChange={(e) => setProfileDraft((prev) => (prev ? { ...prev, company: e.target.value } : prev))}
                                                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-600"
                                                placeholder="Công ty"
                                            />
                                        ) : (
                                            <div className="mt-1 font-semibold text-gray-900">{profile?.company || '-'}</div>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                                        <div className="text-xs text-gray-500">Website</div>
                                        {isEditingProfile ? (
                                            <input
                                                value={profileDraft?.website ?? ''}
                                                onChange={(e) => setProfileDraft((prev) => (prev ? { ...prev, website: e.target.value } : prev))}
                                                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-600"
                                                placeholder="https://..."
                                            />
                                        ) : (
                                            <div className="mt-1 font-semibold">
                                                {profile?.website ? (
                                                    <a
                                                        href={profile.website}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-teal-700 hover:text-teal-800 underline underline-offset-4 break-words"
                                                    >
                                                        {profile.website}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-900">-</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">Danh sách dịch vụ</div>
                                    <div className="mt-1 text-xs text-gray-500">Hiển thị các dự án/dịch vụ liên quan</div>
                                </div>
                                <div className="text-sm text-gray-600">Tổng: <span className="font-semibold text-gray-900">{services.length}</span></div>
                            </div>

                            {services.length === 0 ? (
                                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center">
                                    <div className="text-gray-900 font-semibold">Chưa có dịch vụ nào</div>
                                    <div className="mt-1 text-sm text-gray-500">Nếu bạn vừa ký hợp đồng, dữ liệu có thể cần thời gian đồng bộ.</div>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile cards */}
                                    <div className="grid grid-cols-1 md:hidden gap-3">
                                        {services.map((project) => {
                                            const status = getServiceStatus(project.trang_thai_trien_khai);
                                            const total = Number(project.phi_dich_vu ?? 0) + Number(project.phat_sinh ?? 0);
                                            return (
                                                <div key={project.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-xs text-gray-500">Mã dự án</div>
                                                            <div className="mt-1 font-semibold text-gray-900">{project.ma_du_an}</div>
                                                        </div>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 text-sm text-gray-700">
                                                        <div className="font-medium text-gray-900 truncate">{project.website || project.ten_khach}</div>
                                                        <div className="mt-1 text-gray-600">{project.san_pham_dv}</div>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                                        <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
                                                            <div className="text-[11px] text-gray-500">Ngày tạo</div>
                                                            <div className="mt-1 text-sm font-semibold text-gray-900">{project.ngay_tao ? formatDate(project.ngay_tao) : '-'}</div>
                                                        </div>
                                                        <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
                                                            <div className="text-[11px] text-gray-500">Tổng phí</div>
                                                            <div className="mt-1 text-sm font-semibold text-gray-900">{formatMoney(total)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Desktop table */}
                                    <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                        <div className="overflow-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã dự án</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên dự án/Website</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng phí</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {services.map((project) => {
                                                        const status = getServiceStatus(project.trang_thai_trien_khai);
                                                        const total = Number(project.phi_dich_vu ?? 0) + Number(project.phat_sinh ?? 0);
                                                        return (
                                                            <tr key={project.id} className="hover:bg-gray-50/60">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{project.ma_du_an}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                    <div className="font-medium text-gray-900 max-w-[420px] truncate">{project.website || project.ten_khach}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.san_pham_dv}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.ngay_tao ? formatDate(project.ngay_tao) : '-'}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatMoney(total)}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                                                                        {status.label}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
