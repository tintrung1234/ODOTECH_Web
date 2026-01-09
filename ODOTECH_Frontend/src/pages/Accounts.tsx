import StatCard from '../components/accountsDasboard/StatCard';
import AccountTable from '../components/accountsDasboard/AccountTable';
import LeaveCalendarPanel from '../components/accountsDasboard/LeaveCalendarPanel';
import LeaveApprovalPanel from '../components/accountsDasboard/LeaveApprovalPanel';
import type { Account, LeaveRequest } from '../components/projectsDasboard/interface/type';
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
          fetch(`${apiBaseUrl}/api/accounts?limit=200&offset=0`, { credentials: 'include' }),
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

        {/* Thông tin nhân sự + Các chỉ số */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-lg font-semibold text-gray-900">Thông tin nhân sự</div>
            <div className="text-sm text-gray-600 mt-1">Thông tin cá nhân & hợp đồng</div>

            {!selectedAccount ? (
              <div className="mt-4 text-gray-600">Chưa chọn nhân sự.</div>
            ) : (
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Họ tên</div>
                    <div className="font-medium text-gray-900">{selectedAccount.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Chức danh</div>
                    <div className="font-medium text-gray-900">{selectedAccount.position || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{selectedAccount.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">SĐT</div>
                    <div className="font-medium text-gray-900">{selectedAccount.phone || '-'}</div>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-5">
                  <div className="text-sm font-semibold text-gray-800">Thông tin hợp đồng</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-sm text-gray-500">Ngày vào</div>
                      <div className="font-medium text-gray-900">{selectedAccount.join_date || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Trạng thái</div>
                      <div className="font-medium text-gray-900">{selectedAccount.status || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Lương</div>
                      <div className="font-medium text-gray-900">{Number(selectedAccount.salary ?? 0).toLocaleString('vi-VN')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Công nợ</div>
                      <div className="font-medium text-gray-900">{Number(selectedAccount.payable ?? 0).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-lg font-semibold text-gray-900">Các chỉ số nhân sự</div>
            <div className="text-sm text-gray-600 mt-1">Thâm niên, kỹ năng, năng lực, học tập</div>

            {!selectedAccount ? (
              <div className="mt-4 text-gray-600">Chưa chọn nhân sự.</div>
            ) : (
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard title="Thâm niên" value={tenureText} color="green" />
                  <StatCard title="Điểm (hiện tại)" value={selectedAccount.point ?? 0} color="blue" />
                  <StatCard title="Tạm tính lương" value={money.net.toLocaleString('vi-VN')} color="orange" tooltipTitle="Tạm tính" tooltipItems={['Tạm tính = Lương - Công nợ (chưa tính phụ cấp/khấu trừ)']} />
                </div>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Kỹ năng (khung tham chiếu)</div>
                  <div className="text-sm text-gray-600 mb-3">Tính năng đang phát triển*</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="font-semibold text-gray-900 mb-2">Frontend</div>
                      <ul className="list-disc pl-5 text-gray-700 space-y-1">
                        <li>HTML</li>
                        <li>CSS</li>
                        <li>Wordpress</li>
                        <li>ReactJs (NextJs)</li>
                        <li>AI</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="font-semibold text-gray-900 mb-2">Backend</div>
                      <ul className="list-disc pl-5 text-gray-700 space-y-1">
                        <li>PHP (Wordpress, Laravel)</li>
                        <li>NodeJs</li>
                        <li>AI</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="font-semibold text-gray-900 mb-2">Database</div>
                      <ul className="list-disc pl-5 text-gray-700 space-y-1">
                        <li>MySQL</li>
                        <li>AI</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="font-semibold text-gray-900 mb-2">Khác</div>
                      <ul className="list-disc pl-5 text-gray-700 space-y-1">
                        <li>Git</li>
                        <li>UX/UI (Figma, AI)</li>
                        <li>Năng lực</li>
                        <li>Học tập</li>
                      </ul>
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
                onSelectAccount={(acc) => setSelectedAccountId(acc.id)}
              />
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

