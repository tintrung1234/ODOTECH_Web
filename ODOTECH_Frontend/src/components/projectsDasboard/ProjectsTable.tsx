import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ProjectManagementItem,
  ProjectMgmtPriority,
  ProjectMgmtStatus,
  ProjectTask,
} from './interface/type';
import {
  priorityClassName,
  priorityLabel,
  statusLabel,
} from '../../utils/projectUtils';

import ProjectTasksPanel from './ProjectTasksPanel';
import { buildAuthHeaders } from '../../utils/auth';

export default function ProjectsTable({
  projects,
  selectedId,
  apiBaseUrl,
  onSelect,
  onUpdate,
  onDelete,
}: {
  projects: ProjectManagementItem[];
  selectedId: number | null;
  today: Date;
  apiBaseUrl: string;
  onSelect: (id: number) => void;
  onUpdate: (id: number, patch: Partial<ProjectManagementItem>) => void;
  onDelete: (id: number) => void;
}) {
  // Common styles
  const inputBase =
    'w-full h-8 bg-transparent border border-transparent rounded-md px-1.5 py-1 text-l text-gray-700 placeholder-gray-400 transition-all duration-150 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none';
  
  const textareaBase =
    'w-full bg-transparent border border-transparent rounded-md px-1.5 py-1 text-l text-gray-700 placeholder-gray-400 transition-all duration-150 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none';

  const selectBase = 
    'w-full h-8 bg-transparent border border-transparent rounded-md px-1.5 py-1 text-l text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer';

  const cellBase = 'px-2.5 py-2 h-14 align-middle border-b border-gray-100 group-hover:bg-gray-50/30 transition-colors';
  const stickyCellBase = 'px-2.5 py-2 h-14 align-middle border-b border-gray-100 transition-colors';
  const headerBase = 'px-2.5 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/95 backdrop-blur sticky top-0 z-10 border-b border-gray-200 whitespace-nowrap shadow-sm';

  const stickyRightDivider =
    "relative after:content-[''] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-200 after:pointer-events-none";

  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  const [taskPanelLayout, setTaskPanelLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [tasksByProjectId, setTasksByProjectId] = useState<Record<number, ProjectTask[]>>({});
  const [taskLoadingByProjectId, setTaskLoadingByProjectId] = useState<Record<number, boolean>>({});
  const pendingTaskSaveTimersRef = useRef<Map<string, number>>(new Map());

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

  const loadTasks = async (projectId: number) => {
    setTaskLoadingByProjectId((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks`, {
        headers: buildAuthHeaders(),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = (await res.json()) as { items?: ProjectTask[] } | ProjectTask[];
      const items = Array.isArray(json) ? json : (json.items ?? []);
      setTasksByProjectId((prev) => ({ ...prev, [projectId]: items }));
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setTaskLoadingByProjectId((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const emptyDraftTask = useMemo<ProjectTask>(
    () => ({
      id: 0,
      tieuDe: '',
      nguoiPhuTrach: '',
      hanChot: '',
      trangThai: 'Chưa làm',
      ghiChu: '',
    }),
    []
  );

  const [draftTaskByProjectId, setDraftTaskByProjectId] = useState<Record<number, ProjectTask>>({});

  const getDraftTask = (projectId: number) => draftTaskByProjectId[projectId] ?? emptyDraftTask;

  const setDraftTask = (projectId: number, patch: Partial<ProjectTask>) => {
    setDraftTaskByProjectId((prev) => ({
      ...prev,
      [projectId]: { ...getDraftTask(projectId), ...patch },
    }));
  };

  const addTask = (projectId: number) => {
    const draft = getDraftTask(projectId);
    const title = draft.tieuDe.trim();
    if (!title) return;

    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            tieuDe: title,
            nguoiPhuTrach: draft.nguoiPhuTrach.trim(),
            hanChot: draft.hanChot,
            trangThai: draft.trangThai,
            ghiChu: draft.ghiChu?.trim() || '',
          }),
        });
        if (!res.ok) throw new Error(await readErrorMessage(res));
        const created = (await res.json()) as ProjectTask;
        setTasksByProjectId((prev) => {
          const existing = prev[projectId] ?? [];
          return { ...prev, [projectId]: [created, ...existing] };
        });

        setDraftTaskByProjectId((prev) => ({
          ...prev,
          [projectId]: emptyDraftTask,
        }));
      } catch (err) {
        console.error('Failed to add task', err);
      }
    })();
  };

  const updateTask = (projectId: number, taskId: number, patch: Partial<ProjectTask>) => {
    setTasksByProjectId((prev) => {
      const existing = prev[projectId] ?? [];
      return {
        ...prev,
        [projectId]: existing.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      };
    });

    const key = `${projectId}:${taskId}`;
    const existingTimer = pendingTaskSaveTimersRef.current.get(key);
    if (existingTimer) window.clearTimeout(existingTimer);

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(patch),
          });
          if (!res.ok) throw new Error(await readErrorMessage(res));
          const updated = (await res.json()) as ProjectTask;
          setTasksByProjectId((prev) => {
            const list = prev[projectId] ?? [];
            return {
              ...prev,
              [projectId]: list.map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
            };
          });
        } catch (err) {
          console.error('Failed to update task', err);
        }
      })();
    }, 500);

    pendingTaskSaveTimersRef.current.set(key, timer);
  };

  const deleteTask = (projectId: number, taskId: number) => {
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: buildAuthHeaders(),
        });
        if (!res.ok) throw new Error(await readErrorMessage(res));
        setTasksByProjectId((prev) => {
          const existing = prev[projectId] ?? [];
          return { ...prev, [projectId]: existing.filter((t) => t.id !== taskId) };
        });
      } catch (err) {
        console.error('Failed to delete task', err);
      }
    })();
  };

  const expandedProject = useMemo(
    () => projects.find((p) => p.id === expandedProjectId) ?? null,
    [projects, expandedProjectId]
  );

  const updateTaskPanelLayout = (projectId: number | null) => {
    if (!projectId) {
      setTaskPanelLayout(null);
      return;
    }

    const container = scrollContainerRef.current;
    const rowEl = rowRefs.current[projectId];
    if (!container || !rowEl) return;

    const containerRect = container.getBoundingClientRect();
    const rowRect = rowEl.getBoundingClientRect();
    const gap = 8;

    const top = container.scrollTop + (rowRect.bottom - containerRect.top) + gap;
    const left = container.scrollLeft + 12;
    const width = Math.max(320, container.clientWidth - 24);

    setTaskPanelLayout({ top, left, width });
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      updateTaskPanelLayout(expandedProjectId);
    });

    return () => cancelAnimationFrame(raf);
  }, [expandedProjectId, projects.length]);

  useEffect(() => {
    if (!expandedProjectId) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => updateTaskPanelLayout(expandedProjectId);
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [expandedProjectId]);

  useEffect(() => {
    if (!expandedProjectId) return;
    void loadTasks(expandedProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedProjectId, apiBaseUrl]);

  useEffect(() => {
    return () => {
      const timers = pendingTaskSaveTimersRef.current;
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div ref={scrollContainerRef} className="overflow-auto flex-1 relative min-h-[400px]">
        <table className="min-w-max w-full border-collapse min-h-[400px] relative">
          <thead>
            <tr>
              <th className={`${headerBase} w-16 sticky left-0 z-30 bg-gray-50`}>ID</th>
              <th className={`${headerBase} ${stickyRightDivider} w-48 sticky left-16 z-30 bg-gray-50`}>Mã dự án</th>
              <th className={`${headerBase} w-56`}>Tên website</th>
              <th className={`${headerBase} w-36`}>Loại</th>
              <th className={`${headerBase} w-28`}>Khách hàng</th>
              <th className={`${headerBase} w-28`}>Sale</th>
              <th className={`${headerBase} w-28`}>PM</th>
              <th className={`${headerBase} w-40`}>Trạng thái</th>
              <th className={`${headerBase} w-36`}>Độ ưu tiên</th>
              <th className={`${headerBase} w-32`}>Ngân sách</th>
              <th className={`${headerBase} w-32`}>Giá trị HĐ</th>
              <th className={`${headerBase} w-32`}>Chi phí thực</th>
              <th className={`${headerBase} w-32`}>Đã thu cọc</th>
              <th className={`${headerBase} w-40`}>TT thanh toán</th>
              <th className={`${headerBase} w-28`}>Tổng giờ</th>
              <th className={`${headerBase} w-52`}>Công nghệ</th>
              <th className={`${headerBase} w-56`}>Domain</th>
              <th className={`${headerBase} w-56`}>Live</th>
              <th className={`${headerBase} w-32`}>Ngày bắt đầu</th>
              <th className={`${headerBase} w-32`}>Deadline</th>
              <th className={`${headerBase} w-40`}>Ngày xong</th>
              <th className={`${headerBase} w-72`}>Mô tả</th>
              <th className={`${headerBase} w-44`}>Ngày tạo</th>
              <th className={`${headerBase} w-44`}>Ngày cập nhật</th>
              <th className={`${headerBase} w-20 text-center`}>Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td className="py-8 px-4 text-center text-gray-500 italic" colSpan={25}>
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              projects.map((item) => (
                <Fragment key={item.id}>
                  <tr
                    ref={(el) => {
                      rowRefs.current[item.id] = el;
                    }}
                    onClick={() => {
                      onSelect(item.id);
                      setExpandedProjectId((prev) => (prev === item.id ? null : item.id));
                    }}
                    className={`h-14 group transition-colors ${selectedId === item.id ? 'bg-teal-50/60' : 'hover:bg-gray-50/50'}`}
                  >
                  <td className={`${stickyCellBase} font-medium text-gray-500 sticky left-0 z-20 ${selectedId === item.id ? 'bg-teal-50' : 'bg-white group-hover:bg-gray-50'}`}>#{item.id}</td>

                  <td className={`${stickyCellBase} ${stickyRightDivider} sticky left-16 z-30 ${selectedId === item.id ? 'bg-teal-50' : 'bg-white group-hover:bg-gray-50'}`}>
                    <input
                      type="text"
                      value={item.project_code}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(item.id, { project_code: e.target.value })}
                      className={`${inputBase} font-medium text-gray-900`}
                      placeholder="PRJ-..."
                    />
                  </td>

                  <td className={cellBase}>
                    <textarea
                      rows={1}
                      value={item.name}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                      className={`${textareaBase} h-8 font-medium text-gray-900 overflow-hidden`}
                      placeholder="Tên website..."
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="text"
                      value={item.project_type}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(item.id, { project_type: e.target.value })}
                      className={inputBase}
                      placeholder="Loại dự án..."
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="number"
                      value={item.client_id ?? ''}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const v = e.target.value;
                        onUpdate(item.id, { client_id: v === '' ? null : Number(v) });
                      }}
                      className={inputBase}
                      placeholder="Client ID"
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="number"
                      value={item.sale_id ?? ''}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const v = e.target.value;
                        onUpdate(item.id, { sale_id: v === '' ? null : Number(v) });
                      }}
                      className={inputBase}
                      placeholder="Sale ID"
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="number"
                      value={item.pm_id ?? ''}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const v = e.target.value;
                        onUpdate(item.id, { pm_id: v === '' ? null : Number(v) });
                      }}
                      className={inputBase}
                      placeholder="PM ID"
                    />
                  </td>

                  <td className={cellBase}>
                    <select
                      value={item.status}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(item.id, { status: e.target.value as ProjectMgmtStatus })}
                      className={selectBase}
                    >
                      <option value="not_started">{statusLabel('not_started')}</option>
                      <option value="in_progress">{statusLabel('in_progress')}</option>
                      <option value="on_hold">{statusLabel('on_hold')}</option>
                      <option value="completed">{statusLabel('completed')}</option>
                      <option value="late">{statusLabel('late')}</option>
                    </select>
                  </td>

                  <td className={cellBase}>
                    <div className="space-y-1.5">
                      <select
                        value={item.priority}
                        onFocus={() => onSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdate(item.id, { priority: e.target.value as ProjectMgmtPriority })}
                        className={selectBase}
                      >
                        <option value="low">{priorityLabel('low')}</option>
                        <option value="medium">{priorityLabel('medium')}</option>
                        <option value="high">{priorityLabel('high')}</option>
                        <option value="urgent">{priorityLabel('urgent')}</option>
                      </select>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${priorityClassName(item.priority)}`}>
                        {priorityLabel(item.priority)}
                      </div>
                    </div>
                  </td>

                  <td className={cellBase}>
                    <input type="number" step="0.01" value={item.budget} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { budget: Number(e.target.value) })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <input type="number" step="0.01" value={item.contract_value} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { contract_value: Number(e.target.value) })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <input type="number" step="0.01" value={item.actual_cost} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { actual_cost: Number(e.target.value) })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <input type="number" step="0.01" value={item.deposit_received} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { deposit_received: Number(e.target.value) })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <input type="text" value={item.payment_status} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { payment_status: e.target.value })} className={inputBase} placeholder="payment_status..." />
                  </td>

                  <td className={cellBase}>
                    <input type="number" step="0.25" value={item.total_hours} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { total_hours: Number(e.target.value) })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <textarea
                      rows={1}
                      value={item.technology_stack}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(item.id, { technology_stack: e.target.value })}
                      className={`${textareaBase} h-8 overflow-hidden`}
                      placeholder="React, Node.js..."
                    />
                  </td>

                  <td className={cellBase}>
                    <input type="text" value={item.domain_url} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { domain_url: e.target.value })} className={inputBase} placeholder="https://..." />
                  </td>

                  <td className={cellBase}>
                    <input type="text" value={item.production_url} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { production_url: e.target.value })} className={inputBase} placeholder="https://..." />
                  </td>

                  <td className={cellBase}>
                    <input type="date" value={item.start_date} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { start_date: e.target.value })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <input type="date" value={item.deadline} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { deadline: e.target.value })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <input type="datetime-local" value={item.completed_at ? item.completed_at.slice(0, 16) : ''} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { completed_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} className={inputBase} />
                  </td>

                  <td className={cellBase}>
                    <textarea
                      rows={2}
                      value={item.description}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                      className={`${textareaBase} h-10 overflow-hidden`}
                      placeholder="Mô tả..."
                    />
                  </td>

                  <td className={`${cellBase} text-l text-gray-600 whitespace-nowrap`}>{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}</td>
                  <td className={`${cellBase} text-l text-gray-600 whitespace-nowrap`}>{item.updated_at ? new Date(item.updated_at).toLocaleString('vi-VN') : ''}</td>

                  <td className={`${cellBase} text-center align-middle`}>
                    <button
                      type="button"
                      className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      title="Xóa dự án"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>

        {expandedProject && taskPanelLayout && (
          <ProjectTasksPanel
            expandedProject={expandedProject}
            layout={taskPanelLayout}
            tasks={tasksByProjectId[expandedProject.id] ?? []}
            isLoading={taskLoadingByProjectId[expandedProject.id] ?? false}
            draftTask={getDraftTask(expandedProject.id)}
            onDraftChange={(patch) => setDraftTask(expandedProject.id, patch)}
            onAddTask={() => addTask(expandedProject.id)}
            onUpdateTask={(taskId, patch) => updateTask(expandedProject.id, taskId, patch)}
            onDeleteTask={(taskId) => deleteTask(expandedProject.id, taskId)}
          />
        )}
      </div>
    </div>
  );
}
