import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ConfirmDeleteModal from '../components/accountsDasboard/ConfirmDeleteModal';

import ProjectsDashboard from '../components/projectsDasboard/ProjectsDashboard';
import ProjectsTable from '../components/projectsDasboard/ProjectsTable';
import ProjectsToolbar from '../components/projectsDasboard/ProjectsToolbar';
import type {
  Account,
  ProjectManagementItem,
  ProjectMgmtStatus,
  ProjectTask,
  ProjectType,
} from '../interface/type';
import { getTokenUser, normalizeRole } from '../utils/auth';
import { useProjectTasks } from '../utils/useProjectTasks';

type ListTab = 'all' | 'done';

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
    name: 'New project',
    client_id: null,
    sale_id: null,
    pm_id: null,
    status: 'Đợi sắp xếp',
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

    requirements: '',
    source: '',
    progress_percent: 0,
    assignee: '',
    tech_user_id: null,
    customer_sender_id: null,
  };
};

export default function Projects() {
  const [projects, setProjects] = useState<ProjectManagementItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [projectStatus, setProjectStatus] = useState<ProjectMgmtStatus | ''>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [selectedSalesManagerTab, setSelectedSalesManagerTab] = useState<string>('');
  const [selectedSaleTab, setSelectedSaleTab] = useState<string>('');
  const [selectedDevTab, setSelectedDevTab] = useState<string>('');
  const [selectedDevManagerTab, setSelectedDevManagerTab] = useState<string>('');
  const [listTab, setListTab] = useState<ListTab>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', message: '' });
  const toastTimersRef = useRef<{ show?: number; hide?: number }>({});
  const pendingSaveTimersRef = useRef<Map<number, number>>(new Map());

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);

  const [tokenUser, setTokenUser] = useState<Awaited<ReturnType<typeof getTokenUser>>>(null);
  const uid = typeof tokenUser?.uid === 'number' ? tokenUser.uid : Number(tokenUser?.uid ?? NaN);
  const role = useMemo(() => normalizeRole(tokenUser?.role), [tokenUser?.role]);

  useEffect(() => {
    (async () => {
      const user = await getTokenUser();
      setTokenUser(user);
    })();
  }, []);

  const readOnly = role === 'support';
  const canCreate = !readOnly && (role === 'admin' || role === 'head_sales' || role === 'head_tech' || role === 'sales_manager' || role === 'dev_manager');

  const currentAccount = useMemo(() => {
    if (!Number.isFinite(uid)) return null;
    return accounts.find((a) => a.id === uid) ?? null;
  }, [accounts, uid]);

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  // Task management for dev role filtering
  const {
    tasksByProjectId,
    loadTasks,
  } = useProjectTasks({ apiBaseUrl });

  const currentIdentityTokens = useMemo(() => {
    const tokens = new Set<string>();
    if (Number.isFinite(uid)) tokens.add(String(uid));
    const name = (currentAccount?.name || tokenUser?.name || '').trim();
    const username = (currentAccount?.username || tokenUser?.username || '').trim();
    if (name) tokens.add(name);
    if (username) tokens.add(username);
    return Array.from(tokens);
  }, [currentAccount?.name, currentAccount?.username, tokenUser?.name, tokenUser?.username, uid]);

  const isDoneStatus = (status: ProjectMgmtStatus | string) => {
    const s = String(status || '').trim();
    return (
      s === 'completed' ||
      s === 'Kết thúc hài lòng' ||
      s === 'Kết thúc thất vọng' ||
      s === 'Hoàn thành đợi tất toán'
    );
  };

  const projectHasMember = (p: ProjectManagementItem, accountOrTokens: Account | string[], tasks?: ProjectTask[], checkUid?: number | null) => {
    const tokens = Array.isArray(accountOrTokens)
      ? accountOrTokens
      : [String(accountOrTokens.id), (accountOrTokens.username || '').trim(), (accountOrTokens.name || '').trim()].filter(Boolean);

    // Check assignee (text field) and tech_user_id/customer_sender_id (ID fields)
    const assigneeText = String(p.assignee ?? '').toLowerCase();
    const techUserId = String(p.tech_user_id ?? '');
    const customerSenderId = String(p.customer_sender_id ?? '');

    const isProjectMember = tokens.some((t) => {
      const token = String(t).toLowerCase();
      return assigneeText.includes(token) || techUserId === t || customerSenderId === t;
    });

    if (isProjectMember) return true;

    // Check task assignments (using numeric IDs)
    // We prioritize checkUid if provided, otherwise try to extract from tokens
    if (tasks && tasks.length > 0) {
      const targetId = checkUid !== undefined && checkUid !== null
        ? checkUid
        : Number(tokens[0]);

      if (Number.isFinite(targetId)) {
        return tasks.some(task =>
          task.nguoiChinh === targetId ||
          task.nguoiPhuTrach === targetId ||
          task.nguoiHoTro === targetId
        );
      }
    }

    return false;
  };

  const canViewProject = useCallback(
    (p: ProjectManagementItem) => {
      if (role === 'admin' || role === 'support' || role === 'head_sales' || role === 'head_tech') return true;
      if (!Number.isFinite(uid)) return false;
      if (role === 'sale') return p.sale_id === uid;
      if (role === 'sales_manager') return p.pm_id === uid;
      if (role === 'dev_manager') return p.pm_id === uid;
      if (role === 'dev') {
        const projectTasks = tasksByProjectId[p.id];

        // If tasks haven't been loaded yet, optimistically show the project
        // This prevents hiding projects before we know if the user has tasks
        if (projectTasks === undefined) {
          return true;
        }

        // Once tasks are loaded, check both project membership and task assignments
        return projectHasMember(p, currentIdentityTokens, projectTasks, uid);
      }
      return false;
    },
    [currentIdentityTokens, role, uid, tasksByProjectId]
  );

  const canEditProject = useCallback(
    (p: ProjectManagementItem) => {
      if (readOnly) return false;
      if (role === 'admin' || role === 'head_sales' || role === 'head_tech') return true;
      if (!Number.isFinite(uid)) return false;
      if (role === 'sale') return p.sale_id === uid;
      if (role === 'sales_manager') return p.pm_id === uid;
      if (role === 'dev_manager') return p.pm_id === uid;
      return false;
    },
    [readOnly, role, uid]
  );

  const canDeleteProject = useCallback(
    (p: ProjectManagementItem) => {
      void p;
      if (readOnly) return false;
      // Keep delete stricter.
      if (role === 'admin' || role === 'head_sales' || role === 'head_tech') return true;
      return false;
    },
    [readOnly, role]
  );

  const canEditTasksInProject = useCallback(
    (p: ProjectManagementItem) => {
      if (readOnly) return false;
      if (role === 'admin' || role === 'head_sales' || role === 'head_tech') return true;
      if (!Number.isFinite(uid)) return false;
      if (role === 'sales_manager' || role === 'dev_manager') return p.pm_id === uid;
      if (role === 'dev') {
        const projectTasks = tasksByProjectId[p.id];

        // If tasks haven't been loaded yet, optimistically allow editing
        if (projectTasks === undefined) {
          return true;
        }

        return projectHasMember(p, currentIdentityTokens, projectTasks, uid);
      }
      return false;
    },
    [currentIdentityTokens, readOnly, role, uid, tasksByProjectId]
  );



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
      const res = await fetch(`${apiBaseUrl}/api/projects?limit=200`, { credentials: 'include' });
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

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/accounts?limit=200`, { credentials: 'include' });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.items ?? []);
      setAccounts(items);
    } catch (e: unknown) {
      // Non-blocking for the page, but user-pickers will be empty.
      showToast('error', e instanceof Error ? e.message : 'Không tải được danh sách nhân sự');
    }
  };

  useEffect(() => {
    void loadProjects();
    void loadAccounts();
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

  // Load tasks for dev users to enable task-based filtering
  useEffect(() => {
    if (role !== 'dev') return;
    if (projects.length === 0) return;

    // Load tasks for all projects that don't have tasks loaded yet
    for (const project of projects) {
      if (!tasksByProjectId[project.id]) {
        void loadTasks(project.id);
      }
    }
  }, [role, projects, tasksByProjectId, loadTasks]);

  const salesManagerTabs = useMemo(() => {
    if (!(role === 'head_sales' || role === 'admin' || role === 'support')) return [];
    const managers = accounts
      .filter((a) => normalizeRole(a.role_system) === 'sales_manager')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    return managers.map((a) => String(a.id));
  }, [accounts, role]);

  const saleTabs = useMemo(() => {
    if (!(role === 'sales_manager' || role === 'head_sales' || role === 'admin' || role === 'support')) return [];

    // Head/admin/support: show all sales from accounts.
    if (role === 'head_sales' || role === 'admin' || role === 'support') {
      const sales = accounts
        .filter((a) => normalizeRole(a.role_system) === 'sale')
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
      return sales.map((a) => String(a.id));
    }

    // Sales manager: tabs only for their sales (sale_id) in projects they manage.
    if (role === 'sales_manager' && Number.isFinite(uid)) {
      const set = new Set<string>();
      for (const p of projects) {
        if (!canViewProject(p)) continue;
        if (p.pm_id !== uid) continue;
        const saleId = String(p.sale_id ?? '').trim();
        if (saleId) set.add(saleId);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
    }

    return [];
  }, [accounts, canViewProject, projects, role, uid]);

  const devTabs = useMemo(() => {
    if (!(role === 'dev_manager' || role === 'head_tech' || role === 'admin' || role === 'support')) return [];
    const devs = accounts
      .filter((a) => normalizeRole(a.role_system) === 'dev')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    return devs.map((a) => String(a.id));
  }, [accounts, role]);

  const devManagerTabs = useMemo(() => {
    if (!(role === 'head_tech' || role === 'admin' || role === 'support')) return [];
    const managers = accounts
      .filter((a) => normalizeRole(a.role_system) === 'dev_manager')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    return managers.map((a) => String(a.id));
  }, [accounts, role]);

  useEffect(() => {
    if (!selectedSalesManagerTab) return;
    if (salesManagerTabs.length === 0) return;
    if (!salesManagerTabs.includes(selectedSalesManagerTab)) setSelectedSalesManagerTab('');
  }, [salesManagerTabs, selectedSalesManagerTab]);

  useEffect(() => {
    if (!selectedSaleTab) return;
    if (saleTabs.length === 0) return;
    if (!saleTabs.includes(selectedSaleTab)) setSelectedSaleTab('');
  }, [saleTabs, selectedSaleTab]);

  useEffect(() => {
    if (!selectedDevTab) return;
    if (devTabs.length === 0) return;
    if (!devTabs.includes(selectedDevTab)) setSelectedDevTab('');
  }, [devTabs, selectedDevTab]);

  useEffect(() => {
    if (!selectedDevManagerTab) return;
    if (devManagerTabs.length === 0) return;
    if (!devManagerTabs.includes(selectedDevManagerTab)) setSelectedDevManagerTab('');
  }, [devManagerTabs, selectedDevManagerTab]);

  const visibleProjects = useMemo(() => {
    let list = projects.filter(canViewProject);

    // Head tech/admin/support: allow filtering by each dev_manager (pm_id).
    if (selectedDevManagerTab) {
      list = list.filter((p) => String(p.pm_id ?? '').trim() === selectedDevManagerTab);
    }

    if (role === 'dev' && listTab === 'done') {
      list = list.filter((p) => isDoneStatus(p.status));
    }

    // Sales manager select filters by pm_id.
    if (selectedSalesManagerTab) {
      list = list.filter((p) => String(p.pm_id ?? '').trim() === selectedSalesManagerTab);
    }

    // Sale select filters by sale_id.
    if (selectedSaleTab) {
      list = list.filter((p) => String(p.sale_id ?? '').trim() === selectedSaleTab);
    }

    // Dev tabs (manager view): filter by project member fields.
    if (selectedDevTab) {
      const selectedDev = accounts.find((a) => String(a.id) === selectedDevTab);
      if (selectedDev) list = list.filter((p) => projectHasMember(p, selectedDev));
    }

    return list;
  }, [accounts, projects, role, listTab, selectedSaleTab, selectedSalesManagerTab, selectedDevTab, selectedDevManagerTab, canViewProject]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return visibleProjects.filter((item) => {
      if (projectType && item.project_type !== projectType) return false;
      if (projectStatus && item.status !== projectStatus) return false;

      if (!term) return true;
      return (
        String(item.id).includes(term) ||
        item.project_code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        String(item.client_id ?? '').includes(term) ||
        String(item.pm_id ?? '').includes(term)
      );
    });
  }, [visibleProjects, searchTerm, projectType, projectStatus]);

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

    requirements: p.requirements ?? '',
    source: p.source ?? '',
    progress_percent: p.progress_percent ?? 0,
    assignee: p.assignee ?? '',
    tech_user_id: p.tech_user_id ?? null,
    customer_sender_id: p.customer_sender_id ?? null,
  });

  const scheduleSave = (id: number, nextProject: ProjectManagementItem) => {
    const existing = pendingSaveTimersRef.current.get(id);
    if (existing) window.clearTimeout(existing);

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
    <main className="flex-1 min-w-0 px-3 sm:px-6 py-3">
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 sm:mb-5">Quản lý dự án</h1>

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

        {loading ? (
          <div className="text-gray-600">Đang tải dữ liệu...</div>
        ) : (
          <>
            <ProjectsDashboard projects={filteredProjects} role={role} today={today} accounts={accounts} />

            {(salesManagerTabs.length > 0 || saleTabs.length > 0 || devTabs.length > 0 || devManagerTabs.length > 0 || role === 'dev') && (
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                {role === 'dev' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setListTab('all')}
                      className={`h-9 px-3 rounded-lg border text-xs sm:text-sm ${listTab === 'all' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setListTab('done')}
                      className={`h-9 px-3 rounded-lg border text-xs sm:text-sm ${listTab === 'done' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      Đã done
                    </button>
                  </div>
                )}

                {salesManagerTabs.length > 0 && (
                  <select
                    value={selectedSalesManagerTab}
                    onChange={(e) => setSelectedSalesManagerTab(e.target.value)}
                    className="h-9 px-2 sm:px-3 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm text-gray-700 outline-none focus:border-gray-600 min-w-[140px] flex-1 sm:flex-none"
                    aria-label="Tab Quản lý sale"
                  >
                    <option value="">Tất cả QL sale</option>
                    {salesManagerTabs.map((id) => {
                      const a = accounts.find((x) => String(x.id) === id);
                      const label = a ? (a.name || a.username || `#${a.id}`) : `#${id}`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}

                {saleTabs.length > 0 && (
                  <select
                    value={selectedSaleTab}
                    onChange={(e) => setSelectedSaleTab(e.target.value)}
                    className="h-9 px-2 sm:px-3 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm text-gray-700 outline-none focus:border-gray-600 min-w-[120px] flex-1 sm:flex-none"
                    aria-label="Tab Sale"
                  >
                    <option value="">Tất cả sale</option>
                    {saleTabs.map((id) => {
                      const a = accounts.find((x) => String(x.id) === id);
                      const label = a ? (a.name || a.username || `#${a.id}`) : `#${id}`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}

                {devManagerTabs.length > 0 && (
                  <select
                    value={selectedDevManagerTab}
                    onChange={(e) => setSelectedDevManagerTab(e.target.value)}
                    className="h-9 px-2 sm:px-3 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm text-gray-700 outline-none focus:border-gray-600 min-w-[140px] flex-1 sm:flex-none"
                    aria-label="Tab Quản lý dev"
                  >
                    <option value="">Tất cả QL dev</option>
                    {devManagerTabs.map((id) => {
                      const a = accounts.find((x) => String(x.id) === id);
                      const label = a ? (a.name || a.username || `#${a.id}`) : `#${id}`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}

                {devTabs.length > 0 && (
                  <select
                    value={selectedDevTab}
                    onChange={(e) => setSelectedDevTab(e.target.value)}
                    className="h-9 px-2 sm:px-3 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm text-gray-700 outline-none focus:border-gray-600 min-w-[120px] flex-1 sm:flex-none"
                    aria-label="Tab Dev"
                  >
                    <option value="">Tất cả dev</option>
                    {devTabs.map((id) => {
                      const a = accounts.find((x) => String(x.id) === id);
                      const label = a ? (a.name || a.username || `#${a.id}`) : `#${id}`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}

            <ProjectsToolbar
              searchTerm={searchTerm}
              onChangeSearchTerm={setSearchTerm}
              projectType={projectType}
              onChangeProjectType={setProjectType}
              projectStatus={projectStatus}
              onChangeProjectStatus={setProjectStatus}
              filteredCount={filteredProjects.length}
              canCreate={canCreate}
              onCreate={() => {
                if (!canCreate) {
                  showToast('error', 'Tài khoản chỉ có quyền xem');
                  return;
                }
                (async () => {
                  try {
                    const res = await fetch(`${apiBaseUrl}/api/projects`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
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
                accounts={accounts}
                selectedId={selectedId}
                today={today}
                apiBaseUrl={apiBaseUrl}
                onSelect={(id) => setSelectedId(id)}
                readOnly={readOnly}
                canEditProject={canEditProject}
                canDeleteProject={canDeleteProject}
                canEditTasksInProject={canEditTasksInProject}
                onUpdate={(id, patch) => {
                  const p = projects.find((x) => x.id === id);
                  if (!p || !canEditProject(p)) {
                    showToast('error', 'Bạn không có quyền sửa dự án này');
                    return;
                  }
                  patchProject(id, patch);
                }}
                onDelete={(id) => {
                  const p = projects.find((x) => x.id === id);
                  if (!p || !canDeleteProject(p)) {
                    showToast('error', 'Bạn không có quyền xóa dự án này');
                    return;
                  }
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
          const p = projects.find((x) => x.id === deleteTargetId);
          if (!p || !canDeleteProject(p)) {
            showToast('error', 'Bạn không có quyền xóa dự án này');
            setDeleteOpen(false);
            setDeleteTargetId(null);
            return;
          }
          (async () => {
            try {
              const res = await fetch(`${apiBaseUrl}/api/projects/${deleteTargetId}`, { method: 'DELETE', credentials: 'include' });
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
