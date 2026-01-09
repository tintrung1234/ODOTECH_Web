
export function buildAuthHeaders(extra?: HeadersInit): HeadersInit {
  // Token is in httpOnly cookie, no need to add Authorization header
  // Just return the extra headers if provided
  if (!extra) return {};
  return extra;
}

type JwtUser = {
  uid?: number;
  role?: string;
  username?: string;
  name?: string;
  email?: string;
};

let cachedUser: JwtUser | null | undefined = undefined;

export async function getTokenUser(): Promise<JwtUser | null> {
  // Return cached value if available
  if (cachedUser !== undefined) return cachedUser;

  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';
    const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
      credentials: 'include', // Important: send cookies
    });

    if (!res.ok) {
      cachedUser = null;
      return null;
    }

    const data = await res.json() as { user?: JwtUser };
    cachedUser = data.user ?? null;
    return cachedUser;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    cachedUser = null;
    return null;
  }
}

export function clearUserCache() {
  cachedUser = undefined;
}

export async function logout(): Promise<void> {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Important: send cookies
    });
    clearUserCache();
  } catch (error) {
    console.error('Logout failed:', error);
    // Clear cache anyway
    clearUserCache();
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
