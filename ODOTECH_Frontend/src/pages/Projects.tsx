import { useEffect, useMemo, useRef, useState } from 'react';

import ConfirmDeleteModal from '../components/accountsDasboard/ConfirmDeleteModal';

import ProjectsDashboard from '../components/projectsDasboard/ProjectsDashboard';
import ProjectsTable from '../components/projectsDasboard/ProjectsTable';
import ProjectsToolbar from '../components/projectsDasboard/ProjectsToolbar';
import type { ProjectManagementItem } from '../components/projectsDasboard/interface/type';
import { buildAuthHeaders } from '../utils/auth';

type ToastType = 'success' | 'error';
type ToastState = { open: boolean; type: ToastType; message: string };

const todayIso = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const createDraftProject = (): Omit<ProjectManagementItem, 'id' | 'created_at' | 'updated_at'> => {
  const code = `PRJ-${Date.now()}`;
  const today = todayIso();
  return {
    project_code: code,
    project_type: '',
    name: 'New website',
    client_id: null,
    sale_id: null,
    pm_id: null,
    status: 'not_started',
    priority: 'medium',
    budget: 0,
    contract_value: 0,
    actual_cost: 0,
    deposit_received: 0,
    payment_status: '',
    total_hours: 0,
    technology_stack: '',
    domain_url: '',
    production_url: '',
    start_date: today,
    deadline: '',
    completed_at: '',
    description: '',
  };
};

export default function Projects() {
  const [projects, setProjects] = useState<ProjectManagementItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', message: '' });
  const toastTimersRef = useRef<{ show?: number; hide?: number }>({});
  const pendingSaveTimersRef = useRef<Map<number, number>>(new Map());

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
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

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/projects?limit=200`, { headers: buildAuthHeaders() });
      if (!res.ok) throw new Error(await readErrorMessage(res));
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
    void loadProjects();
    const pendingSaves = pendingSaveTimersRef.current;
    return () => {
      clearToastTimers();
      for (const timer of pendingSaves.values()) {
        window.clearTimeout(timer);
      }
      pendingSaves.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((item) => {
      return (
        String(item.id).includes(term) ||
        item.project_code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        String(item.client_id ?? '').includes(term) ||
        String(item.pm_id ?? '').includes(term)
      );
    });
  }, [projects, searchTerm]);

  const toApiPayload = (p: ProjectManagementItem): Omit<ProjectManagementItem, 'id' | 'created_at' | 'updated_at'> => ({
    project_code: p.project_code,
    project_type: p.project_type,
    name: p.name,
    client_id: p.client_id,
    sale_id: p.sale_id,
    pm_id: p.pm_id,
    status: p.status,
    priority: p.priority,
    budget: p.budget,
    contract_value: p.contract_value,
    actual_cost: p.actual_cost,
    deposit_received: p.deposit_received,
    payment_status: p.payment_status,
    total_hours: p.total_hours,
    technology_stack: p.technology_stack,
    domain_url: p.domain_url,
    production_url: p.production_url,
    start_date: p.start_date,
    deadline: p.deadline,
    completed_at: p.completed_at,
    description: p.description,
  });

  const scheduleSave = (id: number, nextProject: ProjectManagementItem) => {
    const existing = pendingSaveTimersRef.current.get(id);
    if (existing) window.clearTimeout(existing);

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/projects/${id}`, {
            method: 'PUT',
            headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(toApiPayload(nextProject)),
          });
          if (!res.ok) throw new Error(await readErrorMessage(res));
          const updated = (await res.json()) as ProjectManagementItem;
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        } catch (e: unknown) {
          showToast('error', e instanceof Error ? e.message : 'Không lưu được dữ liệu');
        }
      })();
    }, 600);

    pendingSaveTimersRef.current.set(id, timer);
  };

  const patchProject = (id: number, patch: Partial<ProjectManagementItem>) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const changed = next.find((p) => p.id === id);
      if (changed) scheduleSave(id, changed);
      return next;
    });
  };

  return (
    <main className="flex-1 min-w-0 p-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Quản lý dự án</h1>

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

        {loading ? (
          <div className="text-gray-600">Đang tải dữ liệu...</div>
        ) : (
          <>
            <ProjectsDashboard projects={projects} today={today} />

            <ProjectsToolbar
              searchTerm={searchTerm}
              onChangeSearchTerm={setSearchTerm}
              filteredCount={filteredProjects.length}
              onCreate={() => {
                (async () => {
                  try {
                    const res = await fetch(`${apiBaseUrl}/api/projects`, {
                      method: 'POST',
                      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
                      body: JSON.stringify(createDraftProject()),
                    });
                    if (!res.ok) throw new Error(await readErrorMessage(res));
                    const created = (await res.json()) as ProjectManagementItem;
                    setProjects((prev) => [created, ...prev]);
                    setSelectedId(created.id);
                    showToast('success', 'Tạo dự án thành công');
                  } catch (e: unknown) {
                    showToast('error', e instanceof Error ? e.message : 'Không tạo được dự án');
                  }
                })();
              }}
            />

            <div className="mt-4">
              <ProjectsTable
                projects={filteredProjects}
                selectedId={selectedId}
                today={today}
                apiBaseUrl={apiBaseUrl}
                onSelect={(id) => setSelectedId(id)}
                onUpdate={patchProject}
                onDelete={(id) => {
                  setDeleteTargetId(id);
                  setDeleteOpen(true);
                }}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Xác nhận xóa dự án"
        description={deleteTargetId ? `Bạn có chắc chắn muốn xóa dự án #${deleteTargetId} không?` : 'Bạn có chắc chắn muốn xóa dự án này không?'}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId) return;
          (async () => {
            try {
              const res = await fetch(`${apiBaseUrl}/api/projects/${deleteTargetId}`, { method: 'DELETE', headers: buildAuthHeaders() });
              if (!res.ok) throw new Error(await readErrorMessage(res));
              setProjects((prev) => prev.filter((p) => p.id !== deleteTargetId));
              setSelectedId((prev) => (prev === deleteTargetId ? null : prev));
              showToast('success', 'Xóa dự án thành công');
            } catch (e: unknown) {
              showToast('error', e instanceof Error ? e.message : 'Không xóa được dự án');
            } finally {
              setDeleteOpen(false);
              setDeleteTargetId(null);
            }
          })();
        }}
      />
    </main>
  );
}
