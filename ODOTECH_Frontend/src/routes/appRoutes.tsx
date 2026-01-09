import type { ReactNode, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import Dashboard from '../pages/Accounts';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Projects from '../pages/Projects';
import Renewals from '../pages/Renewals';
import ExpenseRenewals from '../pages/ExpenseRenewals';
import Sales from '../pages/Sales';
import Customers from '../pages/Customers';
import Websites from '../pages/Websites';
import SalaryDraft from '../pages/SalaryDraft';

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
    label: 'Quản lý gia hạn thu',
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
  {
    to: '/salary-draft',
    label: 'Tính lương nháp',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m-6 4h6m-6 4h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
        />
      </svg>
    ),
  },
  {
    to: '/expense-renewals',
    label: 'Quản lý thu chi',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    to: '/customers',
    label: 'Quản lý khách hàng',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    to: '/websites',
    label: 'Quản lý Website',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
  { path: '/salary-draft', element: <SalaryDraft /> },
  { path: '/expense-renewals', element: <ExpenseRenewals /> },
  { path: '/customers', element: <Customers /> },
  { path: '/websites', element: <Websites /> },
  { path: '*', element: <Navigate to="/accounts" replace /> },
];
