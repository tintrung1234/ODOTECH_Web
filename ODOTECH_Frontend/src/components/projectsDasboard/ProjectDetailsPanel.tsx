import type { ProjectItem } from '../../types/types';
import {
  clampNumber,
  computeExpectedProgressPercent,
  deriveDisplayStatus,
  formatIsoDateVi,
  priorityClassName,
  priorityLabel,
  statusClassName,
  statusLabel,
} from './projectUtils';

export default function ProjectDetailsPanel({
  project,
  today,
}: {
  project: ProjectItem | null;
  today: Date;
}) {
  return (
    <div className="border border-gray-300 rounded-lg p-4">
      {!project ? (
        <div className="text-gray-600">Chọn một dự án để xem chi tiết.</div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-gray-900">Chi tiết #{project.id}</div>
            {(() => {
              const displayStatus = deriveDisplayStatus(project, today);
              return <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(displayStatus)}`}>{statusLabel(displayStatus)}</span>;
            })()}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <div className="text-sm text-gray-500">Tên dự án</div>
              <div className="text-gray-900 font-medium">{project.tenDuAn}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Khách hàng</div>
              <div className="text-gray-900">{project.khachHang}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Trưởng dự án (PM)</div>
              <div className="text-gray-900">{project.pm}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ngày bắt đầu</div>
              <div className="text-gray-900">{formatIsoDateVi(project.ngayBatDau)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Kết thúc</div>
              <div className="text-gray-900">{formatIsoDateVi(project.ngayKetThuc)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Mức độ ưu tiên</div>
              <div>
                <span className={`text-xs px-2 py-1 rounded-full border ${priorityClassName(project.mucDoUuTien)}`}>{priorityLabel(project.mucDoUuTien)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-gray-900">{project.moTa || '-'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Tiến độ (%) theo timeline</div>
              {(() => {
                const expected = computeExpectedProgressPercent(project.ngayBatDau, project.ngayKetThuc, today);
                const expectedRounded = expected === null ? null : Math.round(expected);
                return (
                  <div className="mt-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-gray-900 font-medium">{project.tienDo}%</div>
                      <div className="text-sm text-gray-600">{expectedRounded === null ? 'Kỳ vọng: -' : `Kỳ vọng: ${expectedRounded}%`}</div>
                    </div>
                    <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div className="h-full bg-teal-600" style={{ width: `${clampNumber(project.tienDo, 0, 100)}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500">Số task</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{project.soTask}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500">Task quá hạn</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{project.taskQuaHan}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500">Thành viên</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{project.thanhVien.length}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Tài liệu dự án</div>
              {project.taiLieu.length === 0 ? (
                <div className="text-gray-900">-</div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.taiLieu.map((name) => (
                    <div key={name} className="px-3 py-1 border border-gray-200 rounded-full bg-gray-50 text-sm text-gray-800">
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-gray-500">Ghi chú dự án</div>
              <div className="text-gray-900">{project.ghiChu || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
