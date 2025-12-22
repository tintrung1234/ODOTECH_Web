import { useMemo, useState } from 'react';

import AccountEditModal from './AccountEditModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import LeaveRequestsModal from './LeaveRequestsModal';
import type { Account, LeaveRequest } from '../../types/Interface';

interface AccountTableProps {
  accounts: Account[];
}

const sampleLeaveRequests: LeaveRequest[] = [
  {
    id: 1001,
    accountId: 1,
    tuNgay: '2025-12-20',
    denNgay: '2025-12-22',
    lyDo: 'Nghỉ phép cá nhân',
    trangThai: 'pending',
    ngayTao: '2025-12-18',
  },
  {
    id: 1002,
    accountId: 1,
    tuNgay: '2025-11-10',
    denNgay: '2025-11-10',
    lyDo: 'Đi khám bệnh',
    trangThai: 'approved',
    ngayTao: '2025-11-08',
    nguoiDuyet: 'Trần Văn B',
    ngayXuLy: '2025-11-09',
    ghiChu: 'Đã duyệt',
  },
  {
    id: 1003,
    accountId: 2,
    tuNgay: '2025-12-05',
    denNgay: '2025-12-06',
    lyDo: 'Công việc gia đình',
    trangThai: 'rejected',
    ngayTao: '2025-12-01',
    nguoiDuyet: 'Lê Văn C',
    ngayXuLy: '2025-12-02',
    ghiChu: 'Chưa đủ thông tin',
  },
  {
    id: 1004,
    accountId: 3,
    tuNgay: '2025-12-28',
    denNgay: '2025-12-28',
    lyDo: 'Nghỉ phép năm',
    trangThai: 'pending',
    ngayTao: '2025-12-20',
  },
];

export default function AccountTable({ accounts }: AccountTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<number, Account>>({});
  const [deletedIds, setDeletedIds] = useState<Record<number, true>>({});

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(sampleLeaveRequests);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Account | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const displayAccounts = useMemo(() => {
    return accounts
      .filter((account) => !deletedIds[account.id])
      .map((account) => overrides[account.id] ?? account);
  }, [accounts, deletedIds, overrides]);

  const selectedAccount = useMemo(() => {
    if (!selectedId) return null;
    return displayAccounts.find((a) => a.id === selectedId) ?? null;
  }, [displayAccounts, selectedId]);

  const filteredAccounts = displayAccounts.filter((account) => {
    const term = searchTerm.toLowerCase();
    return (
      account.hoTen.toLowerCase().includes(term) ||
      account.email.toLowerCase().includes(term) ||
      account.chucVu.toLowerCase().includes(term)
    );
  });

  const showEmptyGrid = filteredAccounts.length === 0;
  const emptyRows = Array.from({ length: 10 }, (_, index) => index);

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
            className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={!selectedAccount}
            onClick={() => {
              if (!selectedAccount) return;
              setIsEditing(true);
              setDraft({ ...selectedAccount });
            }}
          >
            Chỉnh sửa
          </button>

          <button
            type="button"
            className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={!selectedAccount}
            onClick={() => {
              if (!selectedAccount) return;
              setIsLeaveModalOpen(true);
              setSelectedLeaveId(null);
            }}
          >
            Xem đơn nghỉ phép
          </button>

          <button
            type="button"
            className="h-10 px-5 border border-red-300 rounded-lg bg-white text-red-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={!selectedAccount}
            onClick={() => {
              if (!selectedAccount) return;
              setIsDeleteConfirmOpen(true);
            }}
          >
            Xóa
          </button>
        </div>
      </div>

      <LeaveRequestsModal
        key={isLeaveModalOpen ? `open-${selectedAccount?.id ?? 'none'}` : 'closed'}
        open={isLeaveModalOpen && Boolean(selectedAccount)}
        accountName={selectedAccount?.hoTen ?? ''}
        requests={leaveRequestsForSelected}
        selectedLeaveId={selectedLeaveId}
        onSelectLeaveId={setSelectedLeaveId}
        onUpdateRequest={(updated) => {
          setLeaveRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setSelectedLeaveId(null);
        }}
      />

      <AccountEditModal
        open={isEditing}
        draft={draft}
        onChangeDraft={setDraft}
        onClose={() => {
          setIsEditing(false);
          setDraft(null);
        }}
        onSave={() => {
          if (!draft) return;
          setOverrides((prev) => ({ ...prev, [draft.id]: draft }));
          setIsEditing(false);
          setDraft(null);
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteConfirmOpen}
        title="Xác nhận xóa tài khoản"
        description={selectedAccount ? `Bạn có chắc chắn muốn xóa tài khoản "${selectedAccount.hoTen}" không?` : 'Bạn có chắc chắn muốn xóa tài khoản này không?'}
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (!selectedAccount) {
            setIsDeleteConfirmOpen(false);
            return;
          }

          const deletingId = selectedAccount.id;
          setDeletedIds((prev) => ({ ...prev, [deletingId]: true }));
          setOverrides((prev) => {
            if (!prev[deletingId]) return prev;
            const next = { ...prev };
            delete next[deletingId];
            return next;
          });

          setSelectedId(null);
          setIsDeleteConfirmOpen(false);
        }}
      />

      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-20 border-b border-gray-300">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Họ tên</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Chức vụ</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Tên ngân hàng</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Số tài khoản</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Số ngày phép</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Người quản lý</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-28 border-b border-gray-300">Nghỉ phép</th>
            </tr>
          </thead>
          <tbody>
            {showEmptyGrid
              ? emptyRows.map((rowIndex) => (
                  <tr key={`empty-${rowIndex}`} className="h-12">
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300 border-r border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300"></td>
                    <td className="py-3 px-4 border-b border-gray-300"></td>
                  </tr>
                ))
              : filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => {
                      if (isEditing || isLeaveModalOpen) return;
                      setSelectedId(account.id);
                    }}
                    className={`cursor-pointer ${selectedId === account.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.id}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.hoTen}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.chucVu}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.email}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.bankName}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.bankAccountNumber}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{account.soNgayPhep}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300">{account.nguoiQuanLy}</td>
                    <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-l border-gray-300">
                      {hasPendingLeaveByAccountId[account.id] ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-sm text-gray-600">Chờ duyệt</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
