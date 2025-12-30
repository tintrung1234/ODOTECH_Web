import { useEffect, useMemo, useRef, useState } from 'react';
import Dashboard from '../components/salesDasboard/Dashboard';
import ProjectDetail from '../components/salesDasboard/ProjectDetail';
import type { ProjectData } from '../components/salesDasboard/interface/type';
import type { Account } from '../components/projectsDasboard/interface/type';
import { buildAuthHeaders, getTokenUser, normalizeRole } from '../utils/auth';

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

    sale_id: '',
    ky_thuat_id: '',
    pm_id: '',

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
    gia_han_ads: false,
  };
};

export default function Sales() {
  const role = normalizeRole(getTokenUser()?.role);
  const canView = !(role === 'dev' || role === 'dev_manager' || role === 'head_tech');
  const readOnly = role === 'support';
  const canCreateAndEdit = !readOnly;

  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', message: '' });

  const [accounts, setAccounts] = useState<Account[]>([]);

  const toastTimersRef = useRef<{ show?: number; hide?: number }>({});

  const [filters, setFilters] = useState<{ q: string; trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy' }>({
    q: '',
    trang_thai_chot: '',
  });

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

      const res = await fetch(`${apiBaseUrl}/api/sales/projects${qs ? `?${qs}` : ''}`, { headers: buildAuthHeaders() });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.items ?? []);
      setProjects(items);
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
    // Head sales/admin/support need full account list to build tabs.
    if (!(role === 'head_sales' || role === 'admin' || role === 'support')) return;

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

  const handleSelectProject = (project: ProjectData) => {
    (async () => {
      setLoading(true);
      clearAlerts();
      try {
        const res = await fetch(`${apiBaseUrl}/api/sales/projects/${project.id}`, { headers: buildAuthHeaders() });
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

  const handleFilter = async (next: { q: string; trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy' }) => {
    setFilters(next);
    await loadProjects(next);
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
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
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
      list = list.filter((p) => (p.sale_id || '') === selectedSaleTab);
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

    return list;
  }, [listTab, projects, selectedSaleTab]);

  const saleTabs = useMemo(() => {
    if (!(role === 'sales_manager' || role === 'head_sales' || role === 'admin' || role === 'support')) return [];

    // Default: tabs from actual project sale_id values.
    const fromProjects = new Set<string>();
    for (const p of projects) {
      const s = String(p.sale_id || '').trim();
      if (s) fromProjects.add(s);
    }

    // Head sales/admin/support: show ALL sales managers + ALL sales (by name)
    // so each manager has a tab, and each sale has a tab.
    if (role === 'head_sales' || role === 'admin' || role === 'support') {
      const managerNames = accounts
        .filter((a) => normalizeRole(a.role_system) === 'sales_manager')
        .map((a) => String(a.name || '').trim())
        .filter(Boolean);
      const saleNames = accounts
        .filter((a) => normalizeRole(a.role_system) === 'sale')
        .map((a) => String(a.name || '').trim())
        .filter(Boolean);

      const managersSet = new Set(managerNames);
      const salesSet = new Set(saleNames);

      // Also keep legacy values from projects, in case sale_id is not equal to account.name.
      for (const v of fromProjects) {
        if (!managersSet.has(v) && !salesSet.has(v)) salesSet.add(v);
      }

      const managers = Array.from(managersSet).sort((a, b) => a.localeCompare(b, 'vi'));
      const sales = Array.from(salesSet).sort((a, b) => a.localeCompare(b, 'vi'));
      return [...managers, ...sales];
    }

    return Array.from(fromProjects).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [accounts, projects, role]);

  useEffect(() => {
    if (!selectedSaleTab) return;
    if (saleTabs.length === 0) return;
    if (!saleTabs.includes(selectedSaleTab)) setSelectedSaleTab('');
  }, [saleTabs, selectedSaleTab]);

  const totalAmount = useMemo(() => {
    return visibleProjects.reduce((sum, p) => sum + Number(p.phi_dich_vu || 0) + Number(p.phat_sinh || 0), 0);
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
            className={`rounded border px-4 py-3 shadow-md ${
              toast.type === 'success'
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