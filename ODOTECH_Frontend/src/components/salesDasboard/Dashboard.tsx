import { useState, useMemo } from 'react';
import type { ProjectData } from './interface/type';
import type { Account } from '../../interface/type';
import { formatCurrency, calculateDaysDiff } from '../../utils/formatDate';
import SalesChartsSection from './SalesChartsSection';
import RenewalPackagesModal from './RenewalPackagesModal';
import './style.css';
import {
  Building2,
  CircleDollarSign,
  Clock,
  Filter,
  LayoutList,
  PieChart,
  Plus,
  Search,
  Users,
  Wallet,
  AlertCircle,
  MoreVertical,
  Calendar
} from 'lucide-react';

function getProjectTotalValue(p: ProjectData): number {
  // Prefer contract_value (from Projects API) but fall back to phi_dich_vu for older/partial data.
  const base = p.contract_value ?? p.phi_dich_vu ?? 0;
  return Number(base || 0) + Number(p.phat_sinh || 0);
}

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

  // Stats calculation
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const closedProjects = projects.filter(p => p.trang_thai_chot === 'DaKy').length;
    const workingProjects = projects.filter(p => p.trang_thai_chot === 'DangCham').length;
    const unpaidProjects = projects.filter((p) => p.trang_thai_thu_tien !== 'Du').length;
    const overdueFollowups = projects.filter((p) => {
      const diff = calculateDaysDiff(p.ngay_cham_cuoi);
      return Number.isFinite(diff) && diff > 7;
    }).length;
    return {
      total: totalProjects,
      closed: closedProjects,
      working: workingProjects,
      unpaid: unpaidProjects,
      overdue: overdueFollowups,
    };
  }, [projects]);

  const handleFilter = () => {
    onFilter({
      q,
      trang_thai_chot: trangThaiChot,
      min_total: toNullableNumber(minTotal),
      max_total: toNullableNumber(maxTotal),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 font-sans text-gray-900">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý Sale</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <LayoutList size={16} />
            Tổng quan hoạt động kinh Doanh
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRenewalModalOpen(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
          >
            <Calendar size={16} />
            <span className="hidden sm:inline">Gói gia hạn</span>
            <span className="sm:hidden">Gia hạn</span>
          </button>

          {canCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Tạo Sale Mới</span>
              <span className="sm:hidden">Tạo mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Doanh số tổng (Dự kiến)</h3>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CircleDollarSign size={20} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Tổng Dự Án</h3>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 size={20} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Đã Ký Hợp Đồng</h3>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PieChart size={20} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.closed}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Đang Chăm Sóc</h3>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Users size={20} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.working}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Chưa Thu Đủ</h3>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wallet size={20} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.unpaid}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Quá Hạn Chăm (&gt;7 ngày)</h3>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Clock size={20} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.overdue}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Sidebar / Filters (Optional - integrated into main area for now or use top tabs) */}

        <div className="flex-1 space-y-6">
          {/* View Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 inline-flex shadow-sm overflow-x-auto max-w-full">
            <button
              onClick={() => onChangeListTab?.('full')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${listTab === 'full'
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => onChangeListTab?.('doi_tien')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${listTab === 'doi_tien'
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="hidden sm:inline">Chưa thanh toán hết</span>
              <span className="sm:hidden">Chưa TT</span>
            </button>
            <button
              onClick={() => onChangeListTab?.('dang_trien_khai')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${listTab === 'dang_trien_khai'
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="hidden sm:inline">Đang triển khai</span>
              <span className="sm:hidden">Triển khai</span>
            </button>
          </div>

          {/* Sale Person Tabs Filter (if applicable) */}
          {saleTabs && saleTabs.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => onSelectSaleTab?.('')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors cursor-pointer ${!selectedSaleTab
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                All Sales
              </button>
              {saleTabs.map((s) => {
                const raw = String(s ?? '').trim();
                const id = Number.parseInt(raw, 10);
                const acc = Number.isFinite(id)
                  ? accounts?.find((a) => Number(a.id) === id)
                  : undefined;
                const nameLabel = acc ? (String(acc.name || '').trim() || (Number.isFinite(id) ? `#${id}` : raw)) : raw;
                const isSelected = selectedSaleTab === raw;

                return (
                  <button
                    key={raw}
                    onClick={() => onSelectSaleTab?.(raw)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors cursor-pointer ${isSelected
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {nameLabel}
                    {acc?.role_system && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold 
                        ${isSelected
                          ? 'bg-white/20 text-white'
                          : acc.role_system === 'sales_manager' ? 'bg-purple-100 text-purple-700'
                            : acc.role_system === 'head_sales' ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                        {acc.role_system.replace('sales_manager', 'Manager').replace('sale', 'Sale').replace('head_sales', 'Head')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Tìm tên khách, mã DA, SĐT..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer flex-1 sm:flex-none min-w-[140px]"
                value={trangThaiChot}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setTrangThaiChot(e.target.value as any)}
              >
                <option value="">Tất cả TT</option>
                <option value="DangCham">Đang chăm</option>
                <option value="DaKy">Đã ký</option>
                <option value="Huy">Huỷ</option>
              </select>

              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 px-2 h-10 flex-1 sm:flex-none">
                <span className="text-gray-500 text-sm px-1">₫</span>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-16 sm:w-20 bg-transparent border-none text-sm focus:ring-0 p-1"
                  value={minTotal}
                  onChange={(e) => setMinTotal(e.target.value)}
                />
                <span className="text-gray-300">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-16 sm:w-20 bg-transparent border-none text-sm focus:ring-0 p-1 text-right"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                />
              </div>

              <button
                onClick={handleFilter}
                className="h-10 w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm shrink-0"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          <SalesChartsSection projects={projects} accounts={accounts} />

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/75 border-b border-gray-100">
                  <tr>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Dự án / Khách hàng</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Trạng thái</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right hidden sm:table-cell">Tổng giá trị</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">Lần chăm cuối</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map((p) => {
                    const daysDiff = calculateDaysDiff(p.ngay_cham_cuoi);
                    const isLate = daysDiff > 7;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onSelect(p)}>
                              {p.ma_du_an}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 text-xs sm:text-sm text-gray-500 mt-1">
                              <span className="truncate max-w-[150px] sm:max-w-[200px]">{p.ten_khach}</span>
                              {p.sdt && <span className="hidden sm:inline text-gray-300">•</span>}
                              {p.sdt && <span className="font-mono text-xs">{p.sdt}</span>}
                            </div>
                            {/* Mobile-only: Show price and last contact */}
                            <div className="sm:hidden mt-2 space-y-1">
                              <div className="text-xs font-medium text-gray-900">
                                {formatCurrency(getProjectTotalValue(p))}
                              </div>
                              {p.ngay_cham_cuoi && (
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs ${isLate ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                    Chăm: {p.ngay_cham_cuoi}
                                  </span>
                                  {isLate && <AlertCircle size={12} className="text-red-500" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${p.trang_thai_chot === 'DaKy'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : p.trang_thai_chot === 'Huy'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                            {p.trang_thai_chot === 'DaKy' ? 'Đã ký' : p.trang_thai_chot === 'Huy' ? 'Huỷ' : 'Chăm'}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-medium text-gray-900 tabular-nums hidden sm:table-cell">
                          {formatCurrency(getProjectTotalValue(p))}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            {p.ngay_cham_cuoi ? (
                              <>
                                <span className={`text-sm ${isLate ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                  {p.ngay_cham_cuoi}
                                </span>
                                {isLate && (
                                  <div className="relative group/tooltip">
                                    <AlertCircle size={16} className="text-red-500" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                                      Đã {daysDiff} ngày chưa chăm
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Chưa có</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                          <button
                            onClick={() => onSelect(p)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                            title="Xem chi tiết"
                          >
                            <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 italic">
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <RenewalPackagesModal
        open={isRenewalModalOpen}
        projects={projects}
        accounts={accounts}
        onClose={() => setIsRenewalModalOpen(false)}
      />
    </div>
  );
}
