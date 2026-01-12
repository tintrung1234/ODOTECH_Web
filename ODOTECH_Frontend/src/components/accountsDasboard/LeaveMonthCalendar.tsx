import { useEffect, useMemo, useState } from 'react';

import type { LeaveRequest } from '../../interface/type';
import { isRejected, todayIsoDate } from '../../utils/leaveHelpers';

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function isoFromLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function parseIsoToLocalDate(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthLabel(date: Date) {
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function dayOfWeekMondayStart(date: Date) {
  // JS: 0=Sun..6=Sat => convert to 0=Mon..6=Sun
  return (date.getDay() + 6) % 7;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

interface LeaveMonthCalendarProps {
  month: Date;
  requests: LeaveRequest[];
  selectedIsoDate?: string | null;
  onSelectIsoDate?: (iso: string | null) => void;
  onlyMarkedSelectable?: boolean;
}

export default function LeaveMonthCalendar({
  month,
  requests,
  selectedIsoDate = null,
  onSelectIsoDate,
  onlyMarkedSelectable = true,
}: LeaveMonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(month));

  useEffect(() => {
    setViewMonth(startOfMonth(month));
  }, [month]);

  const firstDay = useMemo(() => startOfMonth(viewMonth), [viewMonth]);
  const lastDay = useMemo(() => endOfMonth(viewMonth), [viewMonth]);

  const markedIsoDates = useMemo(() => {
    const marked = new Set<string>();

    for (const req of requests) {
      if (isRejected(req.trangThai)) continue;
      const from = parseIsoToLocalDate(req.tuNgay);
      const to = parseIsoToLocalDate(req.denNgay);

      // Skip requests that don't overlap the displayed month at all.
      if (to < firstDay || from > lastDay) continue;

      const start = from < firstDay ? firstDay : from;
      const end = to > lastDay ? lastDay : to;

      for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
        marked.add(isoFromLocalDate(cursor));
      }
    }

    return marked;
  }, [firstDay, lastDay, requests]);

  const dayCells = useMemo(() => {
    const offset = dayOfWeekMondayStart(firstDay);
    const daysInMonth = lastDay.getDate();

    const cells: Array<{ iso: string | null; dayNumber: number | null }> = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push({ iso: null, dayNumber: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
      cells.push({ iso: isoFromLocalDate(date), dayNumber: day });
    }

    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = remainder; i < 7; i += 1) {
        cells.push({ iso: null, dayNumber: null });
      }
    }

    return cells;
  }, [firstDay, lastDay]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-8 w-8 border border-gray-300 rounded-md bg-white text-gray-700 font-medium cursor-pointer"
            aria-label="Tháng trước"
            onClick={() => {
              setViewMonth((prev) => {
                const next = addMonths(prev, -1);
                if (onSelectIsoDate) {
                  const todayIso = todayIsoDate();
                  const today = new Date(`${todayIso}T00:00:00`);
                  onSelectIsoDate(isSameMonth(next, today) ? todayIso : null);
                }
                return next;
              });
            }}
          >
            ‹
          </button>
          <div className="font-semibold text-gray-800">Lịch nghỉ (Tháng {monthLabel(viewMonth)})</div>
          <button
            type="button"
            className="h-8 w-8 border border-gray-300 rounded-md bg-white text-gray-700 font-medium cursor-pointer"
            aria-label="Tháng sau"
            onClick={() => {
              setViewMonth((prev) => {
                const next = addMonths(prev, 1);
                if (onSelectIsoDate) {
                  const todayIso = todayIsoDate();
                  const today = new Date(`${todayIso}T00:00:00`);
                  onSelectIsoDate(isSameMonth(next, today) ? todayIso : null);
                }
                return next;
              });
            }}
          >
            ›
          </button>
        </div>
        <div className="text-xs text-gray-600 inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-600" />
          <span>Có lịch nghỉ</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 text-xs text-gray-500">
          <div className="text-center">T2</div>
          <div className="text-center">T3</div>
          <div className="text-center">T4</div>
          <div className="text-center">T5</div>
          <div className="text-center">T6</div>
          <div className="text-center">T7</div>
          <div className="text-center">CN</div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {dayCells.map((cell, index) => {
            if (!cell.dayNumber || !cell.iso) {
              return <div key={`empty-${index}`} className="h-10 rounded-md" />;
            }

            const isMarked = markedIsoDates.has(cell.iso);
            const isSelected = selectedIsoDate === cell.iso;
            const isSelectable = Boolean(onSelectIsoDate) && (!onlyMarkedSelectable || isMarked);

            const baseClassName = `h-10 w-full rounded-md border flex flex-col items-center justify-center ${isSelected ? 'bg-teal-50 border-teal-300' : 'bg-white border-gray-200'
              }`;

            if (!isSelectable) {
              return (
                <div key={cell.iso} className={baseClassName}>
                  <div className="text-sm text-gray-800 leading-none">{cell.dayNumber}</div>
                  <div className="h-2 flex items-center">
                    {isMarked ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600" /> : null}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => onSelectIsoDate?.(cell.iso!)}
                className={`${baseClassName} hover:bg-gray-50 cursor-pointer`}
              >
                <div className="text-sm text-gray-800 leading-none">{cell.dayNumber}</div>
                <div className="h-2 flex items-center">
                  {isMarked ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
