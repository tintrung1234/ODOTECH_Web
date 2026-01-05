import { useCallback, useMemo, useState } from 'react';

import type { Account, ProjectManagementItem, ProjectTask, TaskPriority, TaskStatus } from './interface/type';

export default function ProjectTasksPanel({
  expandedProject,
  layout,
  tasks,
  accounts,
  isLoading,
  draftTask,
  onDraftChange,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  readOnly = false,
}: {
  expandedProject: ProjectManagementItem;
  layout: { top: number; left: number; width: number };
  tasks: ProjectTask[];
  accounts: Account[];
  isLoading?: boolean;
  draftTask: ProjectTask;
  onDraftChange: (patch: Partial<ProjectTask>) => void;
  onAddTask: () => void;
  onUpdateTask: (taskId: number, patch: Partial<ProjectTask>) => void;
  onDeleteTask: (taskId: number) => void;
  readOnly?: boolean;
}) {
  const taskInputBase =
    'w-full h-8 bg-white border border-gray-200 rounded-md px-2 text-[11px] text-gray-700 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none';

  const taskTextareaBase =
    'w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-700 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none';

  const taskSelectBase =
    'w-full h-8 bg-white border border-gray-200 rounded-md px-2 text-[11px] text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer';

  const taskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'Chưa làm':
        return 'Chưa làm';
      case 'Đang làm':
        return 'Đang làm';
      case 'Đã xong':
        return 'Đã xong';
      default:
        return status;
    }
  };

  const taskPriorityLabel = (p: TaskPriority) => {
    if (p === 'low') return 'Thấp';
    if (p === 'medium') return 'Trung bình';
    if (p === 'high') return 'Cao';
    return 'Khẩn';
  };

  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | ''>('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<TaskPriority | ''>('');

  const accountsById = useMemo(() => {
    const map = new Map<number, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const displayPerson = useCallback(
    (raw: string | null | undefined) => {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) return '';
    if (/^\d+$/.test(trimmed)) {
      const a = accountsById.get(Number(trimmed));
      if (a) return (a.name || a.username || trimmed).trim();
    }
    return trimmed;
    },
    [accountsById],
  );

  const peopleOptions = useMemo(() => {
    const fromAccounts = accounts.map((a) => (a.username || a.name || '').trim()).filter(Boolean);

    const fromTasksAndDraft = [
      ...tasks.flatMap((t) => [t.nguoiChinh, t.nguoiHoTro, t.nguoiPhuTrach]),
      draftTask.nguoiChinh,
      draftTask.nguoiHoTro,
      draftTask.nguoiPhuTrach,
    ]
      .map((v) => displayPerson(v))
      .filter(Boolean);

    return Array.from(new Set([...fromAccounts, ...fromTasksAndDraft])).sort((a, b) =>
      a.localeCompare(b, 'vi'),
    );
  }, [accounts, tasks, draftTask.nguoiChinh, draftTask.nguoiHoTro, draftTask.nguoiPhuTrach, displayPerson]);

  const peopleDatalistId = useMemo(
    () => `people-options-${String(expandedProject.project_code ?? 'project').replace(/\s+/g, '-')}`,
    [expandedProject.project_code],
  );

  const filteredTasks = useMemo(() => {
    const term = taskSearchTerm.trim().toLowerCase();
    return tasks.filter((t) => {
      if (taskStatusFilter && t.trangThai !== taskStatusFilter) return false;
      if (taskPriorityFilter && (t.mucUuTien ?? '') !== taskPriorityFilter) return false;
      if (!term) return true;
      const haystack = [
        t.tieuDe,
        displayPerson(t.nguoiChinh),
        displayPerson(t.nguoiHoTro),
        displayPerson(t.nguoiPhuTrach),
        t.ghiChu ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [tasks, taskSearchTerm, taskStatusFilter, taskPriorityFilter, displayPerson]);

  return (
    <div
      style={{
        position: 'absolute',
        top: layout.top,
        left: layout.left,
        width: layout.width,
      }}
      className="z-40"
    >
      <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-gray-800">
              Tasks: {expandedProject.project_code} — {expandedProject.name}
            </div>
            <div className="text-[11px] text-gray-500">Bấm lại vào dòng để đóng</div>
          </div>
        </div>

        <div className="p-3">
          <datalist id={peopleDatalistId}>
            {peopleOptions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
                className="w-full h-8 pl-9 pr-3 bg-white border border-gray-200 rounded-md text-[11px] text-gray-700 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="Lọc task (tiêu đề / người / ghi chú)..."
                disabled={readOnly}
              />
            </div>

            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value as TaskStatus | '')}
              className="h-8 px-2 bg-white border border-gray-200 rounded-md text-[11px] text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer"
              aria-label="Lọc trạng thái task"
              disabled={readOnly}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Chưa làm">{taskStatusLabel('Chưa làm')}</option>
              <option value="Đang làm">{taskStatusLabel('Đang làm')}</option>
              <option value="Đã xong">{taskStatusLabel('Đã xong')}</option>
            </select>

            <select
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value as TaskPriority | '')}
              className="h-8 px-2 bg-white border border-gray-200 rounded-md text-[11px] text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer"
              aria-label="Lọc ưu tiên task"
              disabled={readOnly}
            >
              <option value="">Tất cả ưu tiên</option>
              <option value="low">{taskPriorityLabel('low')}</option>
              <option value="medium">{taskPriorityLabel('medium')}</option>
              <option value="high">{taskPriorityLabel('high')}</option>
              <option value="urgent">{taskPriorityLabel('urgent')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-4">
              <input
                type="text"
                value={draftTask.tieuDe}
                onChange={(e) => onDraftChange({ tieuDe: e.target.value })}
                className={taskInputBase}
                placeholder="Tiêu đề task (bắt buộc)..."
                title="Tiêu đề task"
                disabled={readOnly}
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                list={peopleDatalistId}
                value={displayPerson(draftTask.nguoiChinh)}
                onChange={(e) => onDraftChange({ nguoiChinh: e.target.value })}
                className={taskInputBase}
                placeholder="Chọn/nhập người chính..."
                title="Người chính (chọn trong danh sách hoặc nhập tự do)"
                disabled={readOnly}
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                list={peopleDatalistId}
                value={displayPerson(draftTask.nguoiHoTro)}
                onChange={(e) => onDraftChange({ nguoiHoTro: e.target.value })}
                className={taskInputBase}
                placeholder="Chọn/nhập người hỗ trợ (tuỳ chọn)..."
                title="Người hỗ trợ (tuỳ chọn)"
                disabled={readOnly}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-col gap-0.5">
                <input
                  type="date"
                  value={draftTask.batDau ?? ''}
                  onChange={(e) => onDraftChange({ batDau: e.target.value })}
                  className={taskInputBase}
                  title="Ngày bắt đầu"
                  aria-label="Ngày bắt đầu"
                  disabled={readOnly}
                />
                <div className="text-[10px] text-gray-500">Ngày bắt đầu (YYYY-MM-DD)</div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-col gap-0.5">
                <input
                  type="date"
                  value={draftTask.hanChot}
                  onChange={(e) => onDraftChange({ hanChot: e.target.value })}
                  className={taskInputBase}
                  title="Deadline (hạn chót)"
                  aria-label="Deadline (hạn chót)"
                  disabled={readOnly}
                />
                <div className="text-[10px] text-gray-500">Deadline / hạn chót (YYYY-MM-DD)</div>
              </div>
            </div>
            <div className="md:col-span-2">
              <select
                value={draftTask.trangThai}
                onChange={(e) => onDraftChange({ trangThai: e.target.value as TaskStatus })}
                className={taskSelectBase}
                disabled={readOnly}
              >
                <option value="Chưa làm">{taskStatusLabel('Chưa làm')}</option>
                <option value="Đang làm">{taskStatusLabel('Đang làm')}</option>
                <option value="Đã xong">{taskStatusLabel('Đã xong')}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <select
                value={(draftTask.mucUuTien ?? '') as TaskPriority | ''}
                onChange={(e) => onDraftChange({ mucUuTien: e.target.value as TaskPriority })}
                className={taskSelectBase}
                disabled={readOnly}
              >
                <option value="">Ưu tiên</option>
                <option value="low">{taskPriorityLabel('low')}</option>
                <option value="medium">{taskPriorityLabel('medium')}</option>
                <option value="high">{taskPriorityLabel('high')}</option>
                <option value="urgent">{taskPriorityLabel('urgent')}</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <div className="flex flex-col gap-0.5">
                <input
                  type="number"
                  step="1"
                  min={0}
                  max={100}
                  value={Number.isFinite(Number(draftTask.tienDo)) ? Number(draftTask.tienDo) : 0}
                  onChange={(e) => onDraftChange({ tienDo: Number(e.target.value) })}
                  className={taskInputBase}
                  placeholder="% (0-100)"
                  title="Tiến độ (%)"
                  disabled={readOnly}
                />
                <div className="text-[10px] text-gray-500">Tiến độ 0–100%</div>
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="flex flex-col gap-0.5">
                <input
                  type="number"
                  step="0.25"
                  min={0}
                  value={Number.isFinite(Number(draftTask.gioCong)) ? Number(draftTask.gioCong) : 0}
                  onChange={(e) => onDraftChange({ gioCong: Number(e.target.value) })}
                  className={taskInputBase}
                  placeholder="Giờ (vd 1.5)"
                  title="Giờ công"
                  disabled={readOnly}
                />
                <div className="text-[10px] text-gray-500">Giờ công (vd 1.5)</div>
              </div>
            </div>
            <div className="md:col-span-1 flex">
              <button
                type="button"
                onClick={onAddTask}
                className={`cursor-pointer w-full h-8 rounded-md text-[11px] font-medium px-2 ${readOnly ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-teal-600 text-white'}`}
                disabled={readOnly}
              >
                Thêm
              </button>
            </div>
          </div>

          <div className="mt-2">
            <textarea
              rows={2}
              value={draftTask.ghiChu ?? ''}
              onChange={(e) => onDraftChange({ ghiChu: e.target.value })}
              className={taskTextareaBase}
              placeholder="Ghi chú (tuỳ chọn) — mô tả ngắn / yêu cầu / link..."
              title="Ghi chú (tuỳ chọn)"
              disabled={readOnly}
            />
          </div>

          <div className="mt-3 overflow-auto max-h-56">
            <table className="min-w-[1200px] w-full border-collapse">
              <thead>
                <tr className="sticky top-0 bg-white">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Tiêu đề
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Người chính
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Hỗ trợ
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Bắt đầu
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Deadline
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Trạng thái
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Ưu tiên
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Tiến độ
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Giờ công
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Ghi chú
                  </th>
                  <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200 w-16">
                    Xóa
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-2 py-3 text-xs text-gray-500 italic">
                      {isLoading
                        ? 'Đang tải tasks...'
                        : tasks.length === 0
                          ? 'Chưa có task. Thêm task ở phía trên.'
                          : 'Không có task phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={t.tieuDe}
                          onChange={(e) => onUpdateTask(t.id, { tieuDe: e.target.value })}
                          className={taskInputBase}
                          title="Tiêu đề task"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          list={peopleDatalistId}
                          value={displayPerson(t.nguoiChinh)}
                          onChange={(e) => onUpdateTask(t.id, { nguoiChinh: e.target.value })}
                          className={taskInputBase}
                          title="Người chính"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          list={peopleDatalistId}
                          value={displayPerson(t.nguoiHoTro)}
                          onChange={(e) => onUpdateTask(t.id, { nguoiHoTro: e.target.value })}
                          className={taskInputBase}
                          title="Người hỗ trợ"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={t.batDau ?? ''}
                          onChange={(e) => onUpdateTask(t.id, { batDau: e.target.value })}
                          className={taskInputBase}
                          title="Ngày bắt đầu"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={t.hanChot}
                          onChange={(e) => onUpdateTask(t.id, { hanChot: e.target.value })}
                          className={taskInputBase}
                          title="Deadline (hạn chót)"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={t.trangThai}
                          onChange={(e) => onUpdateTask(t.id, { trangThai: e.target.value as TaskStatus })}
                          className={taskSelectBase}
                          disabled={readOnly}
                        >
                          <option value="Chưa làm">{taskStatusLabel('Chưa làm')}</option>
                          <option value="Đang làm">{taskStatusLabel('Đang làm')}</option>
                          <option value="Đã xong">{taskStatusLabel('Đã xong')}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={(t.mucUuTien ?? '') as TaskPriority | ''}
                          onChange={(e) => onUpdateTask(t.id, { mucUuTien: e.target.value as TaskPriority })}
                          className={taskSelectBase}
                          disabled={readOnly}
                        >
                          <option value="">-</option>
                          <option value="low">{taskPriorityLabel('low')}</option>
                          <option value="medium">{taskPriorityLabel('medium')}</option>
                          <option value="high">{taskPriorityLabel('high')}</option>
                          <option value="urgent">{taskPriorityLabel('urgent')}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="1"
                          min={0}
                          max={100}
                          value={Number.isFinite(Number(t.tienDo)) ? Number(t.tienDo) : 0}
                          onChange={(e) => onUpdateTask(t.id, { tienDo: Number(e.target.value) })}
                          className={taskInputBase}
                          title="Tiến độ (%)"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.25"
                          min={0}
                          value={Number.isFinite(Number(t.gioCong)) ? Number(t.gioCong) : 0}
                          onChange={(e) => onUpdateTask(t.id, { gioCong: Number(e.target.value) })}
                          className={taskInputBase}
                          title="Giờ công"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <textarea
                          value={t.ghiChu ?? ''}
                          onChange={(e) => onUpdateTask(t.id, { ghiChu: e.target.value })}
                          className={taskInputBase}
                          title="Ghi chú"
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          className={`p-1.5 rounded-md ${readOnly ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          onClick={() => onDeleteTask(t.id)}
                          title="Xóa task"
                          disabled={readOnly}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
