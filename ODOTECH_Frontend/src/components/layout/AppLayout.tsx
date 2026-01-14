import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';
import { getTokenUser } from '../../utils/auth';

interface AppLayoutProps {
  children: ReactNode;
  userName?: string;
}

function pickDisplayName(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (!str) return '';
  const lowered = str.toLowerCase();
  if (lowered === 'undefined' || lowered === 'null') return '';
  return str;
}

export default function AppLayout({ children, userName }: AppLayoutProps) {
  const [tokenUser, setTokenUser] = useState<{ name?: string; username?: string; email?: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getTokenUser();
      if (!cancelled) {
        setTokenUser(user);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = useMemo(() => {
    return (
      pickDisplayName(userName) ||
      pickDisplayName(tokenUser?.name) ||
      pickDisplayName(tokenUser?.username) ||
      pickDisplayName(tokenUser?.email) ||
      'Admin'
    );
  }, [tokenUser?.email, tokenUser?.name, tokenUser?.username, userName]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header userName={displayName} onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        {children}
      </div>
    </div>
  );
}
