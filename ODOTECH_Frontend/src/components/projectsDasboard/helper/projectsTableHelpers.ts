import type { Account, ProjectMgmtStatus, ProjectType } from '../interface/type';
import type { CanonicalRole } from '../../../utils/auth';

export const PROJECT_TYPES: ProjectType[] = ['', 'Khách', 'Nội bộ', 'Đào tạo'];

export const PROJECT_STATUSES: ProjectMgmtStatus[] = [
  'Đợi sắp xếp',
  'Đang làm',
  'Chờ thêm thông tin',
  'Đợi khách duyệt - feedback',
  'Hoàn thành đợi tất toán',
  'Đã thông báo thanh toán',
  'Kết thúc hài lòng',
  'Kết thúc thất vọng',
  'Nhờ sale réo khách',
];

export const readErrorMessage = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as { message?: string };
      return json?.message || `HTTP ${res.status}`;
    }
    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
};

export const accountLabel = (a: Account) => {
  const name = a.name?.trim() || a.username?.trim() || `#${a.id}`;
  const user = a.username?.trim();
  return user ? `${name} (${user})` : name;
};

export const accountValueToken = (a: Account) => `${accountLabel(a)} #${a.id}`;

export const filterAccountsByRoles = (
  accounts: Account[],
  normalizeRole: (value: string | null | undefined) => CanonicalRole,
  allowed: CanonicalRole[]
) => {
  const allowedSet = new Set(allowed);
  return accounts.filter((a) => allowedSet.has(normalizeRole(a.role_system)));
};

export const normalizeMultiUsers = (raw: string) => {
  const parts = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).join(', ');
};
