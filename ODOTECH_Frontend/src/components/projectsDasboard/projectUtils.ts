import type { ProjectItem, ProjectPriority, ProjectStatus } from '../../types/Interface';

export function statusLabel(status: ProjectStatus) {
  if (status === 'not_started') return 'Chưa bắt đầu';
  if (status === 'in_progress') return 'Đang thực hiện';
  if (status === 'on_hold') return 'Tạm dừng';
  if (status === 'completed') return 'Hoàn thành';
  return 'Trễ tiến độ';
}

export function statusClassName(status: ProjectStatus) {
  if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'late') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'on_hold') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  if (status === 'not_started') return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-teal-50 text-teal-700 border-teal-200';
}

export function priorityLabel(priority: ProjectPriority) {
  if (priority === 'low') return 'Thấp';
  if (priority === 'medium') return 'Trung bình';
  if (priority === 'high') return 'Cao';
  return 'Khẩn';
}

export function priorityClassName(priority: ProjectPriority) {
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

export function deriveDisplayStatus(project: ProjectItem, today: Date) {
  if (project.trangThai === 'completed') return 'completed' as const;
  if (project.trangThai === 'on_hold') return 'on_hold' as const;
  if (project.trangThai === 'not_started') return 'not_started' as const;

  const expected = computeExpectedProgressPercent(project.ngayBatDau, project.ngayKetThuc, today);
  if (expected === null) return project.trangThai;

  const end = parseIsoDate(project.ngayKetThuc);
  const isPastEnd = end ? today.getTime() > end.getTime() : false;
  const isLate = (isPastEnd && project.tienDo < 100) || project.tienDo + 10 < expected;
  return isLate ? ('late' as const) : project.trangThai;
}

export function nextProjectId(projects: ProjectItem[]) {
  const maxId = projects.reduce((max, p) => (p.id > max ? p.id : max), 0);
  return maxId + 1;
}

export function normalizeMembers(input: string) {
  const parts = input
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}
