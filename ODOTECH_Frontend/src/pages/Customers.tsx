import { useEffect, useMemo, useState } from 'react';
import CustomerDashboard from '../components/customersDashboard/CustomerDashboard';
import CustomerDetail from '../components/customersDashboard/CustomerDetail';
import type { Customer } from '../components/customersDashboard/interface/types';
import type { Account } from '../components/projectsDasboard/interface/type';
import { buildAuthHeaders, getTokenUser, normalizeRole, type CanonicalRole } from '../utils/auth';

type ToastType = 'success' | 'error';
type ToastState = { open: boolean; type: ToastType; message: string };

export default function Customers() {
    const role: CanonicalRole = useMemo(() => normalizeRole(getTokenUser()?.role), []);
    const canView = !(role === 'dev' || role === 'dev_manager' || role === 'head_tech');
    const readOnly = role === 'support';

    const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', message: '' });

    const [accounts, setAccounts] = useState<Account[]>([]);

    const [filters, setFilters] = useState<{
        q: string;
        nguon_khach: string;
        sale_id: string;
    }>({ q: '', nguon_khach: '', sale_id: '' });

    const [selectedSaleTab, setSelectedSaleTab] = useState<string>('');

    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    const showToast = (type: ToastType, message: string) => {
        setToast({ open: false, type, message });
        setTimeout(() => {
            setToast({ open: true, type, message });
            setTimeout(() => {
                setToast((prev) => ({ ...prev, open: false }));
            }, 3000);
        }, 100);
    };

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

    const loadCustomers = async (opts: { q: string; nguon_khach: string; sale_id: string }) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (opts.q.trim()) params.set('q', opts.q.trim());
            if (opts.nguon_khach) params.set('nguon_khach', opts.nguon_khach);
            if (opts.sale_id) params.set('sale_id', opts.sale_id);
            const qs = params.toString();

            const res = await fetch(`${apiBaseUrl}/api/customers${qs ? `?${qs}` : ''}`, { headers: buildAuthHeaders() });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const json = await res.json();
            const items = Array.isArray(json) ? json : (json.items ?? []);
            setCustomers(items);
        } catch (e: unknown) {
            showToast('error', e instanceof Error ? e.message : 'Không tải được dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canView) return;
        void loadCustomers(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBaseUrl]);

    useEffect(() => {
        if (!canView) return;
        // Load accounts for sale tabs
        if (!(role === 'sales_manager' || role === 'head_sales' || role === 'admin' || role === 'support')) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000&offset=0`, { headers: buildAuthHeaders() });
                if (!res.ok) throw new Error(await readErrorMessage(res));
                const json = (await res.json()) as { items?: Account[] } | Account[];
                const items = Array.isArray(json) ? json : (json.items ?? []);
                if (!cancelled) setAccounts(items);
            } catch {
                if (!cancelled) setAccounts([]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [apiBaseUrl, canView, role]);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setView('detail');
    };

    const handleFilter = async (next: {
        q: string;
        nguon_khach: string;
        sale_id: string;
    }) => {
        setFilters(next);
        await loadCustomers(next);
    };

    const handleSave = async (data: Customer) => {
        if (readOnly) {
            showToast('error', 'Tài khoản chỉ có quyền xem');
            return;
        }
        setLoading(true);
        try {
            const url = `${apiBaseUrl}/api/customers/${data.ma_kh}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    ten_khach: data.ten_khach,
                    sdt: data.sdt,
                    zalo_fb: data.zalo_fb,
                    nguon_khach: data.nguon_khach,
                    website: data.website,
                }),
            });
            if (!res.ok) {
                const message = await readErrorMessage(res);
                throw new Error(message);
            }
            const updated = (await res.json()) as Customer;
            setSelectedCustomer(updated);
            setCustomers((prev) => prev.map((c) => (c.ma_kh === updated.ma_kh ? updated : c)));
            showToast('success', 'Cập nhật thành công');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Không lưu được dữ liệu';
            showToast('error', `Thao tác thất bại: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const saleTabs = useMemo(() => {
        if (!(role === 'sales_manager' || role === 'head_sales' || role === 'admin' || role === 'support')) return [];

        const fromCustomers = new Set<string>();
        for (const c of customers) {
            const s = String(c.sale_id || '').trim();
            if (s) fromCustomers.add(s);
        }

        if (role === 'head_sales' || role === 'admin' || role === 'support') {
            const managers = accounts
                .filter((a) => normalizeRole(a.role_system) === 'sales_manager')
                .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
            const sales = accounts
                .filter((a) => normalizeRole(a.role_system) === 'sale')
                .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));

            const managerIds = new Set(managers.map((a) => String(a.id)));
            const saleIds = new Set(sales.map((a) => String(a.id)));

            for (const v of fromCustomers) {
                if (!managerIds.has(v) && !saleIds.has(v)) saleIds.add(v);
            }

            return [...Array.from(managerIds), ...Array.from(saleIds)];
        }

        return Array.from(fromCustomers).sort((a, b) => a.localeCompare(b, 'vi'));
    }, [accounts, customers, role]);

    if (!canView) {
        return <div className="p-6 text-gray-700">Bạn không có quyền truy cập trang Quản lý khách hàng.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {toast.message && (
                <div
                    className={`fixed top-4 right-4 z-50 transition-opacity duration-200 ${toast.open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    role="status"
                    aria-live="polite"
                >
                    <div
                        className={`rounded border px-4 py-3 shadow-md ${toast.type === 'success'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                    >
                        {toast.message}
                    </div>
                </div>
            )}

            {view === 'dashboard' ? (
                loading ? (
                    <div className="p-6 text-gray-600">Đang tải dữ liệu...</div>
                ) : (
                    <CustomerDashboard
                        customers={customers}
                        onSelect={handleSelectCustomer}
                        onFilter={handleFilter}
                        saleTabs={saleTabs}
                        selectedSaleTab={selectedSaleTab}
                        onSelectSaleTab={setSelectedSaleTab}
                        accounts={accounts}
                    />
                )
            ) : (
                selectedCustomer && (
                    <CustomerDetail
                        customer={selectedCustomer}
                        onBack={() => setView('dashboard')}
                        onSave={handleSave}
                        readOnly={readOnly}
                    />
                )
            )}
        </div>
    );
}
