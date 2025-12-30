import { useCallback, useEffect, useMemo, useState } from 'react';

import type { LeaveRequest } from '../projectsDasboard/interface/type';
import LeaveApprovalPanel from './LeaveApprovalPanel';
import LeaveCalendarPanel from './LeaveCalendarPanel';
import { formatIsoDate, isProcessed, isPending, isRejected, statusClassName, statusLabel, todayIsoDate } from '../../utils/leaveHelpers';

interface LeaveRequestsModalProps {
  open: boolean;
  accountName: string;
  requests: LeaveRequest[];
  selectedLeaveId: number | null;
  onSelectLeaveId: (id: number | null) => void;
  onUpdateRequest: (updated: LeaveRequest) => void;
  onClose: () => void;
}

export default function LeaveRequestsModal({
  open,
  accountName,
  requests,
  selectedLeaveId,
  onSelectLeaveId,
  onUpdateRequest,
  onClose,
}: LeaveRequestsModalProps) {
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(() => todayIsoDate());
  const currentMonth = useMemo(() => new Date(), []);

  const handleClose = useCallback(() => {
    onSelectLeaveId(null);
    setSelectedIsoDate(null);
    onClose();
  }, [onClose, onSelectLeaveId]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, open]);


  if (!open) return null;

  const pendingLeaveRequests = requests.filter((req) => isPending(req.trangThai) && !isRejected(req.trangThai));
  const processedLeaveRequests = requests.filter((req) => isProcessed(req.trangThai) && !isRejected(req.trangThai));
  const selectedLeaveRequest = selectedLeaveId ? requests.find((req) => req.id === selectedLeaveId) ?? null : null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40 cursor-pointer" onClick={handleClose} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Đơn xin nghỉ phép</h2>
              <div className="text-sm text-gray-600">{accountName}</div>
            </div>
            <button
              type="button"
              className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium cursor-pointer"
              onClick={handleClose}
            >
              Đóng
            </button>
          </div>

          <div className="px-6 py-5 max-h-[85vh] overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
                  Đơn chờ xử lý ({pendingLeaveRequests.length})
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingLeaveRequests.length === 0 ? (
                    <div className="px-4 py-4 text-gray-600">Không có đơn chờ xử lý.</div>
                  ) : (
                    pendingLeaveRequests.map((req) => (
                      <button
                        key={req.id}
                        type="button"
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer ${selectedLeaveId === req.id ? 'bg-teal-50' : ''}`}
                        onClick={() => {
                          onSelectLeaveId(req.id);
                          setSelectedIsoDate(req.tuNgay);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-gray-900">#{req.id}</div>
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(req.trangThai)}`}>
                            {statusLabel(req.trangThai)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {formatIsoDate(req.tuNgay)} → {formatIsoDate(req.denNgay)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Tạo: {formatIsoDate(req.ngayTao)}</div>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-b border-gray-200 font-semibold text-gray-800">
                  Đơn đã xử lý ({processedLeaveRequests.length})
                </div>
                <div className="divide-y divide-gray-200">
                  {processedLeaveRequests.length === 0 ? (
                    <div className="px-4 py-4 text-gray-600">Không có đơn đã xử lý.</div>
                  ) : (
                    processedLeaveRequests.map((req) => (
                      <button
                        key={req.id}
                        type="button"
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer ${selectedLeaveId === req.id ? 'bg-teal-50' : ''}`}
                        onClick={() => {
                          onSelectLeaveId(req.id);
                          setSelectedIsoDate(req.tuNgay);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-gray-900">#{req.id}</div>
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(req.trangThai)}`}>
                            {statusLabel(req.trangThai)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {formatIsoDate(req.tuNgay)} → {formatIsoDate(req.denNgay)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Tạo: {formatIsoDate(req.ngayTao)}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">

                <div className="mb-4">
                  <LeaveCalendarPanel
                    month={currentMonth}
                    requests={requests}
                    selectedIsoDate={selectedIsoDate}
                    onSelectIsoDate={setSelectedIsoDate}
                    selectedLeaveId={selectedLeaveId}
                    onSelectLeaveId={onSelectLeaveId}
                    onUpdateRequest={onUpdateRequest}
                  />
                </div>

                <LeaveApprovalPanel request={selectedLeaveRequest} onUpdateRequest={onUpdateRequest} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
