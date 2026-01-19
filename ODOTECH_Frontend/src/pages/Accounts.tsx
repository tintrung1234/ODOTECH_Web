import StatCard from '../components/accountsDasboard/StatCard';
import { User, Mail, Phone, Calendar, DollarSign, CreditCard, Award, Layers, Star, Database, Code } from 'lucide-react';
import AccountTable from '../components/accountsDasboard/AccountTable';
import LeaveCalendarPanel from '../components/accountsDasboard/LeaveCalendarPanel';
import LeaveApprovalPanel from '../components/accountsDasboard/LeaveApprovalPanel';
import { type Account, type LeaveRequest, POSITION_OPTIONS, STATUS_OPTIONS } from '../interface/type';
import { useEffect, useMemo, useState } from 'react';
import { getTokenUser, normalizeRole, type CanonicalRole } from '../utils/auth';


function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Accounts() {
  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<CanonicalRole>('unknown');
  const [tokenUid, setTokenUid] = useState<number | null>(null);
  const [stats, setStats] = useState<{ totalAccounts: number; totalManagers: number; totalEmployees: number }>({
    totalAccounts: 0,
    totalManagers: 0,
    totalEmployees: 0,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const isSupport = role === 'support';
  const isAdmin = role === 'admin';
  const isMember = !(isAdmin || isSupport);

  const currentMonth = useMemo(() => new Date(), []);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(() => toLocalIsoDate(new Date()));
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [leaveForm, setLeaveForm] = useState<{ tuNgay: string; denNgay: string; lyDo: string }>(() => {
    const today = toLocalIsoDate(new Date());
    return { tuNgay: today, denNgay: today, lyDo: '' };
  });
  const [leaveFormBusy, setLeaveFormBusy] = useState(false);
  const [leaveFormError, setLeaveFormError] = useState<string>('');

  // Competency Framework State
  const [competencyModalOpen, setCompetencyModalOpen] = useState(false);
  const [competencyForm, setCompetencyForm] = useState<{
    frontend?: string[];
    backend?: string[];
    database?: string[];
    others?: string[];
  }>({});

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

  const loadAll = async (opts: { mode: 'member' | 'adminOrSupport'; uid: number | null }) => {
    setLoading(true);
    try {
      if (opts.mode === 'member') {
        if (!opts.uid) throw new Error('Không xác định được tài khoản đăng nhập.');

        const [accountRes, leaveRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/accounts/${opts.uid}`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/leave-requests?accountId=${opts.uid}&limit=200&offset=0`, { credentials: 'include' }),
        ]);
        if (!accountRes.ok) throw new Error(await readErrorMessage(accountRes));
        if (!leaveRes.ok) throw new Error(await readErrorMessage(leaveRes));

        const accountJson = (await accountRes.json()) as Account;
        const leaveJson = (await leaveRes.json()) as { items?: LeaveRequest[] } | LeaveRequest[];

        setAccounts([accountJson]);
        setLeaveRequests(Array.isArray(leaveJson) ? leaveJson : (leaveJson.items ?? []));
        setStats({ totalAccounts: 1, totalManagers: 0, totalEmployees: 1 });

        setSelectedAccountId(accountJson.id);
      } else {
        const [statsRes, accountsRes, leaveRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/accounts/stats`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/accounts?limit=1000&offset=0`, { credentials: 'include' }),
          fetch(`${apiBaseUrl}/api/leave-requests?limit=500&offset=0`, { credentials: 'include' }),
        ]);

        if (!statsRes.ok) throw new Error(await readErrorMessage(statsRes));
        if (!accountsRes.ok) throw new Error(await readErrorMessage(accountsRes));
        if (!leaveRes.ok) throw new Error(await readErrorMessage(leaveRes));

        const statsJson = (await statsRes.json()) as { totalAccounts: number; totalManagers: number; totalEmployees: number };
        const accountsJson = (await accountsRes.json()) as { items?: Account[] } | Account[];
        const leaveJson = (await leaveRes.json()) as { items?: LeaveRequest[] } | LeaveRequest[];

        const list = Array.isArray(accountsJson) ? accountsJson : (accountsJson.items ?? []);
        setStats({
          totalAccounts: Number(statsJson?.totalAccounts ?? 0),
          totalManagers: Number(statsJson?.totalManagers ?? 0),
          totalEmployees: Number(statsJson?.totalEmployees ?? 0),
        });

        setAccounts(list);
        setLeaveRequests(Array.isArray(leaveJson) ? leaveJson : (leaveJson.items ?? []));

        setSelectedAccountId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const user = await getTokenUser();
      const nextRole = normalizeRole(user?.role);
      setRole(nextRole);
      setTokenUid(typeof user?.uid === 'number' ? user.uid : null);

      const mode: 'member' | 'adminOrSupport' = nextRole === 'admin' || nextRole === 'support' ? 'adminOrSupport' : 'member';
      await loadAll({ mode, uid: typeof user?.uid === 'number' ? user.uid : null });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl]);

  const handleUpdateRequest = async (updated: LeaveRequest) => {
    const res = await fetch(`${apiBaseUrl}/api/leave-requests/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const saved = (await res.json()) as LeaveRequest;
    setLeaveRequests((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
  };

  const handleCreateLeaveRequest = async (input: { accountId: number; tuNgay: string; denNgay: string; lyDo: string }) => {
    const res = await fetch(`${apiBaseUrl}/api/leave-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        accountId: input.accountId,
        tuNgay: input.tuNgay,
        denNgay: input.denNgay,
        lyDo: input.lyDo,
        trangThai: 'pending',
        ngayTao: toLocalIsoDate(new Date()),
      }),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const created = (await res.json()) as LeaveRequest;
    setLeaveRequests((prev) => [created, ...prev]);
    return created;
  };

  const handleUpdateAccount = async (updated: Account) => {
    const res = await fetch(`${apiBaseUrl}/api/accounts/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
    const res = await fetch(`${apiBaseUrl}/api/accounts/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setLeaveRequests((prev) => prev.filter((r) => r.accountId !== id));
  };

  const handleGetPasswordStatus = async (accountId: number): Promise<{ hasPassword: boolean }> => {
    const res = await fetch(`${apiBaseUrl}/api/accounts/${accountId}/password-status`, { credentials: 'include' });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    const json = (await res.json()) as { hasPassword?: boolean };
    return { hasPassword: Boolean(json?.hasPassword) };
  };

  const handleSetPassword = async (accountId: number, password?: string): Promise<{ temporaryPassword?: string }> => {
    const res = await fetch(`${apiBaseUrl}/api/accounts/${accountId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(password ? { password } : {}),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    const json = (await res.json()) as { temporaryPassword?: string };
    return { temporaryPassword: json?.temporaryPassword };
  };

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find((a) => a.id === selectedAccountId) ?? null;
  }, [accounts, selectedAccountId]);

  const selectedLeave = useMemo(() => {
    if (!selectedLeaveId) return null;
    return leaveRequests.find((r) => r.id === selectedLeaveId) ?? null;
  }, [leaveRequests, selectedLeaveId]);

  const selectedLeaveRequesterName = useMemo(() => {
    if (!selectedLeave) return '';
    const acc = accounts.find((a) => a.id === selectedLeave.accountId);
    return acc?.name ?? '';
  }, [accounts, selectedLeave]);

  const tenureText = useMemo(() => {
    const join = selectedAccount?.join_date;
    if (!join) return '-';
    const start = new Date(join);
    if (Number.isNaN(start.getTime())) return '-';
    const now = new Date();
    const years = (now.getFullYear() - start.getFullYear()) - (now < new Date(now.getFullYear(), start.getMonth(), start.getDate()) ? 1 : 0);
    const safeYears = Math.max(0, years);
    return `${safeYears} năm`;
  }, [selectedAccount?.join_date]);

  const money = useMemo(() => {
    const salary = Number(selectedAccount?.salary ?? 0);
    const payable = Number(selectedAccount?.payable ?? 0);
    const net = salary - payable;
    return { salary, payable, net };
  }, [selectedAccount?.payable, selectedAccount?.salary]);

  return (
    <main className="flex-1 px-6 py-3">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Quản lý nhân sự</h1>
            <div className="text-sm text-gray-600 mt-1">
              {isAdmin ? 'Vai trò: Admin' : isSupport ? 'Vai trò: Hỗ trợ tổng (xem, không sửa)' : 'Vai trò: Member'}
            </div>
          </div>

          {selectedAccount ? (
            <div className="text-sm text-gray-600">
              Đang xem: <span className="font-semibold text-gray-900">{selectedAccount.name}</span>
            </div>
          ) : null}
        </div>

        {/* Quản lý danh sách */}
        {isMember ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Điểm đánh giá hiện tại" value={selectedAccount?.point ?? 0} color="blue" />
            <StatCard title="Thâm niên" value={tenureText} color="green" />
            <StatCard title="Lương - Công nợ" value={money.net} suffix="" color="orange" tooltipTitle="Tạm tính" tooltipItems={['Tạm tính = Lương - Công nợ']} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Số lượng nhân sự" value={stats.totalAccounts} color="green" />
            <StatCard title="Số lượng quản lý" value={stats.totalManagers} color="purple" />
            <StatCard title="Số lượng nhân viên" value={stats.totalEmployees} color="orange" />
          </div>
        )}

        {isMember ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Xin phép */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">Xin phép</div>
              <div className="text-sm text-gray-600 mt-1">Tạo đơn nghỉ phép (trạng thái: chờ duyệt)</div>

              {leaveFormError ? (
                <div className="mt-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{leaveFormError}</div>
              ) : null}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={leaveForm.tuNgay}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, tuNgay: e.target.value }))}
                    disabled={leaveFormBusy}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={leaveForm.denNgay}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, denNgay: e.target.value }))}
                    disabled={leaveFormBusy}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                  <textarea
                    value={leaveForm.lyDo}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, lyDo: e.target.value }))}
                    disabled={leaveFormBusy}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                    placeholder="Ví dụ: Nghỉ phép cá nhân"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="h-10 px-5 rounded-lg bg-teal-600 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  disabled={leaveFormBusy || !tokenUid}
                  onClick={() => {
                    (async () => {
                      if (!tokenUid) return;
                      setLeaveFormError('');
                      if (!leaveForm.tuNgay || !leaveForm.denNgay) {
                        setLeaveFormError('Vui lòng chọn ngày bắt đầu và kết thúc');
                        return;
                      }
                      setLeaveFormBusy(true);
                      try {
                        await handleCreateLeaveRequest({
                          accountId: tokenUid,
                          tuNgay: leaveForm.tuNgay,
                          denNgay: leaveForm.denNgay,
                          lyDo: leaveForm.lyDo,
                        });
                        setLeaveForm((p) => ({ ...p, lyDo: '' }));
                      } catch (e: unknown) {
                        setLeaveFormError(e instanceof Error ? e.message : 'Không tạo được đơn nghỉ phép');
                      } finally {
                        setLeaveFormBusy(false);
                      }
                    })();
                  }}
                >
                  Gửi đơn
                </button>
                <div className="text-sm text-gray-600">Đơn sẽ được quản lý duyệt.</div>
              </div>
            </div>

            {/* Gia hạn hợp đồng (UI placeholder) */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">Gia hạn hợp đồng</div>
              <div className="text-sm text-gray-600 mt-1">Hiện hệ thống chưa có trường ngày hết hạn hợp đồng trong bảng accounts.</div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Ngày vào công ty</div>
                  <div className="font-medium text-gray-900">{selectedAccount?.join_date || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Trạng thái</div>
                  <div className="font-medium text-gray-900">{selectedAccount?.status || '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500">Gợi ý triển khai</div>
                  <div className="text-sm text-gray-700">Cần bổ sung DB/API: contract_start, contract_end, contract_type, renewal_history.</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">Nghỉ phép</div>
              <div className="text-sm text-gray-600 mt-1">Chọn ngày để xem và duyệt đơn</div>
              <div className="mt-4">
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

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">Duyệt đơn</div>
              <div className="text-sm text-gray-600 mt-1">{isSupport ? 'Chế độ xem' : 'Có thể duyệt/từ chối'}</div>
              <div className="mt-4">
                {isSupport ? (
                  <div className="text-gray-600">Hỗ trợ tổng chỉ xem, không duyệt.</div>
                ) : (
                  <LeaveApprovalPanel
                    request={selectedLeave}
                    requesterName={selectedLeaveRequesterName}
                    onUpdateRequest={(updated) => {
                      void handleUpdateRequest(updated);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Thông tin nhân sự + Các chỉ số (Compact Design) */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
          {/* Thông tin nhân sự */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-100/50 flex items-center gap-2">
              <User size={18} className="text-blue-700" />
              <h3 className="text-sm font-bold text-gray-900">Thông tin nhân sự</h3>
            </div>

            {!selectedAccount ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                <User size={48} className="mb-3 opacity-20" />
                <span className="text-sm">Chưa chọn nhân sự</span>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                    {selectedAccount.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-xl font-bold text-gray-900 truncate">{selectedAccount.name}</h2>
                    <div className="text-sm text-gray-600 font-medium flex items-center gap-1">
                      {POSITION_OPTIONS.find(p => p.value === selectedAccount.position)?.label || selectedAccount.position || 'Chưa cập nhật chức danh'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
                        ID: {selectedAccount.id}
                      </span>
                      <span className={`px-2.5 py-1 rounded border font-semibold ${selectedAccount.status === 'active' || selectedAccount.status === 'Chính thức' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                        {STATUS_OPTIONS.find(s => s.value === selectedAccount.status)?.label || selectedAccount.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Contract Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Liên hệ</h4>
                    <div className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                        <Mail size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-600 font-medium">Email</div>
                        <div className="font-semibold text-gray-900 truncate" title={selectedAccount.email}>{selectedAccount.email || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
                        <Phone size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-600 font-medium">Điện thoại</div>
                        <div className="font-semibold text-gray-900">{selectedAccount.phone || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Hợp đồng & Lương</h4>
                    <div className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                        <Calendar size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-600 font-medium">Ngày vào làm</div>
                        <div className="font-semibold text-gray-900">{selectedAccount.join_date || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                        <DollarSign size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-600 font-medium">Lương cơ bản</div>
                        <div className="font-semibold text-gray-900">{Number(selectedAccount.salary ?? 0).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm group">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                        <CreditCard size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-600 font-medium">Công nợ</div>
                        <div className="font-semibold text-gray-900">{Number(selectedAccount.payable ?? 0).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Các chỉ số nhân sự */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-100/50 flex items-center gap-2">
              <Award size={18} className="text-orange-600" />
              <h3 className="text-sm font-bold text-gray-900">Các chỉ số & Kỹ năng</h3>
            </div>

            {!selectedAccount ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                <Award size={48} className="mb-3 opacity-20" />
                <span className="text-sm">Chưa chọn nhân sự</span>
              </div>
            ) : (
              <div className="p-5">
                {/* Top Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                    <div className="text-xs text-green-700 font-bold mb-1">Thâm niên</div>
                    <div className="text-sm font-extrabold text-gray-900">{tenureText}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                    <div className="text-xs text-blue-700 font-bold mb-1">Điểm số</div>
                    <div className="text-xl font-extrabold text-gray-900">{selectedAccount.point ?? 0}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                    <div className="text-xs text-orange-700 font-bold mb-1">Thực lĩnh</div>
                    <div className="text-sm font-extrabold text-gray-900">{Number(money.net).toLocaleString('vi-VN')}</div>
                    <div className="text-[10px] text-orange-600 font-semibold mt-0.5">Tạm tính</div>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Khung năng lực</h4>
                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setCompetencyForm(selectedAccount.competency_framework || { frontend: [], backend: [], database: [], others: [] });
                        setCompetencyModalOpen(true);
                      }}
                      className="text-[10px] px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <Code size={10} /> Cập nhật
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-indigo-800 font-bold text-sm">
                        <Code size={14} /> Frontend
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedAccount.competency_framework?.frontend?.length ? selectedAccount.competency_framework.frontend : ['Chưa cập nhật']).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 shadow-sm">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-sm">
                        <Database size={14} /> Backend
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedAccount.competency_framework?.backend?.length ? selectedAccount.competency_framework.backend : ['Chưa cập nhật']).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 shadow-sm">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3 hover:border-violet-300 hover:bg-violet-50/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-violet-800 font-bold text-sm">
                        <Layers size={14} /> Database
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedAccount.competency_framework?.database?.length ? selectedAccount.competency_framework.database : ['Chưa cập nhật']).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 shadow-sm">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3 hover:border-pink-300 hover:bg-pink-50/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-pink-800 font-bold text-sm">
                        <Star size={14} /> Khác
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedAccount.competency_framework?.others?.length ? selectedAccount.competency_framework.others : ['Chưa cập nhật']).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 shadow-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách nhân sự (Admin/Support) */}
        {!isMember ? (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">Quản lý danh sách</div>
                <div className="text-sm text-gray-600">Các chỉ số, điểm số, gia hạn hợp đồng (UI)</div>
              </div>
              <div className="text-sm text-gray-600">{isSupport ? 'Chế độ xem' : 'Chế độ quản trị'}</div>
            </div>

            {loading ? (
              <div className="mt-4 text-gray-600">Đang tải dữ liệu...</div>
            ) : (
              <AccountTable
                accounts={accounts}
                leaveRequests={leaveRequests}
                onUpdateAccount={(acc) => handleUpdateAccount(acc)}
                onCreateAccount={(input) => handleCreateAccount(input)}
                onDeleteAccount={(id) => handleDeleteAccount(id)}
                onUpdateLeaveRequest={(req) => handleUpdateRequest(req)}
                readOnly={isSupport}
                canResetPassword={isAdmin}
                onGetPasswordStatus={isAdmin ? handleGetPasswordStatus : undefined}
                onSetPassword={isAdmin ? handleSetPassword : undefined}
                onSelectAccount={(acc) => setSelectedAccountId(acc.id)}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Competency Edit Modal */}
      {competencyModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cập nhật khung năng lực</h3>
                <div className="text-sm text-gray-600">Nhân sự: <span className="font-semibold text-gray-900">{selectedAccount.name}</span></div>
              </div>
              <button onClick={() => setCompetencyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {[
                { key: 'frontend', label: 'Frontend', icon: <Code size={18} className="text-indigo-600" />, placeholder: 'VD: React, Vue, CSS...' },
                { key: 'backend', label: 'Backend', icon: <Database size={18} className="text-emerald-600" />, placeholder: 'VD: NodeJs, Python, Go...' },
                { key: 'database', label: 'Database', icon: <Layers size={18} className="text-violet-600" />, placeholder: 'VD: PostgreSQL, MongoDB...' },
                { key: 'others', label: 'Khác', icon: <Star size={18} className="text-pink-600" />, placeholder: 'VD: Git, Docker, English...' },
              ].map((section) => (
                <div key={section.key} className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {section.icon} {section.label}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[44px]">
                    {competencyForm[section.key as keyof typeof competencyForm]?.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm group">
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = competencyForm[section.key as keyof typeof competencyForm]?.filter((_, i) => i !== idx);
                            setCompetencyForm(prev => ({ ...prev, [section.key]: newSkills }));
                          }}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 min-w-[150px] flex-1"
                      placeholder={`+ Thêm kỹ năng ${section.label} (Enter)`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            const current = competencyForm[section.key as keyof typeof competencyForm] || [];
                            if (!current.includes(val)) {
                              setCompetencyForm(prev => ({ ...prev, [section.key]: [...current, val] }));
                            }
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setCompetencyModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 shadow-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  try {
                    // Update account with new competency framework
                    await handleUpdateAccount({
                      ...selectedAccount,
                      competency_framework: competencyForm
                    } as Account);
                    setCompetencyModalOpen(false);
                  } catch (error) {
                    alert('Có lỗi xảy ra khi cập nhật: ' + (error instanceof Error ? error.message : String(error)));
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md shadow-blue-200"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
