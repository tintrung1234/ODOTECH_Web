import type { LeaveRequest } from '../../interface/type';
import { formatIsoDate, statusClassName, statusLabel, isPending, todayIsoDate } from '../../utils/leaveHelpers';
import { User, Calendar, Clock, CheckCircle, XCircle, FileText, Activity } from 'lucide-react';

interface LeaveApprovalPanelProps {
  request: LeaveRequest | null;
  requesterName?: string;
  onUpdateRequest: (updated: LeaveRequest) => void;
}

export default function LeaveApprovalPanel({ request, requesterName, onUpdateRequest }: LeaveApprovalPanelProps) {
  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400 border border-dashed border-gray-200 rounded-xl h-full">
        <FileText size={48} className="mb-3 opacity-20" />
        <span className="text-sm">Chọn một đơn để xem chi tiết</span>
      </div>
    );
  }

  // Calculate duration
  const startDate = new Date(request.tuNgay);
  const endDate = new Date(request.denNgay);
  const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-100/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">Đơn xin nghỉ #{request.id}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClassName(request.trangThai)}`}>
          {statusLabel(request.trangThai) === 'Đã duyệt' && <CheckCircle size={12} />}
          {statusLabel(request.trangThai) === 'Từ chối' && <XCircle size={12} />}
          {statusLabel(request.trangThai) === 'Chờ xử lý' && <Clock size={12} />}
          {statusLabel(request.trangThai)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Personnel Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <User size={14} />
              Thông tin nhân sự
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-lg border-2 border-white shadow-sm">
                  {requesterName ? requesterName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-base font-bold text-gray-900 truncate">
                    {requesterName || 'Không xác định'}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5 font-medium">ID: {request.accountId}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-xs px-2 py-1 bg-white rounded border border-gray-300 text-gray-700 font-medium inline-block shadow-sm">
                      Nhân viên
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Lý do xin nghỉ</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[80px]">
                  {request.lyDo}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Indicators */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} />
              Các chỉ số
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-700 mb-1 font-bold">Tổng số ngày</div>
                <div className="text-xl font-extrabold text-gray-900 flex items-baseline gap-1">
                  {duration} <span className="text-xs font-medium text-gray-600">ngày</span>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-700 mb-1 font-bold">Loại nghỉ</div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  Phép năm
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1 font-medium">
                    <Calendar size={12} /> Từ ngày
                  </div>
                  <div className="text-sm font-bold text-gray-900">{formatIsoDate(request.tuNgay)}</div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1 font-medium">
                    <Calendar size={12} /> Đến ngày
                  </div>
                  <div className="text-sm font-bold text-gray-900">{formatIsoDate(request.denNgay)}</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-500 font-medium mb-0.5">Ngày tạo</div>
                  <div className="text-gray-800 font-semibold">{formatIsoDate(request.ngayTao)}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-0.5">Người duyệt</div>
                  <div className="text-gray-800 font-semibold">{request.nguoiDuyet || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-0.5">Ngày xử lý</div>
                  <div className="text-gray-800 font-semibold">{request.ngayXuLy ? formatIsoDate(request.ngayXuLy) : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-0.5">Ghi chú duyệt</div>
                  <div className="text-gray-800 font-semibold truncate" title={request.ghiChu || ''}>{request.ghiChu || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {isPending(request.trangThai) && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            className="h-9 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
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
          <button
            type="button"
            className="h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-all cursor-pointer flex items-center gap-2"
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
            <CheckCircle size={16} />
            Duyệt đơn
          </button>
        </div>
      )}
    </div>
  );
}
