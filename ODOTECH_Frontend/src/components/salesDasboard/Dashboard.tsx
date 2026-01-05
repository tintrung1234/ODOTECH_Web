import { useState } from 'react';
import type { ProjectData } from './interface/type';
import type { Account } from '../projectsDasboard/interface/type';
import { formatCurrency, calculateDaysDiff } from '../../utils/formatDate';
import { normalizeRole } from '../../utils/auth';
import SalesChart from './SalesChart';
import RenewalPackagesModal from './RenewalPackagesModal';
import './style.css'

interface Props {
  projects: ProjectData[];
  onSelect: (p: ProjectData) => void;
  onFilter: (filters: {
    q: string;
    trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy';
    min_total?: number | null;
    max_total?: number | null;
  }) => void;
  onCreate: () => void;

  canCreate?: boolean;
  listTab?: 'full' | 'doi_tien' | 'dang_trien_khai';
  onChangeListTab?: (tab: 'full' | 'doi_tien' | 'dang_trien_khai') => void;
  saleTabs?: string[];
  selectedSaleTab?: string;
  onSelectSaleTab?: (saleId: string) => void;
  accounts?: Account[];
  totalAmount?: number;
}

export default function Dashboard({
  projects,
  onSelect,
  onFilter,
  onCreate,
  canCreate = true,
  listTab = 'full',
  onChangeListTab,
  saleTabs,
  selectedSaleTab,
  onSelectSaleTab,
  accounts,
  totalAmount = 0,
}: Props) {
  const [q, setQ] = useState('');
  const [trangThaiChot, setTrangThaiChot] = useState<'' | 'DangCham' | 'DaKy' | 'Huy'>('');
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [minTotal, setMinTotal] = useState<string>('');
  const [maxTotal, setMaxTotal] = useState<string>('');

  const toNullableNumber = (value: string): number | null => {
    const raw = value.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return n;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sale</h1>
        {canCreate ? (
          <button
            onClick={onCreate}
            className="button-color text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Tạo Sale
          </button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => onChangeListTab?.('full')}
            className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${listTab === 'full' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Full
          </button>
          <button
            type="button"
            onClick={() => onChangeListTab?.('doi_tien')}
            className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${listTab === 'doi_tien' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Chưa thanh toán hết
          </button>
          <button
            type="button"
            onClick={() => onChangeListTab?.('dang_trien_khai')}
            className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${listTab === 'dang_trien_khai' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Đang triển khai
          </button>
        </div>

        <div className="ml-auto text-sm text-gray-700">
          Tổng tiền: <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {saleTabs && saleTabs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => onSelectSaleTab?.('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${!selectedSaleTab ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Tất cả
            </button>
            {saleTabs.map((s) => (
              (() => {
                const raw = String(s ?? '').trim();
                const id = Number.parseInt(raw, 10);
                const acc = Number.isFinite(id)
                  ? accounts?.find((a) => Number(a.id) === id)
                  : undefined;
                const nameLabel = acc ? (String(acc.name || '').trim() || (Number.isFinite(id) ? `#${id}` : raw)) : raw;
                const canonicalRole = acc ? normalizeRole(acc.role_system) : 'unknown';
                const roleLabel = !acc
                  ? ''
                  : canonicalRole === 'sale'
                    ? 'sale'
                    : canonicalRole === 'sales_manager'
                      ? 'quản lý sale'
                      : (String(acc.role_system || '').trim() || '');
                const isSelected = selectedSaleTab === raw;
                const roleBadgeClass = isSelected
                  ? 'bg-white/20 text-white'
                  : canonicalRole === 'sale'
                    ? 'bg-blue-100 text-blue-800'
                    : canonicalRole === 'sales_manager'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-700';

                return (
                  <button
                    key={raw}
                    type="button"
                    onClick={() => onSelectSaleTab?.(raw)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${isSelected ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {acc && roleLabel ? (
                      <span className="inline-flex items-center gap-2">
                        <span>{nameLabel}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeClass}`}>{roleLabel}</span>
                      </span>
                    ) : (
                      nameLabel
                    )}
                  </button>
                );
              })()
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsRenewalModalOpen(true)}
            className="ml-auto h-10 px-4 rounded-lg text-sm font-medium border cursor-pointer bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Xem gói gia hạn
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="h-10 border border-gray-300 px-3 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tìm tên khách, mã DA..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-10 border border-gray-300 cursor-pointer px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={trangThaiChot}
          onChange={(e) => setTrangThaiChot(e.target.value as '' | 'DangCham' | 'DaKy' | 'Huy')}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DangCham">Đang chăm</option>
          <option value="DaKy">Đã ký</option>
          <option value="Huy">Huỷ</option>
        </select>

        <input
          type="number"
          min={0}
          className="h-10 border border-gray-300 px-3 rounded w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Giá từ"
          value={minTotal}
          onChange={(e) => setMinTotal(e.target.value)}
        />
        <input
          type="number"
          min={0}
          className="h-10 border border-gray-300 px-3 rounded w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Giá đến"
          value={maxTotal}
          onChange={(e) => setMaxTotal(e.target.value)}
        />
        <button
          onClick={() =>
            onFilter({
              q,
              trang_thai_chot: trangThaiChot,
              min_total: toNullableNumber(minTotal),
              max_total: toNullableNumber(maxTotal),
            })
          }
          className="h-10 text-white px-5 button-color rounded hover:bg-blue-700 transition-colors"
        >
          Lọc
        </button>
      </div>

      <SalesChart projects={projects} />

      <RenewalPackagesModal
        open={isRenewalModalOpen}
        projects={projects}
        onClose={() => setIsRenewalModalOpen(false)}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-600">Mã DA</th>
              <th className="p-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th className="p-3 text-left font-semibold text-gray-600">TT Chốt</th>
              <th className="p-3 text-left font-semibold text-gray-600">Tổng phí</th>
              <th className="p-3 text-left font-semibold text-gray-600">Chăm cuối</th>
              <th className="p-3 text-left font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">{p.ma_du_an}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-800">{p.ten_khach}</div>
                  <small className="text-gray-500">{p.sdt}</small>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${p.trang_thai_chot === 'DaKy' ? 'bg-green-100 text-green-800' :
                      p.trang_thai_chot === 'Huy' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {p.trang_thai_chot}
                  </span>
                </td>
                <td className="p-3 font-medium">{formatCurrency(Number(p.contract_value ?? 0) + Number(p.phat_sinh ?? 0))}</td>
                <td className="p-3">
                  {p.ngay_cham_cuoi}
                  {calculateDaysDiff(p.ngay_cham_cuoi) > 7 && <span className="text-red-500 font-bold ml-2" title="Quá hạn chăm sóc"> ( ! )</span>}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onSelect(p)}
                    className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}