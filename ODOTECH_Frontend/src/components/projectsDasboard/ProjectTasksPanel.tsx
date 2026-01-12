import { useCallback, useMemo, useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import type { Account, ProjectManagementItem, ProjectTask, TaskPriority, TaskStatus } from '../../interface/type';
import { AccountTextPicker } from './AccountPickers';
import { filterAccountsByRoles } from '../../utils/projectsTableHelpers';
import { normalizeRole } from '../../utils/auth';



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
  const [searchTerm, setSearchTerm] = useState('');

  // Helpers
  const accountsById = useMemo(() => {
    const map = new Map<number, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const devAccounts = useMemo(() => filterAccountsByRoles(accounts, normalizeRole, ['dev', 'dev_manager', 'head_tech']), [accounts]);

  const displayPerson = useCallback((raw: string | null | undefined) => {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) return '';
    if (/^\d+$/.test(trimmed)) {
      const a = accountsById.get(Number(trimmed));
      if (a) return (a.name || a.username || trimmed).trim();
    }
    return trimmed;
  }, [accountsById]);

  // People Picker Logic (Simplified for Cards)
  // For now, we'll use a simple native select or input logic for simplicity in cards, 
  // or just text inputs. A robust PeoplePicker is complex to portal correctly for every card.
  // We'll stick to a clean UI first.

  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tasks.filter(t =>
      !term ||
      t.tieuDe.toLowerCase().includes(term) ||
      displayPerson(t.nguoiChinh).toLowerCase().includes(term)
    );
  }, [tasks, searchTerm, displayPerson]);

  const TaskCard = ({ task }: { task: ProjectTask }) => {
    const isCompleted = task.trangThai === 'Đã xong';

    return (
      <div className={`group relative bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${isCompleted ? 'opacity-70' : ''}`}>

        {/* Header: Title & Delete */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <input
            className={`font-semibold text-sm text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-full ${isCompleted ? 'line-through text-gray-500' : ''}`}
            value={task.tieuDe}
            onChange={(e) => onUpdateTask(task.id, { tieuDe: e.target.value })}
            placeholder="Tên công việc..."
            disabled={readOnly}
          />
          {!readOnly && (
            <button
              onClick={() => onDeleteTask(task.id)}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Row 2: Status, Assignee, Deadline */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Status Pill */}
          <select
            value={task.trangThai}
            onChange={(e) => onUpdateTask(task.id, { trangThai: e.target.value as TaskStatus })}
            className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border border-transparent cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${task.trangThai === 'Đã xong' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
              task.trangThai === 'Đang làm' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            disabled={readOnly}
          >
            <option value="Chưa làm">Chưa làm</option>
            <option value="Đang làm">Đang làm</option>
            <option value="Đã xong">Đã xong</option>
          </select>

          {/* Priority */}
          <select
            value={task.mucUuTien ?? ''}
            onChange={(e) => onUpdateTask(task.id, { mucUuTien: e.target.value as TaskPriority })}
            className={`text-[10px] font-medium py-0.5 pl-1 pr-6 rounded border border-gray-200 bg-white cursor-pointer outline-none hover:bg-gray-50`}
            disabled={readOnly}
            style={{ backgroundImage: 'none' }} // Hide default arrow if we want custom look, but standard is fine for dense UI
          >
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>


          {/* Assignee Picker */}
          <div className="w-24 relative group/user ml-auto">
            <AccountTextPicker
              value={task.nguoiChinh ?? ''}
              options={devAccounts}
              placeholder="Người làm"
              datalistId={`task-${task.id}-assignee`}
              onChange={(next) => onUpdateTask(task.id, { nguoiChinh: next })}
              className="bg-transparent border-none text-[10px] text-gray-600 p-0 text-right w-full focus:ring-0 placeholder-gray-300"
            />
          </div>
        </div>

        {/* Row 3: Hrs only (Progress removed) */}
        <div className="flex items-center justify-end gap-2 text-[10px] text-gray-400">
          <Clock size={10} />
          <input
            type="number"
            className="w-8 bg-transparent border-none p-0 text-[10px] text-right focus:ring-0"
            value={task.gioCong ?? 0}
            onChange={(e) => onUpdateTask(task.id, { gioCong: Number(e.target.value) })}
            placeholder="0"
            disabled={readOnly}
          />
          <span>h</span>
        </div>
      </div >
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: layout.top,
        left: layout.left,
        width: layout.width,
        maxHeight: '600px'
      }}
      className="z-5000 flex flex-col shadow-2xl rounded-xl border border-gray-200 bg-white ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Tasks</h3>
          <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-8 pr-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-teal-500/20 outline-none w-32 focus:w-48 transition-all"
              placeholder="Tìm task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50/30 min-h-[200px] max-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs italic">
            Chưa có tasks. Thêm task mới bên dưới.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Footer: Add Draft */}
      {!readOnly && (
        <div className="p-3 border-t border-gray-100 bg-white rounded-b-xl">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Thêm công việc mới</div>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className="w-full text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                placeholder="Nhập tiêu đề task..."
                value={draftTask.tieuDe}
                onChange={(e) => onDraftChange({ tieuDe: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAddTask();
                }}
              />
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:border-teal-500 outline-none"
                  value={draftTask.hanChot}
                  onChange={(e) => onDraftChange({ hanChot: e.target.value })}
                />
                <AccountTextPicker
                  value={draftTask.nguoiChinh ?? ''}
                  options={devAccounts}
                  placeholder="Người làm..."
                  datalistId={`draft-assignee-${expandedProject.id}`}
                  onChange={(next) => onDraftChange({ nguoiChinh: next })}
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={onAddTask}
              disabled={!draftTask.tieuDe}
              className="h-auto px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
