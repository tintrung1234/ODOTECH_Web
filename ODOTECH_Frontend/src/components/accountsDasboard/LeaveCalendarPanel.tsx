import { useMemo } from 'react';

import LeaveMonthCalendar from './LeaveMonthCalendar';
import type { LeaveRequest } from '../projectsDasboard/interface/type';
import { isIsoWithinRange, isPending, isRejected, formatIsoDate, statusClassName, statusLabel } from '../../utils/leaveHelpers';

interface LeaveCalendarPanelProps {
  month: Date;
  requests: LeaveRequest[];
  selectedIsoDate: string | null;
  onSelectIsoDate: (iso: string | null) => void;
  selectedLeaveId: number | null;
  onSelectLeaveId: (id: number | null) => void;
  onUpdateRequest: (updated: LeaveRequest) => void;
}

export default function LeaveCalendarPanel({
  month,
  requests,
  selectedIsoDate,
  onSelectIsoDate,
  selectedLeaveId,
  onSelectLeaveId,
}: LeaveCalendarPanelProps) {
  const dayRequests = useMemo(() => {
    if (!selectedIsoDate) return [];
    return requests.filter((req) => !isRejected(req.trangThai) && isIsoWithinRange(selectedIsoDate, req.tuNgay, req.denNgay));
  }, [requests, selectedIsoDate]);

  return (
    <div>
      <div className="mb-4">
        <LeaveMonthCalendar
          month={month}
          requests={requests}
          selectedIsoDate={selectedIsoDate}
          onSelectIsoDate={(iso) => {
            onSelectIsoDate(iso);

            if (!iso) {
              onSelectLeaveId(null);
              return;
            }

            const matching = requests.filter((req) => !isRejected(req.trangThai) && isIsoWithinRange(iso, req.tuNgay, req.denNgay));
            const preferred = matching.find((req) => isPending(req.trangThai)) ?? matching[0];
            if (preferred) onSelectLeaveId(preferred.id);
          }}
          onlyMarkedSelectable
        />
      </div>

      {selectedIsoDate ? (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
            Đơn nghỉ trong ngày ({dayRequests.length})
          </div>
          <div className="divide-y divide-gray-200">
            {dayRequests.length === 0 ? (
              <div className="px-4 py-4 text-gray-600">Không có đơn trong ngày này.</div>
            ) : (
              dayRequests.map((req) => (
                <button
                  key={`day-${req.id}`}
                  type="button"
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer ${selectedLeaveId === req.id ? 'bg-teal-50' : ''}`}
                  onClick={() => onSelectLeaveId(req.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-gray-900">#{req.id}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(req.trangThai)}`}>
                        {statusLabel(req.trangThai)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {formatIsoDate(req.tuNgay)} → {formatIsoDate(req.denNgay)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
