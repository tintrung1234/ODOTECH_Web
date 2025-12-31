import type { ProjectManagementItem, ProjectTask, TaskStatus } from './interface/type';

export default function ProjectTasksPanel({
  layout,
  tasks,
  isLoading,
  draftTask,
  onDraftChange,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: {
  expandedProject: ProjectManagementItem;
  layout: { top: number; left: number; width: number };
  tasks: ProjectTask[];
  isLoading?: boolean;
  draftTask: ProjectTask;
  onDraftChange: (patch: Partial<ProjectTask>) => void;
  onAddTask: () => void;
  onUpdateTask: (taskId: number, patch: Partial<ProjectTask>) => void;
  onDeleteTask: (taskId: number) => void;
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
            <div className="text-xs font-semibold text-gray-800">Tasks dự án</div>
            <div className="text-[11px] text-gray-500">Bấm lại vào dòng để đóng</div>
          </div>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-4">
              <input
                type="text"
                value={draftTask.tieuDe}
                onChange={(e) => onDraftChange({ tieuDe: e.target.value })}
                className={taskInputBase}
                placeholder="Tiêu đề task..."
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="text"
                value={draftTask.nguoiPhuTrach}
                onChange={(e) => onDraftChange({ nguoiPhuTrach: e.target.value })}
                className={taskInputBase}
                placeholder="Người phụ trách..."
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="date"
                value={draftTask.hanChot}
                onChange={(e) => onDraftChange({ hanChot: e.target.value })}
                className={taskInputBase}
              />
            </div>
            <div className="md:col-span-2">
              <select
                value={draftTask.trangThai}
                onChange={(e) => onDraftChange({ trangThai: e.target.value as TaskStatus })}
                className={taskSelectBase}
              >
                <option value="Chưa làm">{taskStatusLabel('Chưa làm')}</option>
                <option value="Đang làm">{taskStatusLabel('Đang làm')}</option>
                <option value="Đã xong">{taskStatusLabel('Đã xong')}</option>
              </select>
            </div>
            <div className="md:col-span-1 flex">
              <button
                type="button"
                onClick={onAddTask}
                className="w-full h-8 rounded-md bg-teal-600 text-white text-[11px] font-medium px-2"
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
              placeholder="Ghi chú (tuỳ chọn)..."
            />
          </div>

          <div className="mt-3 overflow-auto max-h-56">
            <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr className="sticky top-0 bg-white">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Tiêu đề
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Phụ trách
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Hạn
                  </th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 border-b border-gray-200">
                    Trạng thái
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
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-3 text-xs text-gray-500 italic">
                      {isLoading ? 'Đang tải tasks...' : 'Chưa có task. Thêm task ở phía trên.'}
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={t.tieuDe}
                          onChange={(e) => onUpdateTask(t.id, { tieuDe: e.target.value })}
                          className={taskInputBase}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={t.nguoiPhuTrach}
                          onChange={(e) => onUpdateTask(t.id, { nguoiPhuTrach: e.target.value })}
                          className={taskInputBase}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={t.hanChot}
                          onChange={(e) => onUpdateTask(t.id, { hanChot: e.target.value })}
                          className={taskInputBase}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={t.trangThai}
                          onChange={(e) => onUpdateTask(t.id, { trangThai: e.target.value as TaskStatus })}
                          className={taskSelectBase}
                        >
                          <option value="Chưa làm">{taskStatusLabel('Chưa làm')}</option>
                          <option value="Đang làm">{taskStatusLabel('Đang làm')}</option>
                          <option value="Đã xong">{taskStatusLabel('Đã xong')}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={t.ghiChu ?? ''}
                          onChange={(e) => onUpdateTask(t.id, { ghiChu: e.target.value })}
                          className={taskInputBase}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          onClick={() => onDeleteTask(t.id)}
                          title="Xóa task"
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
