import StatCard from '../components/accountsDasboard/StatCard';
import AccountTable from '../components/accountsDasboard/AccountTable';
import LeaveCalendarPanel from '../components/accountsDasboard/LeaveCalendarPanel';
import type { Account, LeaveRequest } from '../components/projectsDasboard/interface/type';
import { useEffect, useMemo, useState } from 'react';
import { buildAuthHeaders } from '../utils/auth';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<{ totalAccounts: number; totalManagers: number; totalEmployees: number }>({
    totalAccounts: 0,
    totalManagers: 0,
    totalEmployees: 0,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const currentMonth = useMemo(() => new Date(), []);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(() => toLocalIsoDate(new Date()));
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  const readErrorMessage = async (res: Response) => {
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, accountsRes, leaveRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/accounts/stats`, { headers: buildAuthHeaders() }),
        fetch(`${apiBaseUrl}/api/accounts?limit=200&offset=0`, { headers: buildAuthHeaders() }),
        fetch(`${apiBaseUrl}/api/leave-requests?limit=500&offset=0`, { headers: buildAuthHeaders() }),
      ]);

      console.log(accountsRes);
      if (!statsRes.ok) throw new Error(await readErrorMessage(statsRes));
      if (!accountsRes.ok) throw new Error(await readErrorMessage(accountsRes));
      if (!leaveRes.ok) throw new Error(await readErrorMessage(leaveRes));
      
      const statsJson = (await statsRes.json()) as { totalAccounts: number; totalManagers: number; totalEmployees: number };
      const accountsJson = (await accountsRes.json()) as { items?: Account[] } | Account[];
      const leaveJson = (await leaveRes.json()) as { items?: LeaveRequest[] } | LeaveRequest[];
      
      setStats({
        totalAccounts: Number(statsJson?.totalAccounts ?? 0),
        totalManagers: Number(statsJson?.totalManagers ?? 0),
        totalEmployees: Number(statsJson?.totalEmployees ?? 0),
      });

      setAccounts(Array.isArray(accountsJson) ? accountsJson : (accountsJson.items ?? []));
      setLeaveRequests(Array.isArray(leaveJson) ? leaveJson : (leaveJson.items ?? []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  const handleUpdateRequest = async (updated: LeaveRequest) => {
    const res = await fetch(`${apiBaseUrl}/api/leave-requests/${updated.id}`, {
      method: 'PUT',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const saved = (await res.json()) as LeaveRequest;
    setLeaveRequests((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
  };

  const handleUpdateAccount = async (updated: Account) => {
    const res = await fetch(`${apiBaseUrl}/api/accounts/${updated.id}`, {
      method: 'PUT',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const saved = (await res.json()) as Account;
    setAccounts((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
  };

  const handleCreateAccount = async (
    input: Omit<Account, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Account> => {
    const res = await fetch(`${apiBaseUrl}/api/accounts`, {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const created = (await res.json()) as Account;
    setAccounts((prev) => [created, ...prev]);
    return created;
  };

  const handleDeleteAccount = async (id: number) => {
    const res = await fetch(`${apiBaseUrl}/api/accounts/${id}`, { method: 'DELETE', headers: buildAuthHeaders() });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setLeaveRequests((prev) => prev.filter((r) => r.accountId !== id));
  };

  console.log(accounts);
  
  return (
    <main className="flex-1 p-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Quản lý tài khoản</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Số lượng tài khoản" value={stats.totalAccounts} color="green" />
          <StatCard title="Số lượng quản lý" value={stats.totalManagers} color="purple" />
          <StatCard title="Số lượng nhân viên" value={stats.totalEmployees} color="orange" />
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveCalendarPanel
              month={currentMonth}
              requests={leaveRequests}
              selectedIsoDate={selectedIsoDate}
              onSelectIsoDate={setSelectedIsoDate}
              selectedLeaveId={selectedLeaveId}
              onSelectLeaveId={setSelectedLeaveId}
              onUpdateRequest={(updated) => {
                void handleUpdateRequest(updated);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-gray-600">Đang tải dữ liệu...</div>
        ) : (
          <AccountTable
            accounts={accounts}
            leaveRequests={leaveRequests}
            onUpdateAccount={(acc) => handleUpdateAccount(acc)}
            onCreateAccount={(input) => handleCreateAccount(input)}
            onDeleteAccount={(id) => handleDeleteAccount(id)}
            onUpdateLeaveRequest={(req) => handleUpdateRequest(req)}
          />
        )}
      </div>
    </main>
  );
}

