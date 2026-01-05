import type { ProjectPriority, ProjectStatus, ProjectMgmtPriority, ProjectMgmtStatus } from '../components/projectsDasboard/interface/type';

export function statusLabel(status: ProjectStatus | ProjectMgmtStatus) {
  // New project management statuses (VN)
  if (status === 'Đợi sắp xếp') return 'Đợi sắp xếp';
  if (status === 'Đang làm') return 'Đang làm';
  if (status === 'Chờ thêm thông tin') return 'Chờ thêm thông tin';
  if (status === 'Đợi khách duyệt - feedback') return 'Đợi khách duyệt - feedback';
  if (status === 'Hoàn thành đợi tất toán') return 'Hoàn thành đợi tất toán';
  if (status === 'Đã thông báo thanh toán') return 'Đã thông báo thanh toán';
  if (status === 'Kết thúc hài lòng') return 'Kết thúc hài lòng';
  if (status === 'Kết thúc thất vọng') return 'Kết thúc thất vọng';
  if (status === 'Nhờ sale réo khách') return 'Nhờ sale réo khách';

  // Backward compatibility
  if (status === 'not_started') return 'Chưa bắt đầu';
  if (status === 'in_progress') return 'Đang thực hiện';
  if (status === 'on_hold') return 'Tạm dừng';
  if (status === 'completed') return 'Hoàn thành';
  if (status === 'late') return 'Trễ tiến độ';
  return String(status);
}

export function statusClassName(status: ProjectStatus | ProjectMgmtStatus) {
  // New statuses
  if (status === 'Đợi sắp xếp') return 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'Đang làm') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Chờ thêm thông tin') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Đợi khách duyệt - feedback') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (status === 'Hoàn thành đợi tất toán') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (status === 'Đã thông báo thanh toán') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  if (status === 'Kết thúc hài lòng') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'Kết thúc thất vọng') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Nhờ sale réo khách') return 'bg-pink-50 text-pink-700 border-pink-200';

  // Old statuses
  if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'late') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'on_hold') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  if (status === 'not_started') return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-teal-50 text-teal-700 border-teal-200';
}

export function priorityLabel(priority: ProjectPriority | ProjectMgmtPriority) {
  if (priority === 'low') return 'Thấp';
  if (priority === 'medium') return 'Trung bình';
  if (priority === 'high') return 'Cao';
  return 'Khẩn';
}

export function priorityClassName(priority: ProjectPriority | ProjectMgmtPriority) {
  if (priority === 'urgent') return 'bg-red-50 text-red-700 border-red-200';
  if (priority === 'high') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (priority === 'medium') return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function parseIsoDate(iso: string) {
  const trimmed = iso.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatIsoDateVi(iso: string) {
  const date = parseIsoDate(iso);
  if (!date) return '-';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function computeExpectedProgressPercent(startIso: string, endIso: string, today: Date) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end) return null;
  const total = end.getTime() - start.getTime();
  if (total <= 0) return null;
  const elapsed = today.getTime() - start.getTime();
  return clampNumber((elapsed / total) * 100, 0, 100);
}

export function normalizeMembers(input: string) {
  const parts = input
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}
