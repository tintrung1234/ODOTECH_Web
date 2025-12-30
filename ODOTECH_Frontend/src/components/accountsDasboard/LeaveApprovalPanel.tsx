import type { LeaveRequest } from '../projectsDasboard/interface/type';
import { formatIsoDate, statusClassName, statusLabel, isPending, todayIsoDate } from '../../utils/leaveHelpers';

interface LeaveApprovalPanelProps {
  request: LeaveRequest | null;
  onUpdateRequest: (updated: LeaveRequest) => void;
}

export default function LeaveApprovalPanel({ request, onUpdateRequest }: LeaveApprovalPanelProps) {
  if (!request) {
    return <div className="text-gray-600">Chọn một đơn để xem chi tiết.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold text-gray-900">Chi tiết đơn #{request.id}</div>
        <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(request.trangThai)}`}>
          {statusLabel(request.trangThai)}
        </span>
      </div>

      {isPending(request.trangThai) && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 px-5 rounded-lg bg-teal-600 text-white font-medium cursor-pointer"
            onClick={() => {
              onUpdateRequest({
                ...request,
                trangThai: 'approved',
                nguoiDuyet: request.nguoiDuyet ?? 'Admin',
                ngayXuLy: todayIsoDate(),
                ghiChu: request.ghiChu ?? 'Đã duyệt',
              });
            }}
          >
            Duyệt
          </button>
          <button
            type="button"
            className="h-10 px-5 rounded-lg bg-red-600 text-white font-medium cursor-pointer"
            onClick={() => {
              onUpdateRequest({
                ...request,
                trangThai: 'rejected',
                nguoiDuyet: request.nguoiDuyet ?? 'Admin',
                ngayXuLy: todayIsoDate(),
                ghiChu: request.ghiChu ?? 'Từ chối',
              });
            }}
          >
            Từ chối
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Từ ngày</div>
          <div className="text-gray-900 font-medium">{formatIsoDate(request.tuNgay)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Đến ngày</div>
          <div className="text-gray-900 font-medium">{formatIsoDate(request.denNgay)}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm text-gray-500">Lý do</div>
          <div className="text-gray-900">{request.lyDo}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Ngày tạo</div>
          <div className="text-gray-900">{formatIsoDate(request.ngayTao)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Người duyệt</div>
          <div className="text-gray-900">{request.nguoiDuyet ?? '-'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Ngày xử lý</div>
          <div className="text-gray-900">{request.ngayXuLy ? formatIsoDate(request.ngayXuLy) : '-'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Ghi chú</div>
          <div className="text-gray-900">{request.ghiChu ?? '-'}</div>
        </div>
      </div>
    </div>
  );
}
