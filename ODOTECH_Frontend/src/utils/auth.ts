const TOKEN_KEY = 'odotech_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function buildAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  const base: Record<string, string> = {};

  if (token) base.Authorization = `Bearer ${token}`;

  if (!extra) return base;

  if (Array.isArray(extra)) {
    const merged = new Headers(extra);
    for (const [k, v] of Object.entries(base)) merged.set(k, v);
    return merged;
  }

  if (extra instanceof Headers) {
    const merged = new Headers(extra);
    for (const [k, v] of Object.entries(base)) merged.set(k, v);
    return merged;
  }

  return { ...extra, ...base };
}

type JwtUser = {
  uid?: number;
  role?: string;
  username?: string;
  name?: string;
  email?: string;
};

function base64UrlDecode(input: string): string {
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    atob(b64)
      .split('')
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  );
}

export function getTokenUser(): JwtUser | null {
  const token = getToken();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = JSON.parse(base64UrlDecode(parts[1])) as JwtUser;
    return json ?? null;
  } catch {
    return null;
  }
}

export type CanonicalRole =
  | 'admin'
  | 'support'
  | 'sale'
  | 'sales_manager'
  | 'head_sales'
  | 'dev'
  | 'dev_manager'
  | 'head_tech'
  | 'unknown';

export function normalizeRole(value: string | undefined | null): CanonicalRole {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();
  const noAccents = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const compact = noAccents.replace(/\s+/g, '');

  if (['admin', 'administrator'].includes(compact)) return 'admin';
  if (['hotrotong', 'support'].includes(compact)) return 'support';
  if (['sale', 'sales'].includes(compact)) return 'sale';
  if (['quanlysale', 'salesmanager', 'sales_manager'].includes(compact)) return 'sales_manager';
  if (['truongphongkinhdoanh', 'headsales', 'head_sales'].includes(compact)) return 'head_sales';
  if (['dev', 'developer'].includes(compact)) return 'dev';
  if (['quanlydev', 'devmanager', 'dev_manager'].includes(compact)) return 'dev_manager';
  if (['truongphongkythuat', 'headtech', 'head_tech'].includes(compact)) return 'head_tech';

  return compact ? 'unknown' : 'unknown';
}
