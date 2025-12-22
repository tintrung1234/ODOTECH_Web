import type { ProjectItem } from '../../types/types';
import { clampNumber, deriveDisplayStatus, priorityClassName, priorityLabel, statusClassName, statusLabel } from './projectUtils';

export default function ProjectsTable({
  projects,
  selectedId,
  today,
  onSelect,
  onEdit,
  onDelete,
}: {
  projects: ProjectItem[];
  selectedId: number | null;
  today: Date;
  onSelect: (id: number) => void;
  onEdit: (project: ProjectItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="lg:col-span-2 overflow-x-auto border border-gray-300 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 w-20 border-b border-gray-300">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Tên dự án</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Khách hàng</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">PM</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Ưu tiên</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Tiến độ</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Trạng thái</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-44">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr className="h-12">
              <td className="py-3 px-4 border-b border-gray-300" colSpan={8}>
                <div className="text-gray-600">Không có dữ liệu phù hợp.</div>
              </td>
            </tr>
          ) : (
            projects.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer ${selectedId === item.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
              >
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.id}</td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.tenDuAn}</td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.khachHang}</td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.pm}</td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">
                  <span className={`text-xs px-2 py-1 rounded-full border ${priorityClassName(item.mucDoUuTien)}`}>{priorityLabel(item.mucDoUuTien)}</span>
                </td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div className="h-full bg-teal-600" style={{ width: `${clampNumber(item.tienDo, 0, 100)}%` }} />
                    </div>
                    <div className="text-sm text-gray-700 w-10">{item.tienDo}%</div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">
                  {(() => {
                    const displayStatus = deriveDisplayStatus(item, today);
                    return <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(displayStatus)}`}>{statusLabel(displayStatus)}</span>;
                  })()}
                </td>
                <td className="py-3 px-4 text-gray-800 border-b border-gray-300">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="h-9 px-3 border border-red-300 rounded-lg bg-white text-red-600 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
