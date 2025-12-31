import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConfirmDeleteModal from './ConfirmDeleteModal';
import LeaveRequestsModal from './LeaveRequestsModal';
import type { Account, LeaveRequest } from '../projectsDasboard/interface/type';

interface AccountTableProps {
  accounts: Account[];
  leaveRequests: LeaveRequest[];
  onUpdateAccount: (updated: Account) => void | Promise<void>;
  onCreateAccount: (input: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<Account> | Account;
  onDeleteAccount: (id: number) => void | Promise<void>;
  onUpdateLeaveRequest: (updated: LeaveRequest) => void | Promise<void>;
}

export default function AccountTable({
  accounts,
  leaveRequests,
  onUpdateAccount,
  onDeleteAccount,
  onUpdateLeaveRequest,
}: AccountTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [draft, setDraft] = useState<Account | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const autosaveTimerRef = useRef<number | null>(null);

  const selectedAccount = useMemo(() => {
    if (!selectedId) return null;
    return accounts.find((a) => a.id === selectedId) ?? null;
  }, [accounts, selectedId]);

  const displayAccounts = useMemo(() => {
    if (isCreating && draft) return [draft, ...accounts];
    return accounts;
  }, [accounts, draft, isCreating]);

  const isDirty = useMemo(() => {
    if (!selectedId || !draft) return false;
    if (isCreating) return true;
    if (!selectedAccount) return false;

    return (
      draft.username !== selectedAccount.username ||
      draft.name !== selectedAccount.name ||
      draft.email !== selectedAccount.email ||
      draft.phone !== selectedAccount.phone ||
      draft.role_system !== selectedAccount.role_system ||
      draft.point !== selectedAccount.point ||
      draft.position !== selectedAccount.position ||
      draft.salary !== selectedAccount.salary ||
      draft.payable !== selectedAccount.payable ||
      draft.join_date !== selectedAccount.join_date ||
      draft.status !== selectedAccount.status
    );
  }, [draft, isCreating, selectedAccount, selectedId]);

  const filteredAccounts = displayAccounts.filter((account) => {
    const term = searchTerm.trim().toLowerCase();

    const normalize = (value: unknown) => String(value ?? '').toLowerCase();
    return (
      normalize((account as unknown as { username?: unknown }).username).includes(term) ||
      normalize(account.name).includes(term) ||
      normalize(account.email).includes(term) ||
      normalize(account.position).includes(term) ||
      normalize(account.phone).includes(term)
    );
  });

  const formatDateVi = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
  };

  const formatDateTimeVi = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN');
  };

  const columnsCount = 17;

  const cellBase = 'px-4 py-3 align-top border-b border-gray-100 group-hover:bg-gray-50/30 transition-colors whitespace-nowrap';
  const stickyCellBase = 'px-4 py-3 align-top border-b border-gray-100 transition-colors whitespace-nowrap';
  const headerBase = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/95 backdrop-blur sticky top-0 z-10 border-b border-gray-200 whitespace-nowrap shadow-sm';

  const stickyRightDivider =
    "relative after:content-[''] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-200 after:pointer-events-none";

  const leaveRequestsForSelected = useMemo(() => {
    if (!selectedAccount) return [];
    return leaveRequests.filter((req) => req.accountId === selectedAccount.id);
  }, [leaveRequests, selectedAccount]);

  const hasPendingLeaveByAccountId = useMemo(() => {
    const map: Record<number, true> = {};
    for (const request of leaveRequests) {
      if (request.trangThai === 'pending') {
        map[request.accountId] = true;
      }
    }
    return map;
  }, [leaveRequests]);

  useEffect(() => {
    // Autosave edits (debounced) for existing accounts.
    if (!selectedId || !draft) return;
    if (isCreating) return;
    if (!selectedAccount) return;
    if (!isDirty) return;
    if (busy) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      setBusy(true);
      setErrorMessage('');
      Promise.resolve(onUpdateAccount(draft))
        .catch((e: unknown) => {
          setErrorMessage(e instanceof Error ? e.message : 'Không cập nhật được tài khoản');
        })
        .finally(() => {
          setBusy(false);
        });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [busy, draft, isCreating, isDirty, onUpdateAccount, selectedAccount, selectedId]);

  return (
    <div className="mt-6">
      {/* Search and Actions */}
      <div className="flex items-center justify-between mb-3 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-11 pr-4 border border-gray-400 rounded-lg bg-white outline-none focus:border-gray-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            className="h-10 px-5 rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={busy}
            onClick={() => {
              setErrorMessage('');
              navigate('/register');
            }}
          >
            Thêm tài khoản
          </button>

          <button
            type="button"
            className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={!selectedAccount || busy}
            onClick={() => {
              if (!selectedAccount) return;
              setErrorMessage('');
              setIsLeaveModalOpen(true);
              setSelectedLeaveId(null);
            }}
          >
            Xem đơn nghỉ phép
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <LeaveRequestsModal
        key={isLeaveModalOpen ? `open-${selectedAccount?.id ?? 'none'}` : 'closed'}
        open={isLeaveModalOpen && Boolean(selectedAccount)}
        accountName={selectedAccount?.name ?? ''}
        requests={leaveRequestsForSelected}
        selectedLeaveId={selectedLeaveId}
        onSelectLeaveId={setSelectedLeaveId}
        onUpdateRequest={(updated) => {
          setBusy(true);
          setErrorMessage('');
          Promise.resolve(onUpdateLeaveRequest(updated))
            .catch((e: unknown) => {
              setErrorMessage(e instanceof Error ? e.message : 'Không cập nhật được đơn nghỉ phép');
            })
            .finally(() => {
              setBusy(false);
            });
        }}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setSelectedLeaveId(null);
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteConfirmOpen}
        title="Xác nhận xóa tài khoản"
        description={selectedAccount ? `Bạn có chắc chắn muốn xóa tài khoản "${selectedAccount.name}" không?` : 'Bạn có chắc chắn muốn xóa tài khoản này không?'}
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (!selectedAccount) {
            setIsDeleteConfirmOpen(false);
            return;
          }

          const deletingId = selectedAccount.id;
          setBusy(true);
          setErrorMessage('');
          Promise.resolve(onDeleteAccount(deletingId))
            .then(() => {
              setSelectedId(null);
              setIsDeleteConfirmOpen(false);
            })
            .catch((e: unknown) => {
              setErrorMessage(e instanceof Error ? e.message : 'Không xóa được tài khoản');
            })
            .finally(() => {
              setBusy(false);
            });
        }}
      />

      {/* Table */}
      <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="min-w-max w-full border-collapse">
            <thead>
              <tr>
                <th className={`${headerBase} w-16 sticky left-0 z-30 bg-gray-50`}>ID</th>
                <th className={`${headerBase} ${stickyRightDivider} w-56 sticky left-16 z-30 bg-gray-50`}>Tên nhân sự</th>
                <th className={`${headerBase} w-44`}>Tên đăng nhập</th>
                <th className={`${headerBase} w-28`}>Nghỉ phép</th>
                <th className={`${headerBase} w-64`}>Email</th>
                <th className={`${headerBase} w-40`}>SĐT</th>
                <th className={`${headerBase} w-40`}>Quyền hệ thống</th>
                <th className={`${headerBase} w-24`}>Điểm</th>
                <th className={`${headerBase} w-40`}>Chức danh</th>
                <th className={`${headerBase} w-40`}>Lương</th>
                <th className={`${headerBase} w-40`}>Công nợ</th>
                <th className={`${headerBase} w-36`}>Ngày vào</th>
                <th className={`${headerBase} w-36`}>Trạng thái</th>
                <th className={`${headerBase} w-44`}>Last login</th>
                <th className={`${headerBase} w-44`}>Created</th>
                <th className={`${headerBase} w-44`}>Updated</th>
                <th className={`${headerBase} w-24 text-right`}>Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td className="py-8 px-4 text-center text-gray-500 italic" colSpan={columnsCount}>
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => {
                      if (isLeaveModalOpen) return;
                      setErrorMessage('');
                      setIsCreating(false);
                      setSelectedId(account.id);
                      setDraft({ ...account, username: (account as unknown as { username?: string }).username ?? '' });
                    }}
                    className={`group transition-colors ${selectedId === account.id ? 'bg-teal-50/60' : 'hover:bg-gray-50/50'} cursor-pointer`}
                  >
                    {(() => {
                      const isActiveRow = selectedId === account.id && Boolean(draft);
                      const row = isActiveRow && draft ? draft : account;

                      const inputBase = 'h-9 w-full px-2 border border-gray-300 rounded bg-white outline-none focus:border-gray-600';

                      return (
                        <>
                          <td
                            className={`${stickyCellBase} font-medium text-gray-500 sticky left-0 z-20 ${selectedId === account.id ? 'bg-teal-50' : 'bg-white group-hover:bg-gray-50'
                              }`}
                          >
                            {isCreating && isActiveRow ? 'NEW' : account.id}
                          </td>

                          <td
                            className={`${stickyCellBase} ${stickyRightDivider} sticky left-16 z-30 font-medium text-gray-900 ${selectedId === account.id ? 'bg-teal-50' : 'bg-white group-hover:bg-gray-50'
                              }`}
                          >
                            {isActiveRow && draft ? (
                              <input
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              account.name
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                value={draft.username}
                                onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.username || '-'
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {hasPendingLeaveByAccountId[account.id] ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-sm text-gray-600">Chờ duyệt</span>
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                type="email"
                                value={draft.email}
                                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.email
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                value={draft.phone}
                                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.phone
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                value={draft.role_system}
                                onChange={(e) => setDraft({ ...draft, role_system: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.role_system
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                type="number"
                                value={draft.point}
                                onChange={(e) => {
                                  const nextValue = Number(e.target.value);
                                  setDraft({ ...draft, point: Number.isFinite(nextValue) ? nextValue : 0 });
                                }}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.point
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                value={draft.position}
                                onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.position
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                type="number"
                                value={draft.salary}
                                onChange={(e) => {
                                  const nextValue = Number(e.target.value);
                                  setDraft({ ...draft, salary: Number.isFinite(nextValue) ? nextValue : 0 });
                                }}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.salary
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                type="number"
                                value={draft.payable}
                                onChange={(e) => {
                                  const nextValue = Number(e.target.value);
                                  setDraft({ ...draft, payable: Number.isFinite(nextValue) ? nextValue : 0 });
                                }}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.payable
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                type="date"
                                value={draft.join_date}
                                onChange={(e) => setDraft({ ...draft, join_date: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              formatDateVi(row.join_date)
                            )}
                          </td>

                          <td className={`${cellBase} text-gray-800`}>
                            {isActiveRow && draft ? (
                              <input
                                value={draft.status}
                                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                                className={inputBase}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              row.status
                            )}
                          </td>

                          <td className={`${cellBase} text-sm text-gray-600`}>{formatDateTimeVi(row.last_login_at)}</td>
                          <td className={`${cellBase} text-sm text-gray-600`}>{formatDateTimeVi(row.created_at)}</td>
                          <td className={`${cellBase} text-sm text-gray-600`}>{formatDateTimeVi(row.updated_at)}</td>

                          <td className={`${cellBase} text-right`}>
                            <button
                              type="button"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                setErrorMessage('');
                                setIsCreating(false);
                                setSelectedId(account.id);
                                setDraft({ ...account, username: (account as unknown as { username?: string }).username ?? '' });
                                setIsDeleteConfirmOpen(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
