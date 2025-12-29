import type { ReactNode } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';
import { getTokenUser } from '../../utils/auth';

interface AppLayoutProps {
  children: ReactNode;
  userName?: string;
}

function pickDisplayName(value: unknown): string {
  const str = String(value ?? '').trim();
  return str;
}

export default function AppLayout({ children, userName }: AppLayoutProps) {
  const tokenUser = getTokenUser();
  const displayName =
    pickDisplayName(userName) ||
    pickDisplayName(tokenUser?.name) ||
    pickDisplayName(tokenUser?.username) ||
    pickDisplayName(tokenUser?.email) ||
    'Admin';

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header userName={displayName} />
        {children}
      </div>
    </div>
  );
}
