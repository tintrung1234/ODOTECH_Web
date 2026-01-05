import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import type {
  Account,
  ProjectManagementItem,
  ProjectMgmtStatus,
  ProjectType,
} from './interface/type';
import {
  statusLabel,
  statusClassName,
} from '../../utils/projectUtils';

import ProjectTasksPanel from './ProjectTasksPanel';
import { normalizeRole } from '../../utils/auth';

import { AccountIdPicker, AccountTextPicker } from './AccountPickers';
import { useProjectTasks } from './helper/useProjectTasks';
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  accountValueToken,
  filterAccountsByRoles,
  normalizeMultiUsers,
} from './helper/projectsTableHelpers';

export default function ProjectsTable({
  projects,
  accounts,
  selectedId,
  apiBaseUrl,
  onSelect,
  onUpdate,
  onDelete,
  readOnly = false,
  canEditProject,
  canDeleteProject,
  canEditTasksInProject,
}: {
  projects: ProjectManagementItem[];
  accounts: Account[];
  selectedId: number | null;
  today: Date;
  apiBaseUrl: string;
  onSelect: (id: number) => void;
  onUpdate: (id: number, patch: Partial<ProjectManagementItem>) => void;
  onDelete: (id: number) => void;
  readOnly?: boolean;
  canEditProject: (project: ProjectManagementItem) => boolean;
  canDeleteProject: (project: ProjectManagementItem) => boolean;
  canEditTasksInProject: (project: ProjectManagementItem) => boolean;
}) {
  // Common styles - Optimized for cleaner look
  const inputBase =
    'w-full h-8 bg-transparent border border-transparent rounded px-2 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none truncate';
  
  const input2 =
    'w-full bg-transparent border border-transparent rounded px-2 py-1 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none leading-tight';

  const selectBase = 
    'w-full h-8 bg-transparent border border-transparent rounded px-1 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer';

  const cellBase = 'px-3 py-2 h-14 align-middle border-b border-gray-100 group-hover:bg-gray-50/50 transition-colors text-sm';
  const stickyCellBase = 'px-3 py-2 h-14 align-middle border-b border-gray-100 transition-colors text-sm';
  const headerBase = 'px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/95 backdrop-blur sticky top-0 z-10 border-b border-gray-200 whitespace-nowrap shadow-sm';

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

  const {
    tasksByProjectId,
    taskLoadingByProjectId,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    getDraftTask,
    setDraftTask,
  } = useProjectTasks({ apiBaseUrl });

  // Prefetch tasks so the "Giờ công" column (derived from tasks) updates without requiring a click/expand.
  // Concurrency-limited to avoid hammering the API.
  useEffect(() => {
    let cancelled = false;

    const missingIds = projects
      .map((p) => p.id)
      .filter((id) => tasksByProjectId[id] == null && taskLoadingByProjectId[id] !== true);

    if (missingIds.length === 0) return;

    const queue = [...missingIds];
    const concurrency = 4;

    const runWorker = async () => {
      while (!cancelled) {
        const id = queue.shift();
        if (id == null) return;
        await loadTasks(id);
      }
    };

    void Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, runWorker));

    return () => {
      cancelled = true;
    };
  }, [loadTasks, projects, taskLoadingByProjectId, tasksByProjectId]);

  const accountsById = useMemo(() => {
    const map = new Map<number, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const saleAccounts = useMemo(
    () => filterAccountsByRoles(accounts, normalizeRole, ['sale', 'sales_manager', 'head_sales']),
    [accounts]
  );

  const pmAccounts = useMemo(
    () => filterAccountsByRoles(accounts, normalizeRole, ['dev_manager', 'head_tech', 'sales_manager', 'head_sales']),
    [accounts]
  );

  const devAccounts = useMemo(
    () => filterAccountsByRoles(accounts, normalizeRole, ['dev', 'dev_manager', 'head_tech']),
    [accounts]
  );

  const allAccounts = accounts;

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

  const parseISODateUtcMs = (value: string): number | null => {
    // expects YYYY-MM-DD
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
    if (!m) return null;
    const year = Number(m[1]);
    const monthIndex = Number(m[2]) - 1;
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
    return Date.UTC(year, monthIndex, day);
  };

  const estimateHoursFromDates = (startISO: string, endISO: string): number => {
    const startMs = parseISODateUtcMs(startISO);
    const endMs = parseISODateUtcMs(endISO);
    if (startMs == null || endMs == null) return 0;
    if (endMs < startMs) return 0;

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysInclusive = Math.floor((endMs - startMs) / msPerDay) + 1;
    return daysInclusive * 8;
  };

  const sumTaskHours = (projectId: number): number | null => {
    const tasks = tasksByProjectId[projectId];
    if (!tasks) return null;

    const sum = tasks.reduce((acc, task) => {
      const hours = Number(task.gioCong);
      if (Number.isFinite(hours) && hours > 0) return acc + hours;

      const start = (task.batDau ?? '').trim();
      const end = (task.hanChot ?? '').trim();
      if (!start || !end) return acc;

      return acc + estimateHoursFromDates(start, end);
    }, 0);

    // Keep the display stable (avoid 0.30000000004)
    return Math.round(sum * 100) / 100;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div ref={scrollContainerRef} className="overflow-auto flex-1 relative min-h-[400px]">
        <table className="min-w-max w-full border-collapse min-h-[400px] relative">
          <thead>
            <tr>
              <th
                className={`${headerBase} ${stickyRightDivider} w-30 sticky left-0 z-30 border-gray-200`}
                style={{ width: '7.5rem', minWidth: '7.5rem' }}
              >
                Mã dự án
              </th>
              <th
                className={`${headerBase} ${stickyRightDivider} w-45 sticky z-20 bg-gray-50 border-r border-gray-200`}
                style={{ left: '7.5rem', width: '11.25rem', minWidth: '11.25rem' }}
              >
                Tên dự án
              </th>
              <th className={`${headerBase} w-25`}>Loại dự án</th>
              <th className={`${headerBase} w-20`}>Mã khách hàng</th>
              <th className={`${headerBase} w-30`}>PM</th>
              <th className={`${headerBase} w-48`}>Trạng thái</th>
              <th className={`${headerBase} w-50`}>Yêu cầu</th>
              <th className={`${headerBase} w-50`}>Source</th>
              <th className={`${headerBase} w-32`}>Bắt đầu</th>
              <th className={`${headerBase} w-32`}>Deadline</th>
              <th className={`${headerBase} w-32`}>Tiến độ (%)</th>
              <th className={`${headerBase} w-40`}>Sale</th>
              <th className={`${headerBase} w-40`}>Người làm</th>
              <th className={`${headerBase} w-28`}>Giờ công</th>
              <th className={`${headerBase} w-40`}>User kỹ thuật</th>
              <th className={`${headerBase} w-40`}>User gửi khách</th>
              <th className={`${headerBase} w-20 text-center`}>Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td className="py-8 px-4 text-center text-gray-500 italic" colSpan={18}>
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              projects.map((item) => {
                const canEditRow = !readOnly && canEditProject(item);
                const canDeleteRow = !readOnly && canDeleteProject(item);
                const disabledClass = !canEditRow ? 'bg-gray-50/70 text-gray-500 cursor-not-allowed' : '';

                return (
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
                      <td
                        className={`${stickyCellBase} ${stickyRightDivider} sticky left-0 z-30  ${selectedId === item.id ? 'bg-teal-50' : 'bg-white group-hover:bg-gray-50'}`}
                        style={{ width: '7.5rem', minWidth: '7.5rem' }}
                      >
                        <input
                          type="text"
                          value={item.project_code}
                          onFocus={() => onSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => canEditRow && onUpdate(item.id, { project_code: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} font-medium text-gray-900 ${disabledClass}`}
                          placeholder="PRJ-..."
                        />
                      </td>

                  <td
                    className={`${stickyCellBase} ${stickyRightDivider} sticky z-20 border-r border-gray-200 ${selectedId === item.id ? 'bg-teal-50' : 'bg-white group-hover:bg-gray-50'}`}
                    style={{ left: '7.5rem', width: '11.25rem', minWidth: '11.25rem' }}
                  >
                    <input
                      type="text"
                      value={item.name}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { name: e.target.value })}
                      disabled={!canEditRow}
                      className={`${input2} h-8 font-medium text-gray-900 overflow-hidden truncate ${disabledClass}`}
                      placeholder="Tên dự án..."
                      title={item.name}
                    />
                  </td>

                  <td className={cellBase}>
                    <select
                      value={item.project_type}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { project_type: e.target.value as ProjectType })}
                      disabled={!canEditRow}
                      className={`${selectBase} ${disabledClass}`}
                    >
                      {PROJECT_TYPES.map((t) => (
                        <option key={t || 'empty'} value={t}>
                          {t || 'Chọn loại'}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className={cellBase}>
                    <input
                      type="number"
                      value={item.client_id ?? ''}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!canEditRow) return;
                        onUpdate(item.id, { client_id: v === '' ? null : Number(v) });
                      }}
                      disabled={!canEditRow}
                      className={`${inputBase} ${disabledClass}`}
                      placeholder="Client ID"
                    />
                  </td>

                  <td className={cellBase}>
                    <AccountIdPicker
                      valueId={item.pm_id}
                      accountsById={accountsById}
                      options={pmAccounts}
                      placeholder="Chọn PM..."
                      datalistId={`pm-${item.id}`}
                      onChangeId={(next) => canEditRow && onUpdate(item.id, { pm_id: next })}
                      className={`${inputBase} ${disabledClass}`}
                      tokenForAccount={accountValueToken}
                    />
                  </td>

                  <td className={cellBase}>
                    <div className={`relative rounded-md overflow-hidden ${statusClassName(item.status)}`}>
                      <select
                        value={item.status}
                        onFocus={() => onSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => canEditRow && onUpdate(item.id, { status: e.target.value as ProjectMgmtStatus })}
                        disabled={!canEditRow}
                        className={`${selectBase} bg-transparent border-none focus:ring-0 h-full py-1 pl-2 pr-8 text-xs font-medium ${disabledClass}`}
                      >
                        {PROJECT_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-white text-gray-900">
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className={cellBase}>
                    <textarea
                      rows={2}
                      value={item.requirements ?? ''}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { requirements: e.target.value })}
                      disabled={!canEditRow}
                      className={`${input2} min-h-10 resize-y overflow-auto ${disabledClass}`}
                      placeholder="Yêu cầu..."
                    />
                  </td>

                  <td className={cellBase}>
                    <textarea
                      value={item.source ?? ''}
                      rows={2}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { source: e.target.value })}
                      disabled={!canEditRow}
                      className={`${inputBase} resize-y overflow-auto ${disabledClass}`}
                      placeholder="Source..."
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="date"
                      value={item.start_date}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { start_date: e.target.value })}
                      disabled={!canEditRow}
                      className={`${inputBase} ${disabledClass}`}
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="date"
                      value={item.deadline}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { deadline: e.target.value })}
                      disabled={!canEditRow}
                      className={`${inputBase} ${disabledClass}`}
                    />
                  </td>

                  <td className={cellBase}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1"
                          min={0}
                          max={100}
                          value={Number.isFinite(Number(item.progress_percent)) ? Number(item.progress_percent) : 0}
                          onFocus={() => onSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => canEditRow && onUpdate(item.id, { progress_percent: Number(e.target.value) })}
                          disabled={!canEditRow}
                          className={`${inputBase} w-16 text-right ${disabledClass}`}
                          placeholder="0"
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            (item.progress_percent || 0) >= 100 ? 'bg-green-500' : 
                            (item.progress_percent || 0) > 75 ? 'bg-teal-500' : 
                            (item.progress_percent || 0) > 50 ? 'bg-blue-500' : 
                            (item.progress_percent || 0) > 25 ? 'bg-orange-400' : 'bg-gray-300'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, item.progress_percent || 0))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className={cellBase}>
                    <AccountIdPicker
                      valueId={item.sale_id}
                      accountsById={accountsById}
                      options={saleAccounts}
                      placeholder="Chọn Sale..."
                      datalistId={`sale-${item.id}`}
                      onChangeId={(next) => canEditRow && onUpdate(item.id, { sale_id: next })}
                      className={`${inputBase} ${disabledClass}`}
                      tokenForAccount={accountValueToken}
                    />
                  </td>

                  <td className={cellBase}>
                    <input
                      type="text"
                      value={item.assignee ?? ''}
                      onFocus={() => onSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => canEditRow && onUpdate(item.id, { assignee: e.target.value })}
                      onBlur={(e) => canEditRow && onUpdate(item.id, { assignee: normalizeMultiUsers(e.target.value) })}
                      disabled={!canEditRow}
                      className={`${inputBase} ${disabledClass}`}
                      placeholder="Người làm..."
                      list={`assignee-${item.id}`}
                    />
                    <datalist id={`assignee-${item.id}`}>
                      {allAccounts.map((a) => (
                        <option key={a.id} value={a.username || a.name} />
                      ))}
                    </datalist>
                  </td>

                  <td className={cellBase}>
                    <input
                      type="number"
                      step="0.25"
                      value={sumTaskHours(item.id) ?? (Number.isFinite(Number(item.total_hours)) ? Number(item.total_hours) : 0)}
                      readOnly
                      className={`${inputBase} bg-gray-50/70 text-gray-500 cursor-default`}
                      title="Tổng giờ công (tính từ tasks)"
                    />
                  </td>

                  <td className={cellBase}>
                    <AccountTextPicker
                      value={item.tech_user ?? ''}
                      options={devAccounts}
                      placeholder="Chọn Dev..."
                      datalistId={`dev-${item.id}`}
                      onChange={(next) => canEditRow && onUpdate(item.id, { tech_user: next })}
                      className={`${inputBase} ${disabledClass}`}
                    />
                  </td>

                  <td className={cellBase}>
                    <AccountTextPicker
                      value={item.customer_sender ?? ''}
                      options={allAccounts}
                      placeholder="Chọn user..."
                      datalistId={`sender-${item.id}`}
                      onChange={(next) => canEditRow && onUpdate(item.id, { customer_sender: next })}
                      className={`${inputBase} ${disabledClass}`}
                    />
                  </td>

                  <td className={`${cellBase} text-center align-middle`}>
                    <button
                      type="button"
                      className={`cursor-pointer p-1.5 rounded-md transition-all ${canDeleteRow ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100' : 'text-gray-200 cursor-not-allowed opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canDeleteRow) return;
                        onDelete(item.id);
                      }}
                      title="Xóa dự án"
                      disabled={!canDeleteRow}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {expandedProject && taskPanelLayout && (
          <ProjectTasksPanel
            expandedProject={expandedProject}
            layout={taskPanelLayout}
            tasks={tasksByProjectId[expandedProject.id] ?? []}
            accounts={accounts}
            isLoading={taskLoadingByProjectId[expandedProject.id] ?? false}
            draftTask={getDraftTask(expandedProject.id)}
            onDraftChange={(patch) => setDraftTask(expandedProject.id, patch)}
            readOnly={readOnly || !canEditTasksInProject(expandedProject)}
            onAddTask={() => {
              if (readOnly || !canEditTasksInProject(expandedProject)) return;
              addTask(expandedProject.id);
            }}
            onUpdateTask={(taskId, patch) => {
              if (readOnly || !canEditTasksInProject(expandedProject)) return;
              updateTask(expandedProject.id, taskId, patch);
            }}
            onDeleteTask={(taskId) => {
              if (readOnly || !canEditTasksInProject(expandedProject)) return;
              deleteTask(expandedProject.id, taskId);
            }}
          />
        )}
      </div>
    </div>
  );
}
