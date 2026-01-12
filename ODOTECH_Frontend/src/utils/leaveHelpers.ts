import { formatDate } from '../utils/formatDate';
import type { LeaveStatus } from '../interface/type';

export function normalizeLeaveStatus(status: LeaveStatus | string) {
  return String(status).trim().toLowerCase();
}

export function isPending(status: LeaveStatus | string) {
  return normalizeLeaveStatus(status) === 'pending';
}

export function isProcessed(status: LeaveStatus | string) {
  return !isPending(status);
}

export function isRejected(status: LeaveStatus | string) {
  return normalizeLeaveStatus(status) === 'rejected';
}

export function statusLabel(status: LeaveStatus | string) {
  const normalized = normalizeLeaveStatus(status);
  if (normalized === 'pending') return 'Chờ xử lý';
  if (normalized === 'rejected') return 'Từ chối';
  if (normalized === 'approved') return 'Đã duyệt';
  return 'Từ chối';
}

export function statusClassName(status: LeaveStatus | string) {
  const normalized = normalizeLeaveStatus(status);
  if (normalized === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (normalized === 'approved') return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export function formatIsoDate(iso: string) {
  return formatDate(new Date(iso));
}

export function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoToLocalDate(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

export function isIsoWithinRange(targetIso: string, fromIso: string, toIso: string) {
  const target = parseIsoToLocalDate(targetIso).getTime();
  const from = parseIsoToLocalDate(fromIso).getTime();
  const to = parseIsoToLocalDate(toIso).getTime();
  return target >= from && target <= to;
}
