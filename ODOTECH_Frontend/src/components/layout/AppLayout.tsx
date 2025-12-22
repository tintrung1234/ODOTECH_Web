import type { ReactNode } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  userName?: string;
}

export default function AppLayout({ children, userName = 'Admin' }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header userName={userName} />
        {children}
      </div>
    </div>
  );
}
