import { useEffect, useMemo, useState } from 'react';

import StatCard from '../components/accountsDasboard/StatCard';
import CustomerEditModal from '../components/salesDasboard/CustomerEditModal';
import ConfirmDeleteModal from '../components/accountsDasboard/ConfirmDeleteModal';
import ReminderCalendarModal from '../components/salesDasboard/ReminderCalendarModal';
import type { Customer, CustomerCategory } from '../types/Interface';

const STORAGE_KEY = 'odotech.crm.customers.v1';

function formatCurrencyVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

function categoryLabel(category: CustomerCategory) {
  if (category === 'new') return 'Khách mới';
  if (category === 'potential') return 'Khách tiềm năng';
  return 'Khách thân thiết';
}

function categoryClassName(category: CustomerCategory) {
  if (category === 'loyal') return 'bg-green-50 text-green-700 border-green-200';
  if (category === 'potential') return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-yellow-50 text-yellow-800 border-yellow-200';
}

function computeRevenue(customer: Customer) {
  return (customer.lichSuMuaHang ?? []).reduce((sum, p) => sum + (Number.isFinite(p.giaTri) ? p.giaTri : 0), 0);
}

function computeNextReminder(customer: Customer) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const dates = (customer.ghiChuChamSoc ?? [])
    .map((n) => n.ngayNhac)
    .filter((d): d is string => typeof d === 'string' && d >= todayIso)
    .sort();
  return dates[0] ?? null;
}

function createBlankCustomer(): Customer {
  const todayIso = new Date().toISOString().slice(0, 10);
  return {
    id: Date.now(),
    tenKhachHang: '',
    soDienThoai: '',
    email: '',
    khuVuc: '',
    nhanVienPhuTrach: '',
    phanLoai: 'new',
    lichSuMuaHang: [],
    ghiChuChamSoc: [],
    ngayTao: todayIso,
    ngayCapNhat: todayIso,
  };
}

const sampleCustomers: Customer[] = [
  {
    id: 31001,
    tenKhachHang: 'Công ty ABC',
    soDienThoai: '0901 234 567',
    email: 'contact@abc.vn',
    khuVuc: 'Hồ Chí Minh',
    nhanVienPhuTrach: 'Nguyễn Văn A',
    phanLoai: 'potential',
    lichSuMuaHang: [
      { id: 1, ngayMua: '2025-12-02', giaTri: 35000000, ghiChu: 'Gia hạn dịch vụ' },
      { id: 2, ngayMua: '2025-10-15', giaTri: 70000000, ghiChu: 'Mua gói CRM' },
    ],
    ghiChuChamSoc: [{ id: 11, ngayTao: '2025-12-10', noiDung: 'Hẹn demo tính năng báo cáo', ngayNhac: '2025-12-26' }],
    ngayTao: '2025-10-01',
    ngayCapNhat: '2025-12-10',
  },
  {
    id: 31002,
    tenKhachHang: 'Công ty XYZ',
    soDienThoai: '0987 111 222',
    email: 'sales@xyz.vn',
    khuVuc: 'Hà Nội',
    nhanVienPhuTrach: 'Trần Văn B',
    phanLoai: 'new',
    lichSuMuaHang: [],
    ghiChuChamSoc: [{ id: 21, ngayTao: '2025-12-18', noiDung: 'Gọi lần 1 - thu thập nhu cầu', ngayNhac: '2025-12-23' }],
    ngayTao: '2025-12-18',
    ngayCapNhat: '2025-12-18',
  },
  {
    id: 31003,
    tenKhachHang: 'Công ty MNO',
    soDienThoai: '0912 333 444',
    email: 'hello@mno.vn',
    khuVuc: 'Đà Nẵng',
    nhanVienPhuTrach: 'Lê Thị C',
    phanLoai: 'loyal',
    lichSuMuaHang: [
      { id: 31, ngayMua: '2025-12-01', giaTri: 120000000, ghiChu: 'Triển khai ERP' },
      { id: 32, ngayMua: '2025-06-20', giaTri: 80000000, ghiChu: 'Mua gói HRM' },
    ],
    ghiChuChamSoc: [{ id: 41, ngayTao: '2025-12-03', noiDung: 'Chăm sóc sau triển khai', ngayNhac: '2025-12-27' }],
    ngayTao: '2025-05-12',
    ngayCapNhat: '2025-12-03',
  },
];

export default function Sales() {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return sampleCustomers;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return sampleCustomers;
      return parsed as Customer[];
    } catch {
      return sampleCustomers;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [minRevenue, setMinRevenue] = useState<string>('');
  const [maxRevenue, setMaxRevenue] = useState<string>('');

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Customer | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    } catch {
      // ignore storage errors
    }
  }, [customers]);

  const regionOptions = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.khuVuc).filter(Boolean))).sort();
  }, [customers]);

  const ownerOptions = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.nhanVienPhuTrach).filter(Boolean))).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const min = minRevenue.trim() ? Number(minRevenue) : null;
    const max = maxRevenue.trim() ? Number(maxRevenue) : null;

    return customers.filter((c) => {
      const revenue = computeRevenue(c);
      const matchesTerm =
        !term ||
        c.tenKhachHang.toLowerCase().includes(term) ||
        (c.soDienThoai ?? '').toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        String(c.id).includes(term);

      const matchesRegion = !filterRegion || c.khuVuc === filterRegion;
      const matchesOwner = !filterOwner || c.nhanVienPhuTrach === filterOwner;
      const matchesMin = min === null || (Number.isFinite(min) && revenue >= min);
      const matchesMax = max === null || (Number.isFinite(max) && revenue <= max);

      return matchesTerm && matchesRegion && matchesOwner && matchesMin && matchesMax;
    });
  }, [customers, filterOwner, filterRegion, maxRevenue, minRevenue, searchTerm]);

  const selectedCustomer = useMemo(() => {
    if (!selectedId) return null;
    return customers.find((c) => c.id === selectedId) ?? null;
  }, [customers, selectedId]);

  const stats = useMemo(() => {
    const total = customers.length;
    const newCount = customers.filter((c) => c.phanLoai === 'new').length;
    const potentialCount = customers.filter((c) => c.phanLoai === 'potential').length;
    const loyalCount = customers.filter((c) => c.phanLoai === 'loyal').length;
    return { total, newCount, potentialCount, loyalCount };
  }, [customers]);

  const reminderItems = useMemo(() => {
    const items: Array<{
      customerId: number;
      customerName: string;
      noteId: number;
      ngayTao: string;
      noiDung: string;
      ngayNhac: string;
    }> = [];

    for (const customer of customers) {
      for (const note of customer.ghiChuChamSoc ?? []) {
        if (typeof note.ngayNhac !== 'string' || !note.ngayNhac.trim()) continue;
        items.push({
          customerId: customer.id,
          customerName: customer.tenKhachHang,
          noteId: note.id,
          ngayTao: note.ngayTao,
          noiDung: note.noiDung,
          ngayNhac: note.ngayNhac,
        });
      }
    }

    items.sort((a, b) => a.ngayNhac.localeCompare(b.ngayNhac));
    return items;
  }, [customers]);

  return (
    <main className="flex-1 p-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Quản lý khách hàng</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Tổng khách hàng" value={stats.total} color="green" />
          <StatCard title="Khách mới" value={stats.newCount} color="purple" />
          <StatCard title="Khách thân thiết" value={stats.loyalCount} color="orange" />
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
              placeholder="Tìm kiếm (ID / tên / SĐT / email)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-11 pr-4 border border-gray-400 rounded-lg bg-white outline-none focus:border-gray-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="h-10 px-5 rounded-lg bg-teal-600 text-white cursor-pointer font-medium"
              onClick={() => {
                setDraft(createBlankCustomer());
                setIsEditing(true);
              }}
            >
              Thêm khách hàng
            </button>

            <button
              type="button"
              className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={!selectedCustomer}
              onClick={() => {
                if (!selectedCustomer) return;
                setDraft({ ...selectedCustomer });
                setIsEditing(true);
              }}
            >
              Sửa
            </button>

            <button
              type="button"
              className="h-10 px-5 border border-red-300 rounded-lg bg-white text-red-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={!selectedCustomer}
              onClick={() => {
                if (!selectedCustomer) return;
                setIsDeleteConfirmOpen(true);
              }}
            >
              Xóa
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
            >
              <option value="">Tất cả</option>
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên phụ trách</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
            >
              <option value="">Tất cả</option>
              {ownerOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doanh số từ (VND)</label>
            <input
              type="number"
              min={0}
              value={minRevenue}
              onChange={(e) => setMinRevenue(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doanh số đến (VND)</label>
            <input
              type="number"
              min={0}
              value={maxRevenue}
              onChange={(e) => setMaxRevenue(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">Hiển thị: {filteredCustomers.length}</div>

        <ReminderCalendarModal
          open
          items={reminderItems}
          onOpenCustomer={(customerId) => {
            const found = customers.find((c) => c.id === customerId) ?? null;
            if (found) {
              setSelectedId(found.id);
              setDraft({ ...found });
              setIsEditing(true);
            }
          }}
        />

        <CustomerEditModal
          key={isEditing ? String(draft?.id ?? 'new') : 'closed'}
          open={isEditing}
          draft={draft}
          onChangeDraft={setDraft}
          onClose={() => {
            setIsEditing(false);
            setDraft(null);
          }}
          onSave={() => {
            if (!draft) return;
            const todayIso = new Date().toISOString().slice(0, 10);
            const toSave: Customer = { ...draft, ngayCapNhat: todayIso };
            setCustomers((prev) => {
              const existingIndex = prev.findIndex((c) => c.id === toSave.id);
              if (existingIndex === -1) return [toSave, ...prev];
              return prev.map((c) => (c.id === toSave.id ? toSave : c));
            });
            setSelectedId(toSave.id);
            setIsEditing(false);
            setDraft(null);
          }}
        />

        <ConfirmDeleteModal
          open={isDeleteConfirmOpen}
          title="Xác nhận xóa khách hàng"
          description={selectedCustomer ? `Bạn có chắc chắn muốn xóa khách hàng "${selectedCustomer.tenKhachHang}" không?` : 'Bạn có chắc chắn muốn xóa khách hàng này không?'}
          confirmText="Xóa"
          cancelText="Hủy"
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => {
            if (!selectedCustomer) {
              setIsDeleteConfirmOpen(false);
              return;
            }
            const deletingId = selectedCustomer.id;
            setCustomers((prev) => prev.filter((c) => c.id !== deletingId));
            setSelectedId(null);
            setIsDeleteConfirmOpen(false);
          }}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full border-collapse"> 
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-20 border-b border-gray-300">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Khu vực</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Nhân viên</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Doanh số</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-37 border-b border-gray-300">Phân loại</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr className="h-12">
                    <td className="py-3 px-4 border-b border-gray-300" colSpan={6}>
                      <div className="text-gray-600">Không có dữ liệu phù hợp.</div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`cursor-pointer ${selectedId === item.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.id}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.tenKhachHang}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.khuVuc}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{item.nhanVienPhuTrach}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{formatCurrencyVnd(computeRevenue(item))}</td>
                      <td className="py-3 px-4 text-gray-800 border-b border-gray-300">
                        <span className={`text-xs px-2 py-1 rounded-full border ${categoryClassName(item.phanLoai)}`}>{categoryLabel(item.phanLoai)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-gray-300 rounded-lg p-4">
            {!selectedCustomer ? (
              <div className="text-gray-600">Chọn một khách hàng để xem chi tiết.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-gray-900">Chi tiết #{selectedCustomer.id}</div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${categoryClassName(selectedCustomer.phanLoai)}`}>{categoryLabel(selectedCustomer.phanLoai)}</span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Khách hàng</div>
                    <div className="text-gray-900 font-medium">{selectedCustomer.tenKhachHang}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Khu vực</div>
                    <div className="text-gray-900">{selectedCustomer.khuVuc}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Nhân viên phụ trách</div>
                    <div className="text-gray-900">{selectedCustomer.nhanVienPhuTrach}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Doanh số (từ lịch sử mua hàng)</div>
                    <div className="text-gray-900 font-medium">{formatCurrencyVnd(computeRevenue(selectedCustomer))}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Số điện thoại</div>
                    <div className="text-gray-900">{selectedCustomer.soDienThoai ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-gray-900">{selectedCustomer.email ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Nhắc lịch chăm sóc gần nhất</div>
                    <div className="text-gray-900">{computeNextReminder(selectedCustomer) ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Lịch sử mua hàng</div>
                    <div className="text-gray-900">{selectedCustomer.lichSuMuaHang.length} giao dịch</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ghi chú chăm sóc</div>
                    <div className="text-gray-900">{selectedCustomer.ghiChuChamSoc.length} ghi chú</div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium cursor-pointer"
                    onClick={() => {
                      setDraft({ ...selectedCustomer });
                      setIsEditing(true);
                    }}
                  >
                    Xem / cập nhật lịch sử & ghi chú
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
