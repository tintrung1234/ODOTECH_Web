import { useMemo, useState } from 'react';

import StatCard from '../components/accountsDasboard/StatCard';

type RenewalStatus = 'active' | 'expiring' | 'expired' | 'renewed';

interface RenewalItem {
  id: number;
  khachHang: string;
  goi: string;
  giaTri: number;
  nguoiPhuTrach: string;
  trangThai: RenewalStatus;
  ngayBatDau: string; // ISO date
  ngayHetHan: string; // ISO date
  ghiChu?: string;
}

const sampleRenewals: RenewalItem[] = [
  {
    id: 4001,
    khachHang: 'Công ty ABC',
    goi: 'Gói ERP - Bảo trì',
    giaTri: 60000000,
    nguoiPhuTrach: 'Nguyễn Văn A',
    trangThai: 'expiring',
    ngayBatDau: '2025-01-01',
    ngayHetHan: '2025-12-31',
    ghiChu: 'Cần liên hệ trước 30 ngày',
  },
  {
    id: 4002,
    khachHang: 'Công ty XYZ',
    goi: 'Gói CRM - Gia hạn',
    giaTri: 30000000,
    nguoiPhuTrach: 'Trần Văn B',
    trangThai: 'active',
    ngayBatDau: '2025-07-01',
    ngayHetHan: '2026-06-30',
    ghiChu: 'Đang sử dụng ổn định',
  },
  {
    id: 4003,
    khachHang: 'Công ty MNO',
    goi: 'Gói HRM - Bảo trì',
    giaTri: 24000000,
    nguoiPhuTrach: 'Lê Thị C',
    trangThai: 'expired',
    ngayBatDau: '2024-12-01',
    ngayHetHan: '2025-11-30',
    ghiChu: 'Đã quá hạn, cần follow-up',
  },
  {
    id: 4004,
    khachHang: 'Công ty QRS',
    goi: 'Gói BI - Gia hạn',
    giaTri: 45000000,
    nguoiPhuTrach: 'Nguyễn Văn A',
    trangThai: 'renewed',
    ngayBatDau: '2025-10-01',
    ngayHetHan: '2026-09-30',
    ghiChu: 'Đã gia hạn thành công',
  },
];

function statusLabel(status: RenewalStatus) {
  if (status === 'active') return 'Đang hiệu lực';
  if (status === 'expiring') return 'Sắp hết hạn';
  if (status === 'expired') return 'Đã hết hạn';
  return 'Đã gia hạn';
}

function statusClassName(status: RenewalStatus) {
  if (status === 'active') return 'bg-teal-50 text-teal-700 border-teal-200';
  if (status === 'expiring') return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  if (status === 'expired') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-green-50 text-green-700 border-green-200';
}

function formatCurrencyVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export default function Renewals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filteredRenewals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sampleRenewals;
    return sampleRenewals.filter((item) => {
      return (
        String(item.id).includes(term) ||
        item.khachHang.toLowerCase().includes(term) ||
        item.goi.toLowerCase().includes(term) ||
        item.nguoiPhuTrach.toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

  const selectedRenewal = useMemo(() => {
    if (!selectedId) return null;
    return sampleRenewals.find((r) => r.id === selectedId) ?? null;
  }, [selectedId]);

  const stats = useMemo(() => {
    const total = sampleRenewals.length;
    const expiring = sampleRenewals.filter((r) => r.trangThai === 'expiring').length;
    const expired = sampleRenewals.filter((r) => r.trangThai === 'expired').length;
    return { total, expiring, expired };
  }, []);

  return (
    <main className="flex-1 p-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Quản lý gói gia hạn</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Tổng gói" value={stats.total} color="green" />
          <StatCard title="Sắp hết hạn" value={stats.expiring} color="purple" />
          <StatCard title="Đã hết hạn" value={stats.expired} color="orange" />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
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
              placeholder="Tìm kiếm (ID / khách hàng / gói / phụ trách)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-11 pr-4 border border-gray-400 rounded-lg bg-white outline-none focus:border-gray-600"
            />
          </div>

          <div className="text-sm text-gray-600">Hiển thị: {filteredRenewals.length}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-20 border-b border-gray-300">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Gói</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Hết hạn</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Phụ trách</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-32 border-b border-gray-300">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRenewals.length === 0 ? (
                  <tr className="h-12">
                    <td className="py-3 px-4 border-b border-gray-300" colSpan={6}>
                      <div className="text-gray-600">Không có dữ liệu phù hợp.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRenewals.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`cursor-pointer ${selectedId === item.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.id}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.khachHang}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.goi}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.ngayHetHan}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.nguoiPhuTrach}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300">
                        <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(item.trangThai)}`}>
                          {statusLabel(item.trangThai)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-gray-300 rounded-lg p-4">
            {!selectedRenewal ? (
              <div className="text-gray-600">Chọn một gói gia hạn để xem chi tiết.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-gray-900">Chi tiết #{selectedRenewal.id}</div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusClassName(selectedRenewal.trangThai)}`}>
                    {statusLabel(selectedRenewal.trangThai)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Khách hàng</div>
                    <div className="text-gray-900 font-medium">{selectedRenewal.khachHang}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Gói</div>
                    <div className="text-gray-900">{selectedRenewal.goi}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Giá trị</div>
                    <div className="text-gray-900 font-medium">{formatCurrencyVnd(selectedRenewal.giaTri)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Người phụ trách</div>
                    <div className="text-gray-900">{selectedRenewal.nguoiPhuTrach}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ngày bắt đầu</div>
                    <div className="text-gray-900">{selectedRenewal.ngayBatDau}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ngày hết hạn</div>
                    <div className="text-gray-900 font-medium">{selectedRenewal.ngayHetHan}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ghi chú</div>
                    <div className="text-gray-900">{selectedRenewal.ghiChu ?? '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
