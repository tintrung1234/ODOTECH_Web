import type { ReactNode, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import Dashboard from '../pages/Accounts';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Projects from '../pages/Projects';
import Renewals from '../pages/Renewals';
import Sales from '../pages/Sales';

export interface SidebarItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export interface AppRoute {
  path: string;
  element: ReactElement;
}

export const sidebarItems: SidebarItem[] = [
  {
    to: '/accounts',
    label: 'Quản lý nhân sự',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    to: '/sales',
    label: 'Quản lý Sale',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 14l6-6m0 0h-4m4 0v4M7 10h.01M7 14h.01M7 18h.01M11 10h.01M11 14h.01M11 18h.01M15 10h.01M15 14h.01M15 18h.01M19 10h.01M19 14h.01M19 18h.01"
        />
      </svg>
    ),
  },
  {
    to: '/projects',
    label: 'Quản lý dự án',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        />
      </svg>
    ),
  },
  {
    to: '/renewals',
    label: 'Quản lý gói gia hạn',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v6h6M20 20v-6h-6M20 10a8 8 0 00-14.9-3M4 14a8 8 0 0014.9 3"
        />
      </svg>
    ),
  },
];

export const appRoutes: AppRoute[] = [
  { path: '/', element: <Navigate to="/accounts" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/accounts', element: <Dashboard /> },
  { path: '/sales', element: <Sales /> },
  { path: '/projects', element: <Projects /> },
  { path: '/renewals', element: <Renewals /> },
  { path: '*', element: <Navigate to="/accounts" replace /> },
];
