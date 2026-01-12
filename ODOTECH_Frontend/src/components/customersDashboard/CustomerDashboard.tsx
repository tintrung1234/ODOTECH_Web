import { useState, useMemo } from 'react';
import type { Customer } from './interface/types';
import type { Account } from '../../interface/type';
import { formatCurrency } from '../../utils/formatDate';
import {
    Users,
    CircleDollarSign,
    Filter,
    Search,
    TrendingUp,
    Building2,
    MoreVertical,
} from 'lucide-react';
import StatCard from '../accountsDasboard/StatCard';

interface Props {
    customers: Customer[];
    onSelect: (c: Customer) => void;
    onFilter: (filters: {
        q: string;
        nguon_khach: string;
        sale_id: string;
    }) => void;
    saleTabs?: string[];
    selectedSaleTab?: string;
    onSelectSaleTab?: (saleId: string) => void;
    accounts?: Account[];
}

export default function CustomerDashboard({
    customers,
    onSelect,
    onFilter,
    selectedSaleTab,
}: Props) {
    const [q, setQ] = useState('');
    const [nguonKhach, setNguonKhach] = useState('');

    // Stats calculation
    const stats = useMemo(() => {
        const totalCustomers = customers.length;
        const totalRevenue = customers.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
        const totalProjects = customers.reduce((sum, c) => sum + (c.total_projects || 0), 0);

        // Customers created this month
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const newCustomers = customers.filter(c => c.ngay_tao && c.ngay_tao.startsWith(thisMonth)).length;

        return {
            total: totalCustomers,
            newThisMonth: newCustomers,
            totalRevenue,
            totalProjects,
        };
    }, [customers]);

    // Get unique nguon_khach values
    const nguonKhachOptions = useMemo(() => {
        const sources = new Set(customers.map(c => c.nguon_khach).filter(Boolean));
        return Array.from(sources).sort();
    }, [customers]);

    const handleFilter = () => {
        onFilter({
            q,
            nguon_khach: nguonKhach,
            sale_id: selectedSaleTab || '',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 font-sans text-gray-900">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý khách hàng</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Users size={16} />
                        Tổng quan thông tin khách hàng và dự án
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng khách hàng"
                    value={stats.total}
                    color="blue"
                    icon={<Users size={20} />}
                />
                <StatCard
                    title="Khách hàng mới (tháng này)"
                    value={stats.newThisMonth}
                    color="green"
                    icon={<TrendingUp size={20} />}
                />
                <StatCard
                    title="Tổng dự án"
                    value={stats.totalProjects}
                    color="purple"
                    icon={<Building2 size={20} />}
                />
                <StatCard
                    title="Tổng doanh thu"
                    value={formatCurrency(stats.totalRevenue).replace(' đ', '')}
                    suffix="VND"
                    color="orange"
                    icon={<CircleDollarSign size={20} />}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="Tìm tên khách, mã KH, SĐT, website..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                                value={nguonKhach}
                                onChange={(e) => setNguonKhach(e.target.value)}
                            >
                                <option value="">Tất cả nguồn</option>
                                {nguonKhachOptions.map((source) => (
                                    <option key={source} value={source}>{source}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleFilter}
                                className="h-10 w-10 flex items-center justify-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/75 border-b border-gray-100">
                                    <tr>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Mã KH / Tên khách hàng</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Liên hệ</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Nguồn</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Số dự án</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Tổng doanh thu</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {customers.map((c) => {
                                        return (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onSelect(c)}>
                                                            {c.ma_kh}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                                                            <span className="truncate max-w-[200px]">{c.ten_khach}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col text-sm">
                                                        {c.sdt && <span className="font-mono text-gray-700">{c.sdt}</span>}
                                                        {c.website && (
                                                            <a
                                                                href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-600 hover:underline truncate max-w-[150px]"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {c.website}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        {c.nguon_khach || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">
                                                        {c.total_projects || 0}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-900 tabular-nums">
                                                    {formatCurrency(c.total_revenue || 0)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => onSelect(c)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Xem chi tiết"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {customers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-400 italic">
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
        </div>
    );
}
