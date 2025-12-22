import { useMemo, useState } from 'react';

import ReminderMonthCalendar from './ReminderMonthCalendar';
import { todayIsoDate } from '../accountsDasboard/leaveHelpers';

export interface ReminderCalendarItem {
  customerId: number;
  customerName: string;
  noteId: number;
  ngayTao: string; // ISO date
  noiDung: string;
  ngayNhac: string; // ISO date
}

interface ReminderCalendarModalProps {
  open: boolean;
  title?: string;
  items: ReminderCalendarItem[];
  onOpenCustomer: (customerId: number) => void;
  onClose?: () => void;
}

export default function ReminderCalendarModal({
  open,
  title = 'Lịch nhắc hẹn chăm sóc khách hàng',
  items,
  onOpenCustomer,
  onClose,
}: ReminderCalendarModalProps) {
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(() => todayIsoDate());
  const currentMonth = useMemo(() => new Date(), []);

  const handleClose = () => {
    setSelectedIsoDate(null);
    onClose?.();
  };

  const markedIsoDates = useMemo(() => {
    const marked = new Set<string>();
    for (const item of items) marked.add(item.ngayNhac);
    return marked;
  }, [items]);

  const dayItems = useMemo(() => {
    if (!selectedIsoDate) return [];
    return items
      .filter((i) => i.ngayNhac === selectedIsoDate)
      .sort((a, b) => a.customerName.localeCompare(b.customerName, 'vi'));
  }, [items, selectedIsoDate]);

  if (!open) return null;

  return (
    <section className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <div className="text-sm text-gray-600">Tổng nhắc hẹn: {items.length}</div>
        </div>
        {onClose ? (
          <button
            type="button"
            className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium cursor-pointer"
            onClick={handleClose}
          >
            Đóng
          </button>
        ) : null}
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ReminderMonthCalendar
              month={currentMonth}
              markedIsoDates={markedIsoDates}
              selectedIsoDate={selectedIsoDate}
              onSelectIsoDate={setSelectedIsoDate}
              onlyMarkedSelectable
            />

            {selectedIsoDate ? (
              <div className="mt-4 text-sm text-gray-600">Đang chọn: {selectedIsoDate}</div>
            ) : (
              <div className="mt-4 text-sm text-gray-600">Chọn một ngày có nhắc hẹn để xem chi tiết.</div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
              {selectedIsoDate ? `Nhắc hẹn trong ngày (${dayItems.length})` : 'Nhắc hẹn trong ngày'}
            </div>

            <div className="divide-y divide-gray-200">
              {!selectedIsoDate ? (
                <div className="px-4 py-4 text-gray-600">Chưa chọn ngày.</div>
              ) : dayItems.length === 0 ? (
                <div className="px-4 py-4 text-gray-600">Không có nhắc hẹn trong ngày này.</div>
              ) : (
                dayItems.map((item) => (
                  <button
                    key={`${item.customerId}-${item.noteId}`}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onOpenCustomer(item.customerId)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-gray-900">{item.customerName}</div>
                      <div className="text-xs text-gray-500">#{item.noteId}</div>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{item.noiDung}</div>
                    <div className="text-xs text-gray-500 mt-1">Tạo: {item.ngayTao}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
