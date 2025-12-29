import type { ProjectManagementItem, ProjectMgmtPriority, ProjectMgmtStatus } from '../../types/Interface';
import {
  priorityClassName,
  priorityLabel,
  statusLabel,
} from './projectUtils';

export default function ProjectsTable({
  projects,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
}: {
  projects: ProjectManagementItem[];
  selectedId: number | null;
  today: Date;
  onSelect: (id: number) => void;
  onUpdate: (id: number, patch: Partial<ProjectManagementItem>) => void;
  onDelete: (id: number) => void;
}) {
  // Common styles
  const inputBase =
    'w-full bg-transparent border border-transparent rounded-md px-2 py-1.5 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none';
  
  const textareaBase =
    'w-full bg-transparent border border-transparent rounded-md px-2 py-1.5 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none';

  const selectBase = 
    'w-full bg-transparent border border-transparent rounded-md px-2 py-1.5 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer';

  const cellBase = 'px-4 py-3 align-top border-b border-gray-100 group-hover:bg-gray-50/30 transition-colors';
  const stickyCellBase = 'px-4 py-3 align-top border-b border-gray-100 transition-colors';
  const headerBase = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/95 backdrop-blur sticky top-0 z-10 border-b border-gray-200 whitespace-nowrap shadow-sm';

  const stickyRightDivider =
    "relative after:content-[''] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-200 after:pointer-events-none";

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="min-w-max w-full border-collapse">
          <thead>
            <tr>
              <th className={`${headerBase} w-16 sticky left-0 z-30 bg-gray-50`}>ID</th>
              <th className={`${headerBase} ${stickyRightDivider} w-48 sticky left-16 z-30 bg-gray-50`}>Mã dự án</th>
              <th className={`${headerBase} w-64`}>Tên website</th>
              <th className={`${headerBase} w-40`}>Loại</th>
              <th className={`${headerBase} w-32`}>Khách hàng</th>
              <th className={`${headerBase} w-28`}>Sale</th>
              <th className={`${headerBase} w-28`}>PM</th>
              <th className={`${headerBase} w-44`}>Trạng thái</th>
              <th className={`${headerBase} w-40`}>Độ ưu tiên</th>
              <th className={`${headerBase} w-40`}>Ngân sách</th>
              <th className={`${headerBase} w-40`}>Giá trị HĐ</th>
              <th className={`${headerBase} w-40`}>Chi phí thực</th>
              <th className={`${headerBase} w-40`}>Đã thu cọc</th>
              <th className={`${headerBase} w-44`}>TT thanh toán</th>
              <th className={`${headerBase} w-36`}>Tổng giờ</th>
              <th className={`${headerBase} w-56`}>Công nghệ</th>
              <th className={`${headerBase} w-64`}>Domain</th>
              <th className={`${headerBase} w-64`}>Live</th>
              <th className={`${headerBase} w-36`}>Ngày bắt đầu</th>
              <th className={`${headerBase} w-36`}>Deadline</th>
              <th className={`${headerBase} w-44`}>Ngày xong</th>
              <th className={`${headerBase} w-80`}>Mô tả</th>
              <th className={`${headerBase} w-44`}>Ngày tạo</th>
              <th className={`${headerBase} w-44`}>Ngày cập nhật</th>
              <th className={`${headerBase} w-20 text-center`}>Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td className="py-8 px-4 text-center text-gray-500 italic" colSpan={24}>
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              projects.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`group transition-colors ${selectedId === item.id ? 'bg-teal-50/60' : 'hover:bg-gray-50/50'}`}
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
                      className={`${textareaBase} font-medium text-gray-900 min-h-[2.5rem]`}
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
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityClassName(item.priority)}`}>
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
                    <textarea rows={1} value={item.technology_stack} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { technology_stack: e.target.value })} className={`${textareaBase} min-h-[2.5rem]`} placeholder="React, Node.js..." />
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
                    <textarea rows={2} value={item.description} onFocus={() => onSelect(item.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { description: e.target.value })} className={textareaBase} placeholder="Mô tả..." />
                  </td>

                  <td className={`${cellBase} text-sm text-gray-600 whitespace-nowrap`}>{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}</td>
                  <td className={`${cellBase} text-sm text-gray-600 whitespace-nowrap`}>{item.updated_at ? new Date(item.updated_at).toLocaleString('vi-VN') : ''}</td>

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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
