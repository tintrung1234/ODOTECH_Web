import { useEffect, useMemo, useRef, useState } from 'react';
import Dashboard from '../components/salesDasboard/Dashboard';
import ProjectDetail from '../components/salesDasboard/ProjectDetail';
import type { ProjectData } from '../components/salesDasboard/interface/type';
import type { StaffId } from '../components/salesDasboard/interface/type';
import type { Account } from '../components/projectsDasboard/interface/type';
import { getTokenUser, normalizeRole } from '../utils/auth';

type ToastType = 'success' | 'error';
type ToastState = { open: boolean; type: ToastType; message: string };

const createEmptyProject = (): ProjectData => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  return {
    id: 0,
    ma_kh: '',
    ma_du_an: '',
    ten_khach: '',
    sdt: '',
    zalo_fb: '',
    nguon_khach: 'FB',
    nhu_cau: '',
    san_pham_dv: '',
    website: '',

    sale_id: null,
    ky_thuat_id: null,
    pm_id: null,

    trang_thai_chot: 'DangCham',
    trang_thai_thu_tien: 'Chua',
    trang_thai_trien_khai: '',
    ngay_tao: today,
    lich_hen: '',
    ghi_chu: '',
    ngay_cham_cuoi: today,
    hinh_thuc_cham: '',

    phi_dich_vu: 0,
    phat_sinh: 0,
    ngay_doi_cuoi: '',
    so_lan_doi: 0,
    danh_sach_thanh_toan: [
      { id: Date.now() + 1, lan_thanh_toan: 1, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' },
      { id: Date.now() + 2, lan_thanh_toan: 2, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' },
      { id: Date.now() + 3, lan_thanh_toan: 3, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' },
      { id: Date.now() + 4, lan_thanh_toan: 4, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' },
      { id: Date.now() + 5, lan_thanh_toan: 5, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' },
    ],

    ngay_ban_giao: '',
    ngay_tat_toan: '',
    ly_do_lau: '',
    chi_phi_outsource: 0,

    gia_han_domain: false,
    ngay_hh_domain: '',
    phi_gh_domain: 0,

    gia_han_hosting: false,
    ngay_hh_hosting: '',
    phi_gh_hosting: 0,

    gia_han_email: false,
    ngay_hh_email: '',
    phi_gh_email: 0,

    gia_han_content: false,
    ngay_hh_content: '',
    phi_gh_content: 0,

    gia_han_ads: false,
    ngay_hh_ads: '',
    phi_gh_ads: 0,
  };
};

export default function Sales() {
  const [role, setRole] = useState<ReturnType<typeof normalizeRole>>('unknown');
  const canView = !(role === 'dev' || role === 'dev_manager' || role === 'head_tech');
  const readOnly = role === 'support';

  useEffect(() => {
    (async () => {
      const user = await getTokenUser();
      setRole(normalizeRole(user?.role));
    })();
  }, []);
  const canCreateAndEdit = !readOnly;

  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', message: '' });

  const [accounts, setAccounts] = useState<Account[]>([]);

  const toastTimersRef = useRef<{ show?: number; hide?: number }>({});

  const [filters, setFilters] = useState<{
    q: string;
    trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy';
    min_total?: number | null;
    max_total?: number | null;
  }>({ q: '', trang_thai_chot: '', min_total: null, max_total: null });

  const [listTab, setListTab] = useState<'full' | 'doi_tien' | 'dang_trien_khai'>('full');
  const [selectedSaleTab, setSelectedSaleTab] = useState<string>('');

  const normalizeDeploymentStatus = (value: unknown): '' | 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'late' => {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return '';
    const compact = raw.replace(/[\s_-]+/g, '');
    if (raw === 'not_started' || compact === 'notstarted') return 'not_started';
    if (raw === 'in_progress' || compact === 'inprogress') return 'in_progress';
    if (raw === 'on_hold' || compact === 'onhold') return 'on_hold';
    if (raw === 'completed' || compact === 'completed') return 'completed';
    if (raw === 'late' || compact === 'late') return 'late';
    // Unknown statuses are treated as empty so we don't misclassify.
    return '';
  };

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  const clearToastTimers = () => {
    if (toastTimersRef.current.show) window.clearTimeout(toastTimersRef.current.show);
    if (toastTimersRef.current.hide) window.clearTimeout(toastTimersRef.current.hide);
    toastTimersRef.current = {};
  };

  const showToast = (type: ToastType, message: string) => {
    clearToastTimers();
    setToast({ open: false, type, message });
    toastTimersRef.current.show = window.setTimeout(() => {
      setToast({ open: true, type, message });
      toastTimersRef.current.hide = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, open: false }));
      }, 3000);
    }, 500);
  };

  const clearAlerts = () => {
    setToast((prev) => ({ ...prev, open: false, message: '' }));
    clearToastTimers();
  };

  useEffect(() => {
    return () => {
      clearToastTimers();
    };
  }, []);

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

  const loadProjects = async (opts: { q: string; trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy' }) => {
    setLoading(true);
    clearAlerts();
    try {
      const params = new URLSearchParams();
      if (opts.q.trim()) params.set('q', opts.q.trim());
      if (opts.trang_thai_chot) params.set('trang_thai_chot', opts.trang_thai_chot);
      const qs = params.toString();

      const res = await fetch(`${apiBaseUrl}/api/sales/projects${qs ? `?${qs}` : ''}`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.items ?? []);

      // Fetch contract_value from Projects API, then merge into sales items.
      const codes = Array.from(
        new Set(
          (items as ProjectData[])
            .map((p) => String(p.ma_du_an || '').trim())
            .filter(Boolean)
        )
      );

      if (codes.length === 0) {
        setProjects(items);
        return;
      }

      try {
        const codesParam = encodeURIComponent(codes.join(','));
        const projRes = await fetch(`${apiBaseUrl}/api/projects/contract-values?codes=${codesParam}`, {
          credentials: 'include',
        });
        if (!projRes.ok) throw new Error(await readErrorMessage(projRes));

        const projJson = (await projRes.json()) as unknown;
        const projItems: Array<{ project_code?: unknown; contract_value?: unknown }> =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (projJson && typeof projJson === 'object' && Array.isArray((projJson as any).items))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (projJson as any).items
            : [];

        const map = new Map<string, number>();
        for (const it of projItems) {
          const code = String(it.project_code ?? '').trim();
          const val = Number(it.contract_value ?? 0);
          if (!code) continue;
          map.set(code.toLowerCase(), Number.isFinite(val) ? val : 0);
        }

        const merged = (items as ProjectData[]).map((p) => {
          const code = String(p.ma_du_an || '').trim().toLowerCase();
          const cv = map.get(code) ?? 0;
          return { ...p, contract_value: cv };
        });
        setProjects(merged);
      } catch {
        // If lookup fails, keep the list but contract_value may be 0.
        setProjects(items);
      }
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    void loadProjects(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!canView) return;
    // Roles that show sale tabs need account list to render labels.
    if (!(role === 'sales_manager' || role === 'head_sales' || role === 'admin' || role === 'support')) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000&offset=0`, { credentials: 'include' });
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

  // Backward compatibility: older data may store staff fields by name instead of id.
  // Once accounts are loaded, map name -> id so filtering/tabs use ids consistently.
  useEffect(() => {
    if (accounts.length === 0) return;

    const byName = new Map<string, number>();
    for (const a of accounts) {
      const name = String(a.name || '').trim().toLowerCase();
      const id = Number(a.id);
      if (!name) continue;
      if (!Number.isFinite(id)) continue;
      byName.set(name, id);
    }

    const maybeNameToId = (value: StaffId): StaffId => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      const raw = String(value).trim();
      if (!raw) return null;

      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n) && String(n) === raw) return n;

      const mapped = byName.get(raw.toLowerCase());
      return mapped ?? value;
    };

    setProjects((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const nextSale = maybeNameToId(p.sale_id);
        const nextPm = maybeNameToId(p.pm_id);
        const nextDev = maybeNameToId(p.ky_thuat_id);
        if (nextSale === p.sale_id && nextPm === p.pm_id && nextDev === p.ky_thuat_id) return p;
        changed = true;
        return { ...p, sale_id: nextSale, pm_id: nextPm, ky_thuat_id: nextDev };
      });
      return changed ? next : prev;
    });

    setSelectedProject((prev) => {
      if (!prev) return prev;
      const nextSale = maybeNameToId(prev.sale_id);
      const nextPm = maybeNameToId(prev.pm_id);
      const nextDev = maybeNameToId(prev.ky_thuat_id);
      if (nextSale === prev.sale_id && nextPm === prev.pm_id && nextDev === prev.ky_thuat_id) return prev;
      return { ...prev, sale_id: nextSale, pm_id: nextPm, ky_thuat_id: nextDev };
    });
  }, [accounts]);

  const handleSelectProject = (project: ProjectData) => {
    (async () => {
      setLoading(true);
      clearAlerts();
      try {
        const res = await fetch(`${apiBaseUrl}/api/sales/projects/${project.id}`, { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const detail = (await res.json()) as ProjectData;
        setSelectedProject(detail);
        setView('detail');
      } catch (e: unknown) {
        showToast('error', e instanceof Error ? e.message : 'Không tải được chi tiết dự án');
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleFilter = async (next: {
    q: string;
    trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy';
    min_total?: number | null;
    max_total?: number | null;
  }) => {
    setFilters(next);
    await loadProjects({ q: next.q, trang_thai_chot: next.trang_thai_chot });
  };

  const handleSave = async (data: ProjectData) => {
    if (!canCreateAndEdit) {
      showToast('error', 'Tài khoản chỉ có quyền xem');
      return;
    }
    setLoading(true);
    clearAlerts();
    try {
      const isCreate = !data.id || data.id <= 0;
      const url = isCreate
        ? `${apiBaseUrl}/api/sales/projects`
        : `${apiBaseUrl}/api/sales/projects/${data.id}`;
      const method = isCreate ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const message = await readErrorMessage(res);
        throw new Error(message);
      }
      const updated = (await res.json()) as ProjectData;
      setSelectedProject(updated);
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        if (!exists) return [updated, ...prev];
        return prev.map((p) => (p.id === updated.id ? updated : p));
      });
      showToast('success', isCreate ? 'Tạo Sale thành công' : 'Cập nhật thành công');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Không lưu được dữ liệu';
      showToast('error', `Thao tác thất bại: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!canCreateAndEdit) {
      showToast('error', 'Tài khoản chỉ có quyền xem');
      return;
    }
    clearAlerts();
    setSelectedProject(createEmptyProject());
    setView('detail');
  };

  const visibleProjects = useMemo(() => {
    let list = projects;

    // Sale manager / head sales / admin / support: filter by sale tab if selected.
    if (selectedSaleTab) {
      const selectedAccount = accounts.find((a) => String(a.id) === selectedSaleTab);
      const selectedRole = selectedAccount ? normalizeRole(selectedAccount.role_system) : 'unknown';

      // When selecting a sales manager (quanlysale), show projects they manage (pm_id).
      // Otherwise (sale/unknown), keep filtering by sale_id.
      if (selectedRole === 'sales_manager') {
        list = list.filter((p) => String(p.pm_id ?? '').trim() === selectedSaleTab);
      } else {
        list = list.filter((p) => String(p.sale_id ?? '').trim() === selectedSaleTab);
      }
    }

    // Money/deploy tabs.
    if (listTab === 'doi_tien') {
      list = list.filter((p) => p.trang_thai_thu_tien !== 'Du');
    } else if (listTab === 'dang_trien_khai') {
      list = list.filter((p) => {
        const st = normalizeDeploymentStatus(p.trang_thai_trien_khai);
        if (!st) return false;
        return st !== 'completed';
      });
    }

    // Price range filter: based on total fee (contract_value from Projects API + phat_sinh from Sales API)
    const minTotal = typeof filters.min_total === 'number' ? filters.min_total : null;
    const maxTotal = typeof filters.max_total === 'number' ? filters.max_total : null;
    if (minTotal !== null || maxTotal !== null) {
      list = list.filter((p) => {
        const total = Number(p.contract_value ?? 0) + Number(p.phat_sinh ?? 0);
        if (minTotal !== null && total < minTotal) return false;
        if (maxTotal !== null && total > maxTotal) return false;
        return true;
      });
    }

    return list;
  }, [accounts, filters.max_total, filters.min_total, listTab, projects, selectedSaleTab]);

  const saleTabs = useMemo(() => {
    if (!(role === 'sales_manager' || role === 'head_sales' || role === 'admin' || role === 'support')) return [];

    // Default: tabs from actual project sale_id values.
    const fromProjects = new Set<string>();
    for (const p of projects) {
      const s = String(p.sale_id || '').trim();
      if (s) fromProjects.add(s);
    }

    // Head sales/admin/support: show ALL sales managers + ALL sales (by id)
    // so each manager has a tab, and each sale has a tab.
    if (role === 'head_sales' || role === 'admin' || role === 'support') {
      const managers = accounts
        .filter((a) => normalizeRole(a.role_system) === 'sales_manager')
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
      const sales = accounts
        .filter((a) => normalizeRole(a.role_system) === 'sale')
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));

      const managerIds = new Set(managers.map((a) => String(a.id)));
      const saleIds = new Set(sales.map((a) => String(a.id)));

      // Keep any project values (e.g. removed accounts) so user can still filter.
      for (const v of fromProjects) {
        if (!managerIds.has(v) && !saleIds.has(v)) saleIds.add(v);
      }

      return [...Array.from(managerIds), ...Array.from(saleIds)];
    }

    return Array.from(fromProjects).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [accounts, projects, role]);

  useEffect(() => {
    if (!selectedSaleTab) return;
    if (saleTabs.length === 0) return;
    if (!saleTabs.includes(selectedSaleTab)) setSelectedSaleTab('');
  }, [saleTabs, selectedSaleTab]);

  const totalAmount = useMemo(() => {
    return visibleProjects.reduce((sum, p) => sum + Number(p.contract_value ?? 0) + Number(p.phat_sinh ?? 0), 0);
  }, [visibleProjects]);

  if (!canView) {
    return <div className="p-6 text-gray-700">Bạn không có quyền truy cập trang Quản lý Sale.</div>;
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
          <Dashboard
            projects={visibleProjects}
            onSelect={handleSelectProject}
            onFilter={handleFilter}
            onCreate={handleCreate}
            canCreate={canCreateAndEdit}
            listTab={listTab}
            onChangeListTab={setListTab}
            saleTabs={saleTabs}
            selectedSaleTab={selectedSaleTab}
            onSelectSaleTab={setSelectedSaleTab}
            accounts={accounts}
            totalAmount={totalAmount}
          />
        )
      ) : (
        selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setView('dashboard')}
            onSave={handleSave}
            readOnly={readOnly}
          />
        )
      )}
    </div>
  );
}