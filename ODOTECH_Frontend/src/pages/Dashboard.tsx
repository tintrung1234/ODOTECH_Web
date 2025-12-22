import StatCard from '../components/accountsDasboard/StatCard';
import AccountTable from '../components/accountsDasboard/AccountTable';
import LeaveCalendarPanel from '../components/accountsDasboard/LeaveCalendarPanel';
import LeaveApprovalPanel from '../components/accountsDasboard/LeaveApprovalPanel';
import type { LeaveRequest } from '../types/Interface';
import { useMemo, useState } from 'react';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sample data - replace with API calls later
const sampleAccounts = [
  {
    id: 1,
    hoTen: 'Nguyễn Văn A',
    chucVu: 'Nhân viên',
    email: 'nguyenvana@odotech.vn',
    bankName: 'Vietcombank',
    bankAccountNumber: '0123456789',
    soNgayPhep: 12,
    nguoiQuanLy: 'Trần Văn B',
  },
  {
    id: 2,
    hoTen: 'Trần Văn B',
    chucVu: 'Quản lý',
    email: 'tranvanb@odotech.vn',
    bankName: 'BIDV',
    bankAccountNumber: '9876543210',
    soNgayPhep: 15,
    nguoiQuanLy: 'Lê Văn C',
  },
  {
    id: 3,
    hoTen: 'Lê Thị C',
    chucVu: 'Nhân viên',
    email: 'lethic@odotech.vn',
    bankName: 'Techcombank',
    bankAccountNumber: '1231231231',
    soNgayPhep: 10,
    nguoiQuanLy: 'Trần Văn B',
  },
];

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

export default function Dashboard() {
  const stats = {
    totalAccounts: 20,
    totalManagers: 4,
    totalEmployees: 17,
  };

  const currentMonth = useMemo(() => new Date(), []);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(() => toLocalIsoDate(new Date()));
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(sampleLeaveRequests);

  const selectedLeaveRequest = useMemo(() => {
    if (!selectedLeaveId) return null;
    return leaveRequests.find((r) => r.id === selectedLeaveId) ?? null;
  }, [leaveRequests, selectedLeaveId]);

  const handleUpdateRequest = (updated: LeaveRequest) => {
    setLeaveRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const accountNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const acc of sampleAccounts) {
      map[acc.id] = acc.hoTen;
    }
    return map;
  }, []);

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
              onUpdateRequest={handleUpdateRequest}
            />

            <div className="border border-gray-200 rounded-lg p-4">
              {!selectedLeaveRequest ? (
                <div className="text-gray-600">Chọn một đơn để xem chi tiết.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Nhân viên: {accountNameById[selectedLeaveRequest.accountId] ?? '-'}
                  </div>
                  <div className="mt-4">
                    <LeaveApprovalPanel request={selectedLeaveRequest} onUpdateRequest={handleUpdateRequest} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <AccountTable accounts={sampleAccounts} />
      </div>
    </main>
  );
}

