/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';

import type {
  Account,
  ProjectManagementItem,
  ProjectMgmtPriority,
  ProjectMgmtStatus,
  ProjectType,
} from '../../interface/type';
import {
  statusLabel,
  priorityLabel,
} from '../../utils/projectUtils';

import ProjectTasksPanel from './ProjectTasksPanel';
import { normalizeRole } from '../../utils/auth';

import { AccountIdPicker, AccountTextPicker } from './AccountPickers';
import { useProjectTasks } from '../../utils/useProjectTasks';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  accountValueToken,
  filterAccountsByRoles,
} from '../../utils/projectsTableHelpers';

// Utility for Avatar colors
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-100 text-red-600',
    'bg-orange-100 text-orange-600',
    'bg-amber-100 text-amber-600',
    'bg-green-100 text-green-600',
    'bg-emerald-100 text-emerald-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-purple-100 text-purple-600',
    'bg-fuchsia-100 text-fuchsia-600',
    'bg-pink-100 text-pink-600',
    'bg-rose-100 text-rose-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const Avatar = ({ name, size = 'sm' }: { name?: string | null; size?: 'sm' | 'xs' }) => {
  const n = (name || '?').trim();
  const initial = n.charAt(0).toUpperCase();
  const colorClass = getAvatarColor(n);
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-[10px]';

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${colorClass} ring-1 ring-white shadow-sm cursor-help`} title={n}>
      {initial}
    </div>
  );
};

// Status Pill
const StatusPill = ({ status }: { status: ProjectMgmtStatus }) => {
  const styles: Record<string, string> = {
    'completed': 'bg-blue-100 text-blue-700 border-blue-200',
    'on_going': 'bg-green-100 text-green-700 border-green-200',
    'pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'cancel': 'bg-gray-100 text-gray-600 border-gray-200',
  };
  // Fallback
  const safeStatus = PROJECT_STATUSES.includes(status) ? status : 'not_started';
  const style = styles[safeStatus] || styles['pending'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style}`}>
      {statusLabel(safeStatus)}
    </span>
  );
};

// Priority Badge
const PriorityBadge = ({ priority }: { priority: string }) => {
  const p = priority || 'normal';
  let color = 'text-gray-500';
  let icon = <MoreHorizontal size={14} />;

  if (p === 'urgent') { color = 'text-red-600'; icon = <AlertCircle size={14} />; }
  else if (p === 'high') { color = 'text-orange-500'; icon = <AlertCircle size={14} />; }
  else if (p === 'medium') { color = 'text-blue-500'; icon = <Clock size={14} />; }
  else if (p === 'low') { color = 'text-gray-400'; icon = <CheckCircle2 size={14} />; }

  return (
    <div className={`flex items-center gap-1.5 ${color}`} title={priorityLabel(p as any)}>
      {icon}
      <span className="text-xs font-medium">{priorityLabel(p as any)}</span>
    </div>
  );
};


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
  // Styles
  const headerBase = 'px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white sticky top-0 z-10 border-b border-gray-200 whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.02)]';
  const cellBase = 'px-3 py-2.5 h-12 align-middle border-b border-gray-100 text-sm overflow-hidden text-ellipsis whitespace-nowrap transition-colors';
  const stickyCellBase = 'px-3 py-2.5 h-12 align-middle border-b border-gray-100 text-sm transition-colors z-20 sticky left-0 bg-white';

  const inputBase =
    'w-full bg-transparent border-none p-0 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:bg-white rounded transition-colors truncate font-medium';

  // Sticky Logic
  const stickyRightDivider = "z-999 after:content-[''] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-200 after:pointer-events-none";

  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  // Task Panel Logic
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

  // Load Tasks Effect
  useEffect(() => {
    let cancelled = false;
    const missingIds = projects
      .map((p) => p.id)
      .filter((id) => tasksByProjectId[id] == null && taskLoadingByProjectId[id] !== true);

    if (missingIds.length === 0) return;

    const runWorker = async () => {
      while (!cancelled && missingIds.length > 0) {
        const id = missingIds.shift();
        if (id == null) return;
        await loadTasks(id);
      }
    };
    void runWorker();
    return () => { cancelled = true; };
  }, [loadTasks, projects, taskLoadingByProjectId, tasksByProjectId]);

  // Expand logic
  useEffect(() => {
    if (!expandedProjectId) return;
    void loadTasks(expandedProjectId);
  }, [expandedProjectId, apiBaseUrl]);

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
    const raf = requestAnimationFrame(() => updateTaskPanelLayout(expandedProjectId));
    return () => cancelAnimationFrame(raf);
  }, [expandedProjectId, projects.length]);

  useEffect(() => {
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


  // Helper Data
  const accountsById = useMemo(() => {
    const map = new Map<number, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const saleAccounts = useMemo(() => filterAccountsByRoles(accounts, normalizeRole, ['sale', 'sales_manager', 'head_sales']), [accounts]);
  const pmAccounts = useMemo(() => filterAccountsByRoles(accounts, normalizeRole, ['dev_manager', 'head_tech', 'sales_manager', 'head_sales']), [accounts]);
  const devAccounts = useMemo(() => filterAccountsByRoles(accounts, normalizeRole, ['dev', 'dev_manager', 'head_tech']), [accounts]);

  const PRIORITIES: ProjectMgmtPriority[] = ['', 'low', 'medium', 'high', 'urgent'];

  // Formatters
  const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
  const formatVnd = (val: unknown) => {
    const n = Number(val);
    return Number.isFinite(n) ? vndFormatter.format(Math.round(n)) : vndFormatter.format(0);
  };

  const expandedProject = useMemo(() => projects.find((p) => p.id === expandedProjectId) ?? null, [projects, expandedProjectId]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div ref={scrollContainerRef} className="overflow-auto flex-1 relative min-h-[400px]">
        <table className="min-w-max w-full border-separate border-spacing-0 bg-white">
          <thead>
            <tr>
              <th className={`${headerBase} ${stickyRightDivider} left-0 w-10 text-center !px-1`}>
                #
              </th>
              <th className={`${headerBase} ${stickyRightDivider} w-24`} style={{ left: '2.5rem' }}>Mã dự án</th>
              <th className={`${headerBase} ${stickyRightDivider} w-64`} style={{ left: '8.5rem' }}>Tên dự án</th>

              <th className={`${headerBase} w-32`}>Loại dự án</th>
              <th className={`${headerBase} w-32`}>Khách hàng</th>
              <th className={`${headerBase} w-32`}>PM / Sale</th>
              <th className={`${headerBase} w-32`}>Trạng thái</th>
              <th className={`${headerBase} w-32 transition-colors hover:bg-gray-50`}>Ưu tiên</th>
              <th className={`${headerBase} w-36`}>Tiến độ</th>

              <th className={`${headerBase} w-32 text-right`}>Ngân sách</th>
              <th className={`${headerBase} w-32 text-right`}>Doanh thu</th>
              <th className={`${headerBase} w-32 text-right`}>Khách trả</th>
              <th className={`${headerBase} w-32 text-right`}>Thực chi</th>
              <th className={`${headerBase} w-32`}>TT thanh toán</th>

              <th className={`${headerBase} w-32`}>Bắt đầu</th>
              <th className={`${headerBase} w-32`}>Deadline</th>
              <th className={`${headerBase} w-32`}>Hoàn thành</th>
              <th className={`${headerBase} w-32 text-right`}>Tổng giờ</th>

              <th className={`${headerBase} w-40`}>Công nghệ</th>
              <th className={`${headerBase} w-40`}>Domain</th>
              <th className={`${headerBase} w-40`}>Production URL</th>

              <th className={`${headerBase} w-40`}>Người làm</th>
              <th className={`${headerBase} w-40`}>Kỹ thuật viên</th>
              <th className={`${headerBase} w-40`}>Người gửi KH</th>

              <th className={`${headerBase} w-48`}>Mô tả</th>
              <th className={`${headerBase} w-48`}>Yêu cầu</th>
              <th className={`${headerBase} w-32`}>Nguồn</th>

              <th className={`${headerBase} w-16 text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={28} className="py-12 text-center text-gray-500 italic">
                  Không có dự án nào.
                </td>
              </tr>
            ) : (
              projects.map((item) => {
                const canEditRow = !readOnly && canEditProject(item);
                const canDeleteRow = !readOnly && canDeleteProject(item);
                const isSelected = selectedId === item.id;
                const isExpanded = expandedProjectId === item.id;

                // Colors for row
                const rowBg = isSelected ? 'bg-teal-50/40' : (isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/80');

                return (
                  <Fragment key={item.id}>
                    <tr
                      ref={(el) => { rowRefs.current[item.id] = el; }}
                      className={`group transition-colors ${rowBg}`}
                      onClick={() => {
                        onSelect(item.id);
                        if (expandedProjectId === item.id) setExpandedProjectId(null);
                        else setExpandedProjectId(item.id);
                      }}
                    >
                      {/* Expand Toggle + Index */}
                      <td className={`${stickyCellBase} ${stickyRightDivider} text-center !px-1 text-gray-400 ${rowBg}`} style={{ width: '2.5rem' }}>
                        <div className="flex justify-center cursor-pointer hover:text-teal-600" onClick={(e) => {
                          e.stopPropagation();
                          setExpandedProjectId(prev => prev === item.id ? null : item.id);
                        }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </td>

                      {/* Project Code */}
                      <td className={`${stickyCellBase} ${stickyRightDivider} font-mono font-medium text-gray-600 ${rowBg}`} style={{ left: '2.5rem', width: '6rem' }}>
                        {item.project_code}
                      </td>

                      {/* Name */}
                      <td className={`${stickyCellBase} ${stickyRightDivider} ${rowBg}`} style={{ left: '8.5rem', width: '16rem' }}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => canEditRow && onUpdate(item.id, { name: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} font-semibold text-gray-800`}
                          placeholder="Tên dự án..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Project Type */}
                      <td className={cellBase}>
                        <select
                          value={item.project_type || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { project_type: e.target.value as ProjectType })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-gray-700 cursor-pointer`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {PROJECT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t || '---'}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Client */}
                      <td className={cellBase}>
                        <div className="relative w-full h-full flex items-center">
                          <div className="relative z-0 pointer-events-none">
                            {item.client_id && accountsById.has(item.client_id) ? (
                              <Avatar name={accountsById.get(item.client_id)?.name} />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 border-dashed flex items-center justify-center text-[10px] text-gray-400">KH</div>
                            )}
                          </div>
                          {canEditRow && (
                            <AccountIdPicker
                              valueId={item.client_id}
                              accountsById={accountsById}
                              options={accounts}
                              placeholder="Chọn KH"
                              datalistId={`client-${item.id}`}
                              onChangeId={(next) => canEditRow && onUpdate(item.id, { client_id: next })}
                              tokenForAccount={accountValueToken}
                              className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 focus:opacity-100 bg-white text-xs px-1 text-center cursor-pointer transition-opacity z-10"
                            />
                          )}
                        </div>
                      </td>

                      {/* PM / Sale (Avatars) */}
                      <td className={cellBase}>
                        <div className="flex w-full h-full items-center">
                          {/* Zone 1: PM */}
                          <div className="flex-1 h-full relative border-r border-gray-100 flex items-center justify-center group/pm">
                            <div className="relative z-0 pointer-events-none">
                              {item.pm_id && accountsById.has(item.pm_id) ? (
                                <Avatar name={accountsById.get(item.pm_id)?.name} />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 border-dashed flex items-center justify-center text-[10px] text-gray-400">PM</div>
                              )}
                            </div>
                            {canEditRow && (
                              <AccountIdPicker
                                valueId={item.pm_id}
                                accountsById={accountsById}
                                options={pmAccounts}
                                placeholder="Chọn PM"
                                datalistId={`pm-${item.id}`}
                                onChangeId={(next) => canEditRow && onUpdate(item.id, { pm_id: next })}
                                tokenForAccount={accountValueToken}
                                className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 focus:opacity-100 bg-white text-xs px-1 text-center cursor-pointer transition-opacity z-10"
                              />
                            )}
                          </div>

                          {/* Zone 2: Sale */}
                          <div className="flex-1 h-full relative flex items-center justify-center group/sale">
                            <div className="relative z-0 pointer-events-none">
                              {item.sale_id && accountsById.has(item.sale_id) ? (
                                <Avatar name={accountsById.get(item.sale_id)?.name} />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 border-dashed flex items-center justify-center text-[10px] text-gray-400">Sale</div>
                              )}
                            </div>
                            {canEditRow && (
                              <AccountIdPicker
                                valueId={item.sale_id}
                                accountsById={accountsById}
                                options={saleAccounts}
                                placeholder="Chọn Sale"
                                datalistId={`sale-${item.id}`}
                                onChangeId={(next) => canEditRow && onUpdate(item.id, { sale_id: next })}
                                tokenForAccount={accountValueToken}
                                className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 focus:opacity-100 bg-white text-xs px-1 text-center cursor-pointer transition-opacity z-10"
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className={cellBase}>
                        <div className="relative w-full h-full flex items-center">
                          <StatusPill status={item.status} />
                          {canEditRow && (
                            <select
                              value={item.status}
                              onChange={(e) => onUpdate(item.id, { status: e.target.value as ProjectMgmtStatus })}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            >
                              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className={cellBase}>
                        <div className="relative w-full h-full flex items-center">
                          <PriorityBadge priority={item.priority || 'medium'} />
                          {canEditRow && (
                            <select
                              value={item.priority ?? ''}
                              onChange={(e) => onUpdate(item.id, { priority: e.target.value as ProjectMgmtPriority })}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            >
                              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Progress */}
                      <td className={cellBase}>
                        <div className="flex flex-col gap-1 w-full h-full justify-center relative">
                          <div className="flex justify-between text-[10px] text-gray-500">
                            <span>{Math.round(item.progress_percent || 0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${(item.progress_percent || 0) >= 100 ? 'bg-green-500' :
                                (item.progress_percent || 0) > 75 ? 'bg-teal-500' :
                                  (item.progress_percent || 0) > 25 ? 'bg-blue-500' : 'bg-gray-400'
                                }`}
                              style={{ width: `${Math.min(100, item.progress_percent || 0)}%` }}
                            />
                          </div>
                          {canEditRow && (
                            <input
                              type="range"
                              min="0" max="100"
                              value={item.progress_percent || 0}
                              onChange={(e) => onUpdate(item.id, { progress_percent: Number(e.target.value) })}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-e-resize"
                            />
                          )}
                        </div>
                      </td>

                      {/* Finance Columns */}
                      <td className={`${cellBase} text-right font-mono`}>
                        <span className="text-blue-600">{formatVnd(item.budget)}</span>
                      </td>
                      <td className={`${cellBase} text-right font-mono`}>
                        <span className="text-gray-700">{formatVnd(item.contract_value)}</span>
                      </td>
                      <td className={`${cellBase} text-right font-mono`}>
                        <span className="text-green-600">{formatVnd(item.deposit_received)}</span>
                      </td>
                      <td className={`${cellBase} text-right font-mono`}>
                        <span className="text-red-500 hover:text-red-700 cursor-help" title="Chi phí thực">{formatVnd(item.actual_cost)}</span>
                      </td>
                      <td className={cellBase}>
                        <input
                          type="text"
                          value={item.payment_status || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { payment_status: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-gray-700`}
                          placeholder="TT thanh toán..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Dates */}
                      <td className={cellBase}>
                        <div className="flex items-center gap-1.5 text-gray-600 w-full h-full">
                          <Clock size={14} className="shrink-0" />
                          {canEditRow ? (
                            <input
                              type="date"
                              value={item.start_date}
                              onChange={(e) => canEditRow && onUpdate(item.id, { start_date: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border-none p-0 text-xs w-full h-full text-gray-600 focus:ring-0 cursor-pointer"
                            />
                          ) : (
                            <span className="text-xs text-gray-600 truncate">{formatDate(item.start_date)}</span>
                          )}
                        </div>
                      </td>
                      <td className={cellBase}>
                        <div className="flex items-center gap-1.5 text-gray-600 w-full h-full">
                          <Calendar size={14} className={`shrink-0 ${item.deadline < new Date().toISOString().split('T')[0] ? 'text-red-500' : ''}`} />
                          {canEditRow ? (
                            <input
                              type="date"
                              value={item.deadline}
                              onChange={(e) => canEditRow && onUpdate(item.id, { deadline: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className={`bg-transparent border-none p-0 text-xs w-full h-full focus:ring-0 cursor-pointer ${item.deadline < new Date().toISOString().split('T')[0] ? 'text-red-600 font-medium' : 'text-gray-600'}`}
                            />
                          ) : (
                            <span className={`text-xs truncate ${item.deadline < new Date().toISOString().split('T')[0] ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{formatDate(item.deadline)}</span>
                          )}
                        </div>
                      </td>
                      <td className={cellBase}>
                        <div className="flex items-center gap-1.5 text-gray-600 w-full h-full">
                          <Calendar size={14} className="shrink-0" />
                          {canEditRow ? (
                            <input
                              type="datetime-local"
                              value={item.completed_at ? new Date(item.completed_at).toISOString().slice(0, 16) : ''}
                              onChange={(e) => canEditRow && onUpdate(item.id, { completed_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                              onClick={(e) => e.stopPropagation()}
                              disabled={!canEditRow}
                              className="bg-transparent border-none p-0 text-xs w-full h-full text-gray-600 focus:ring-0 cursor-pointer"
                            />
                          ) : (
                            <span className="text-xs text-gray-600 truncate">{formatDateTime(item.completed_at)}</span>
                          )}
                        </div>
                      </td>
                      <td className={`${cellBase} text-right font-mono`}>
                        <input
                          type="number"
                          step="0.5"
                          value={item.total_hours || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { total_hours: parseFloat(e.target.value) || 0 })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-right text-gray-700`}
                          placeholder="0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Technology & URLs */}
                      <td className={cellBase}>
                        <input
                          type="text"
                          value={item.technology_stack || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { technology_stack: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-gray-700`}
                          placeholder="React, Node.js..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className={cellBase}>
                        <input
                          type="text"
                          value={item.domain_url || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { domain_url: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-blue-600 hover:underline`}
                          placeholder="example.com"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className={cellBase}>
                        <input
                          type="text"
                          value={item.production_url || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { production_url: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-blue-600 hover:underline`}
                          placeholder="https://..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Assignees (Text for now, or TagInput) */}
                      <td className={cellBase}>
                        <div className="w-full h-full relative group/assignee">
                          {canEditRow ? (
                            <AccountTextPicker
                              value={item.assignee || ''}
                              options={devAccounts}
                              placeholder="Người làm..."
                              datalistId={`assignee-${item.id}`}
                              onChange={(next) => onUpdate(item.id, { assignee: next })}
                              className="w-full h-full bg-transparent border-none p-0 text-xs focus:ring-0 text-gray-700 placeholder-slate-300"
                            />
                          ) : (
                            <div className="truncate max-w-[150px] flex items-center h-full" title={item.assignee ?? ''}>
                              {item.assignee || <span className="text-gray-300 italic">Chưa giao</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={cellBase}>
                        <div className="relative w-full h-full flex items-center">
                          <div className="relative z-0 pointer-events-none">
                            {item.tech_user_id && accountsById.has(item.tech_user_id) ? (
                              <Avatar name={accountsById.get(item.tech_user_id)?.name} />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 border-dashed flex items-center justify-center text-[10px] text-gray-400">KTV</div>
                            )}
                          </div>
                          {canEditRow && (
                            <AccountIdPicker
                              valueId={item.tech_user_id ?? null}
                              accountsById={accountsById}
                              options={devAccounts}
                              placeholder="Chọn KTV"
                              datalistId={`tech-user-${item.id}`}
                              onChangeId={(next) => canEditRow && onUpdate(item.id, { tech_user_id: next })}
                              tokenForAccount={accountValueToken}
                              className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 focus:opacity-100 bg-white text-xs px-1 text-center cursor-pointer transition-opacity z-10"
                            />
                          )}
                        </div>
                      </td>
                      <td className={cellBase}>
                        <div className="relative w-full h-full flex items-center">
                          <div className="relative z-0 pointer-events-none">
                            {item.customer_sender_id && accountsById.has(item.customer_sender_id) ? (
                              <Avatar name={accountsById.get(item.customer_sender_id)?.name} />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 border-dashed flex items-center justify-center text-[10px] text-gray-400">NG</div>
                            )}
                          </div>
                          {canEditRow && (
                            <AccountIdPicker
                              valueId={item.customer_sender_id ?? null}
                              accountsById={accountsById}
                              options={accounts}
                              placeholder="Chọn người gửi"
                              datalistId={`customer-sender-${item.id}`}
                              onChangeId={(next) => canEditRow && onUpdate(item.id, { customer_sender_id: next })}
                              tokenForAccount={accountValueToken}
                              className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 focus:opacity-100 bg-white text-xs px-1 text-center cursor-pointer transition-opacity z-10"
                            />
                          )}
                        </div>
                      </td>

                      {/* Description & Requirements */}
                      <td className={cellBase}>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { description: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-gray-700`}
                          placeholder="Mô tả..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className={cellBase}>
                        <textarea
                          value={item.requirements || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { requirements: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-gray-700`}
                          placeholder="Yêu cầu..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className={cellBase}>
                        <input
                          type="text"
                          value={item.source || ''}
                          onChange={(e) => canEditRow && onUpdate(item.id, { source: e.target.value })}
                          disabled={!canEditRow}
                          className={`${inputBase} text-gray-700`}
                          placeholder="Nguồn..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* Actions */}
                      <td className={`${cellBase} text-center`}>
                        {canDeleteRow && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Task Panel Portal/Overlay */}
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
