import { useEffect, useMemo, useRef, useState } from 'react';
import Dashboard from '../components/salesDasboard/Dashboard';
import ProjectDetail from '../components/salesDasboard/ProjectDetail';
import type { ProjectData } from '../components/salesDasboard/interface/type';

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

    sale_id: 'Sale 1',
    ky_thuat_id: '',

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
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', message: '' });

  const toastTimersRef = useRef<{ show?: number; hide?: number }>({});

  const [filters, setFilters] = useState<{ q: string; trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy' }>({
    q: '',
    trang_thai_chot: '',
  });

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

      const res = await fetch(`${apiBaseUrl}/api/sales/projects${qs ? `?${qs}` : ''}`);
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
    void loadProjects(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  const handleSelectProject = (project: ProjectData) => {
    (async () => {
      setLoading(true);
      clearAlerts();
      try {
        const res = await fetch(`${apiBaseUrl}/api/sales/projects/${project.id}`);
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
    clearAlerts();
    setSelectedProject(createEmptyProject());
    setView('detail');
  };

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
            projects={projects}
            onSelect={handleSelectProject}
            onFilter={handleFilter}
            onCreate={handleCreate}
          />
        )
      ) : (
        selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setView('dashboard')}
            onSave={handleSave}
          />
        )
      )}
    </div>
  );
}