import { useEffect, useMemo, useState } from 'react';
import {
  Globe, Calendar, AlertTriangle, CreditCard, Search, X,
  Shield, CheckCircle2, User, Server, Key, FileText, Save, Eye, EyeOff
} from 'lucide-react';

import StatCard from '../components/accountsDasboard/StatCard';
import { getTokenUser, normalizeRole, type CanonicalRole } from '../utils/auth';

type RenewalKind = 'domain' | 'hosting' | 'email' | 'manage' | 'content' | 'ads';
type DueStatus = '' | 'active' | 'expiring' | 'expired';

type AccountDirectoryItem = {
  id: string | number;
  username: string;
  name: string;
  email?: string;
  role_system?: string;
  status?: string;
};

type RenewalItem = {
  sales_project_id: number;
  ma_kh: string;
  ma_du_an: string;
  ten_khach: string;
  website: string;
  sale_id: string;
  pm_id: string;
  kind: RenewalKind;
  ngay_dang_ky: string;
  ngay_gia_han: string;
  amount: number | null;
  provider: string;
  management_place: string;
  management_url: string;
  login_username: string;
  has_password: boolean;
  hosting_used_mb: number | null;
  hosting_limit_mb: number | null;
  due_status: DueStatus;
};

function formatCurrencyVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

function safeText(v: unknown): string {
  return String(v ?? '').trim();
}

function resolvePersonName(id: unknown, nameMap: Record<string, string>) {
  const key = safeText(id);
  if (!key) return '-';
  return nameMap[key] || key;
}

function kindLabel(kind: RenewalKind) {
  if (kind === 'domain') return 'Tên miền';
  if (kind === 'hosting') return 'Hosting';
  if (kind === 'email') return 'Email';
  if (kind === 'manage') return 'Quản lý';
  if (kind === 'content') return 'Content';
  return 'Quảng cáo';
}

function dueLabel(status: DueStatus) {
  if (status === 'active') return 'Đang hiệu lực';
  if (status === 'expiring') return 'Sắp hết hạn';
  if (status === 'expired') return 'Đã hết hạn';
  return '-';
}

function dueClassName(status: DueStatus) {
  if (status === 'active') return 'bg-teal-50 text-teal-700 border-teal-200';
  if (status === 'expiring') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  if (status === 'expired') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function keyOf(item: Pick<RenewalItem, 'sales_project_id' | 'kind'>) {
  return `${item.sales_project_id}-${item.kind}`;
}

export default function Renewals() {
  const [role, setRole] = useState<CanonicalRole>('unknown');
  const canSeeMoney = !(role === 'dev' || role === 'dev_manager' || role === 'head_tech');
  const readOnly = role === 'support' || role === 'dev' || role === 'dev_manager' || role === 'head_tech';
  const canEditMeta = !readOnly && (role === 'admin' || role === 'sale' || role === 'sales_manager' || role === 'head_sales');
  const canGetPass = role === 'admin' || role === 'dev' || role === 'dev_manager' || role === 'head_tech';

  useEffect(() => {
    (async () => {
      const user = await getTokenUser();
      setRole(normalizeRole(user?.role));
    })();
  }, []);

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RenewalItem[]>([]);

  const [saleNameById, setSaleNameById] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<'' | RenewalKind>('');
  const [filterDue, setFilterDue] = useState<'' | DueStatus>('');

  const [activeSaleTab, setActiveSaleTab] = useState<string>('');
  const [activeManagerTab, setActiveManagerTab] = useState<string>('');

  const [selectedKey, setSelectedKey] = useState<string>('');

  const [editProvider, setEditProvider] = useState('');
  const [editManagementPlace, setEditManagementPlace] = useState('');
  const [editManagementUrl, setEditManagementUrl] = useState('');
  const [editLoginUsername, setEditLoginUsername] = useState('');
  const [editLoginPassword, setEditLoginPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editRenewalDate, setEditRenewalDate] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editHostingUsedMb, setEditHostingUsedMb] = useState<string>('');
  const [editHostingLimitMb, setEditHostingLimitMb] = useState<string>('');

  const [fetchedPassword, setFetchedPassword] = useState<string>('');
  const [fetchingPassword, setFetchingPassword] = useState<boolean>(false);

  const readErrorMessage = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        const json = (await res.json()) as { message?: string };
        return json?.message || `HTTP ${res.status}`;
      }
    } catch {
      // ignore
    }
    return `HTTP ${res.status}`;
  };

  const loadSaleDirectory = async () => {
    try {
      // Use /api/accounts to ensure we get IDs
      const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000`, { credentials: 'include' });
      if (!res.ok) return;

      const json = (await res.json()) as { items?: AccountDirectoryItem[] } | AccountDirectoryItem[];
      const list = Array.isArray(json) ? json : (json.items || []);

      const map: Record<string, string> = {};
      for (const acc of list) {
        const id = safeText(acc?.id);
        const username = safeText(acc?.username);
        const name = safeText(acc?.name);
        const email = safeText(acc?.email);

        if (id && name) map[id] = name;
        if (username && name) map[username] = name;
        if (email && name) map[email] = name;
        if (name) map[name] = name;
      }
      setSaleNameById(map);
    } catch {
      // best-effort only
    }
  };

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${apiBaseUrl}/api/renewals/items`);
      url.searchParams.set('limit', '200');
      url.searchParams.set('offset', '0');

      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg);
      }
      const json = (await res.json()) as { items?: RenewalItem[] };
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu gia hạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    void loadSaleDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  const saleTabs = useMemo(() => {
    const ids = Array.from(new Set(items.map((i) => safeText(i.sale_id)).filter(Boolean)));
    return ids.sort((a, b) => resolvePersonName(a, saleNameById).localeCompare(resolvePersonName(b, saleNameById), 'vi'));
  }, [items, saleNameById]);

  const managerTabs = useMemo(() => {
    const ids = Array.from(new Set(items.map((i) => safeText(i.pm_id)).filter(Boolean)));
    return ids.sort((a, b) => resolvePersonName(a, saleNameById).localeCompare(resolvePersonName(b, saleNameById), 'vi'));
  }, [items, saleNameById]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const bySearch = (item: RenewalItem) => {
      if (!term) return true;
      const hay = [
        item.ma_kh,
        item.ma_du_an,
        item.ten_khach,
        item.website,
        item.sale_id,
        resolvePersonName(item.sale_id, saleNameById),
        item.pm_id,
        resolvePersonName(item.pm_id, saleNameById),
        item.provider,
        item.management_place,
        item.login_username,
        kindLabel(item.kind),
      ]
        .map((s) => safeText(s).toLowerCase())
        .join(' | ');
      return hay.includes(term);
    };

    return items
      .filter((i) => (filterKind ? i.kind === filterKind : true))
      .filter((i) => (filterDue ? i.due_status === filterDue : true))
      .filter((i) => (role === 'head_sales' && activeManagerTab ? safeText(i.pm_id) === activeManagerTab : true))
      .filter((i) => (activeSaleTab ? safeText(i.sale_id) === activeSaleTab : true))
      .filter(bySearch);
  }, [items, searchTerm, filterKind, filterDue, role, activeManagerTab, activeSaleTab, saleNameById]);

  const selectedItem = useMemo(() => {
    if (!selectedKey) return null;
    return filteredItems.find((i) => keyOf(i) === selectedKey) ?? null;
  }, [filteredItems, selectedKey]);

  useEffect(() => {
    if (!selectedItem) {
      setEditProvider('');
      setEditManagementPlace('');
      setEditManagementUrl('');
      setEditLoginUsername('');
      setEditLoginPassword('');
      setEditRenewalDate('');
      setEditAmount('');
      setEditHostingUsedMb('');
      setEditHostingLimitMb('');
      setEditHostingLimitMb('');
      setFetchedPassword('');
      setShowNewPassword(false);
      return;
    }

    setEditProvider(selectedItem.provider || '');
    setEditManagementPlace(selectedItem.management_place || '');
    setEditManagementUrl(selectedItem.management_url || '');
    setEditLoginUsername(selectedItem.login_username || '');
    setEditLoginPassword('');
    setEditRenewalDate(selectedItem.ngay_gia_han || '');
    setEditAmount(selectedItem.amount === null || selectedItem.amount === undefined ? '' : String(selectedItem.amount));
    setEditHostingUsedMb(selectedItem.hosting_used_mb === null || selectedItem.hosting_used_mb === undefined ? '' : String(selectedItem.hosting_used_mb));
    setEditHostingLimitMb(selectedItem.hosting_limit_mb === null || selectedItem.hosting_limit_mb === undefined ? '' : String(selectedItem.hosting_limit_mb));
    setFetchedPassword('');
    setShowNewPassword(false);
  }, [selectedItem]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const expiring = filteredItems.filter((r) => r.due_status === 'expiring').length;
    const expired = filteredItems.filter((r) => r.due_status === 'expired').length;
    const totalAmount = canSeeMoney
      ? filteredItems.reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0)
      : null;
    return { total, expiring, expired, totalAmount };
  }, [filteredItems, canSeeMoney]);

  const saveMeta = async () => {
    if (!selectedItem) return;
    if (!canEditMeta) return;

    const url = `${apiBaseUrl}/api/renewals/packages/${selectedItem.sales_project_id}/${selectedItem.kind}`;

    const body: Record<string, unknown> = {
      provider: editProvider,
      management_place: editManagementPlace,
      management_url: editManagementUrl,
      login_username: editLoginUsername,
      renewal_date: editRenewalDate,
      amount: editAmount.trim() === '' ? null : Number(editAmount),
    };

    if (selectedItem.kind === 'hosting') {
      body.hosting_used_mb = editHostingUsedMb.trim() === '' ? null : Number(editHostingUsedMb);
      body.hosting_limit_mb = editHostingLimitMb.trim() === '' ? null : Number(editHostingLimitMb);
    }

    if (editLoginPassword.trim() !== '') {
      body.login_password = editLoginPassword;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const msg = await readErrorMessage(res);
      throw new Error(msg);
    }

    await loadItems();
  };

  const getPass = async () => {
    if (!selectedItem) return;
    if (!canGetPass) return;
    setFetchingPassword(true);
    setFetchedPassword('');
    try {
      const url = `${apiBaseUrl}/api/renewals/packages/${selectedItem.sales_project_id}/${selectedItem.kind}/credentials`;
      const res = await fetch(url, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg);
      }
      const json = (await res.json()) as { login_password?: string; login_username?: string };
      setFetchedPassword(safeText(json.login_password));
      if (safeText(json.login_username)) setEditLoginUsername(safeText(json.login_username));
    } finally {
      setFetchingPassword(false);
    }
  };

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header & Stats */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý gia hạn dịch vụ</h1>
              <p className="text-sm text-gray-500 mt-1">Theo dõi thời hạn hosting, domain và các dịch vụ khác</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tổng dịch vụ"
              value={stats.total}
              color="blue"
              icon={<Globe size={20} />}
            />
            <StatCard
              title="Sắp hết hạn"
              value={stats.expiring}
              color="orange"
              icon={<Calendar size={20} />}
            />
            <StatCard
              title="Đã hết hạn"
              value={stats.expired}
              color="red"
              icon={<AlertTriangle size={20} />}
            />
            {canSeeMoney && (
              <StatCard
                title="Tổng giá trị gia hạn"
                value={formatCurrencyVnd(stats.totalAmount ?? 0).replace(' đ', '')}
                suffix="VND"
                color="green"
                icon={<CreditCard size={20} />}
              />
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
          </div>
        )}
        {/* content area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left Column: List & Filters */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm (Mã KH, Domain, Tên khách, Sale...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  />
                </div>
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200 relative overflow-hidden">
                  {activeSaleTab && (
                    <button onClick={() => setActiveSaleTab('')} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-white shadow-sm rounded border border-gray-200 mr-2">
                      {resolvePersonName(activeSaleTab, saleNameById)} <X size={12} />
                    </button>
                  )}
                  {activeManagerTab && (
                    <button onClick={() => setActiveManagerTab('')} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-white shadow-sm rounded border border-gray-200 mr-2">
                      QL: {resolvePersonName(activeManagerTab, saleNameById)} <X size={12} />
                    </button>
                  )}
                  <div className="flex items-center gap-2 px-2">
                    <select
                      value={filterKind}
                      onChange={(e) => setFilterKind(e.target.value as '' | RenewalKind)}
                      className="h-8 bg-transparent border-none text-sm text-gray-700 outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="domain">Tên miền</option>
                      <option value="hosting">Hosting</option>
                      <option value="email">Email</option>
                      <option value="manage">Quản lý</option>
                      <option value="content">Content</option>
                      <option value="ads">Quảng cáo</option>
                    </select>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <select
                      value={filterDue}
                      onChange={(e) => setFilterDue(e.target.value as '' | DueStatus)}
                      className="h-8 bg-transparent border-none text-sm text-gray-700 outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="active">Đang hiệu lực</option>
                      <option value="expiring">Sắp hết hạn</option>
                      <option value="expired">Đã hết hạn</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Filters for Sales Managers */}
              {(role === 'head_sales' && managerTabs.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500 py-1">Quản lý:</span>
                  {managerTabs.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setActiveManagerTab(m); setActiveSaleTab(''); }}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${activeManagerTab === m ? 'bg-teal-100 text-teal-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {resolvePersonName(m, saleNameById)}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Filters for Sales */}
              {((role === 'sales_manager' || role === 'head_sales') && saleTabs.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-gray-500 py-1">Sale:</span>
                  {saleTabs
                    .filter((s) => (role === 'head_sales' && activeManagerTab ? filteredItems.some((i) => safeText(i.pm_id) === activeManagerTab && safeText(i.sale_id) === s) : true))
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => setActiveSaleTab(s)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${activeSaleTab === s ? 'bg-teal-100 text-teal-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {resolvePersonName(s, saleNameById)}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-[500px]">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Dịch vụ</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Mã DA / KH</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Sale / QL</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Ngày gia hạn</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                    ) : filteredItems.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-500">Không tìm thấy dữ liệu phù hợp.</td></tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isSelected = selectedKey === keyOf(item);
                        return (
                          <tr
                            key={keyOf(item)}
                            onClick={() => setSelectedKey(keyOf(item))}
                            className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-teal-50 hover:bg-teal-100/50' : ''}`}
                          >
                            <td className="py-3 px-4 border-r border-transparent">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                                                        ${item.kind === 'domain' ? 'bg-blue-100 text-blue-600' :
                                    item.kind === 'hosting' ? 'bg-orange-100 text-orange-600' :
                                      'bg-gray-100 text-gray-600'
                                  }`}>
                                  {item.kind === 'domain' ? 'DOM' : item.kind === 'hosting' ? 'HOST' : item.kind.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 truncate max-w-[180px]" title={item.website}>{item.website || 'Không có website'}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    {kindLabel(item.kind)} • {item.provider}
                                    {item.has_password && <Key size={10} className="text-yellow-600 ml-1" />}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-[120px]">
                              <div className="text-sm font-medium text-gray-900">{item.ma_du_an}</div>
                              <div className="text-xs text-gray-500 truncate" title={item.ma_kh}>{item.ma_kh}</div>
                            </td>
                            <td className="py-3 px-4 max-w-[150px]">
                              <div className="text-sm text-gray-900 truncate" title={resolvePersonName(item.sale_id, saleNameById)}>
                                {resolvePersonName(item.sale_id, saleNameById)}
                              </div>
                              {item.pm_id && (
                                <div className="text-xs text-gray-500 flex items-center gap-1 truncate" title={resolvePersonName(item.pm_id, saleNameById)}>
                                  <Shield size={10} /> {resolvePersonName(item.pm_id, saleNameById)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {item.ngay_gia_han}
                              {canSeeMoney && typeof item.amount === 'number' && (
                                <div className="text-xs text-gray-500 mt-0.5">{formatCurrencyVnd(item.amount)}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${dueClassName(item.due_status)}`}>
                                {dueLabel(item.due_status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Details Panel */}
          <div className="xl:col-span-1">
            <div className={`bg-white rounded-xl border border-gray-200 shadow-xl lg:shadow-sm sticky top-6 overflow-hidden transition-all duration-300 ${selectedItem ? 'opacity-100' : 'opacity-75 grayscale'}`}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Chi tiết dịch vụ</h3>
                  {selectedItem ? (
                    <p className="text-sm text-teal-600 font-medium mt-0.5 flex items-center gap-1">
                      <CheckCircle2 size={14} /> {selectedItem.ma_du_an}
                    </p>
                  ) : <p className="text-sm text-gray-500 mt-0.5">Chọn một dòng để xem</p>}
                </div>
                {selectedItem && (
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${dueClassName(selectedItem.due_status)}`}>
                    {dueLabel(selectedItem.due_status)}
                  </span>
                )}
              </div>

              {/* Body */}
              {selectedItem ? (
                <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User size={12} /> Khách hàng
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Mã KH:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedItem.ma_kh}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tên:</span>
                        <span className="text-sm font-medium text-gray-900 text-right">{selectedItem.ten_khach || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Website:</span>
                        <a href={selectedItem.website?.startsWith('http') ? selectedItem.website : `https://${selectedItem.website}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate max-w-[150px]">{selectedItem.website || '-'}</a>
                      </div>
                    </div>
                  </div>

                  {/* Service Info Form */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Server size={12} /> Thông tin dịch vụ
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Ngày đăng ký</label>
                        <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">{selectedItem.ngay_dang_ky}</div>
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Ngày gia hạn</label>
                        {canEditMeta ? (
                          <input type="date" value={editRenewalDate} onChange={(e) => setEditRenewalDate(e.target.value)} className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" />
                        ) : <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">{selectedItem.ngay_gia_han}</div>}
                      </div>
                    </div>

                    {canSeeMoney && (
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Chi phí gia hạn</label>
                        {canEditMeta ? (
                          <div className="relative">
                            <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full h-9 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" placeholder="0" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">VND</span>
                          </div>
                        ) : <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 font-medium">{formatCurrencyVnd(Number(selectedItem.amount))}</div>}
                      </div>
                    )}

                    {/* Provider & Management */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Nhà cung cấp</label>
                        {canEditMeta ? <input type="text" value={editProvider} onChange={(e) => setEditProvider(e.target.value)} className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 outline-none" placeholder="VD: PA Việt Nam..." />
                          : <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">{selectedItem.provider || '-'}</div>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Link quản lý</label>
                        {canEditMeta ? <input type="text" value={editManagementUrl} onChange={(e) => setEditManagementUrl(e.target.value)} className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 outline-none" placeholder="https://..." />
                          : <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 truncate">{selectedItem.management_url || '-'}</div>}
                      </div>
                    </div>

                    {/* Auth Info */}
                    <div className="bg-yellow-50/50 rounded-lg p-3 border border-yellow-100">
                      <h5 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-1"><Key size={12} /> Thông tin đăng nhập</h5>
                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase">Username</div>
                          {canEditMeta ? <input type="text" value={editLoginUsername} onChange={(e) => setEditLoginUsername(e.target.value)} className="w-full h-8 px-2 text-sm bg-white border border-yellow-200 rounded focus:border-yellow-400 outline-none mt-1" />
                            : <div className="bg-white px-2 py-1 rounded border border-yellow-100 text-sm">{selectedItem.login_username || '-'}</div>}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] text-gray-500 uppercase">Password</div>
                            {canGetPass && (
                              <button onClick={() => void getPass()} disabled={fetchingPassword || !selectedItem.has_password} className="text-[10px] font-bold text-teal-600 hover:underline disabled:opacity-50">
                                {fetchingPassword ? 'Loading...' : 'SHOW PASS'}
                              </button>
                            )}
                          </div>
                          <div className="bg-white px-2 py-1.5 rounded border border-yellow-100 text-sm font-mono flex items-center justify-between">
                            <span>{fetchedPassword || (selectedItem.has_password ? '••••••••' : 'Chưa có')}</span>
                          </div>
                          {canEditMeta && (
                            <div className="relative mt-2">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={editLoginPassword}
                                onChange={(e) => setEditLoginPassword(e.target.value)}
                                className="w-full h-8 pl-2 pr-8 text-sm bg-white border border-yellow-200 rounded focus:border-yellow-400 outline-none"
                                placeholder="Nhập để đổi pass mới"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              >
                                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hosting Specific */}
                    {selectedItem.kind === 'hosting' && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Đã dùng (MB)</label>
                          {canEditMeta ? <input type="number" value={editHostingUsedMb} onChange={(e) => setEditHostingUsedMb(e.target.value)} className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded outline-none" placeholder="0" />
                            : <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">{selectedItem.hosting_used_mb ?? '-'}</div>}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Giới hạn (MB)</label>
                          {canEditMeta ? <input type="number" value={editHostingLimitMb} onChange={(e) => setEditHostingLimitMb(e.target.value)} className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded outline-none" placeholder="0" />
                            : <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">{selectedItem.hosting_limit_mb ?? '-'}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center text-gray-400 h-64">
                  <div className="p-4 bg-gray-50 rounded-full mb-3">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm">Chọn một mục từ danh sách<br />để xem và chỉnh sửa thông tin.</p>
                </div>
              )}

              {/* Footer Action */}
              {selectedItem && canEditMeta && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                  <button
                    onClick={() => { void (async () => { try { await saveMeta(); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); } })(); }}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
