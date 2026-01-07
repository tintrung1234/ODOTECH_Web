
import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import type { ProjectData } from './interface/type';
import type { Account } from '../projectsDasboard/interface/type';
import { formatCurrency } from '../../utils/formatDate';

interface Props {
    projects: ProjectData[];
    accounts?: Account[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function SalesChartsSection({ projects, accounts = [] }: Props) {

    // 1. Revenue Trend (Monthly) using 'ngay_tao' or 'ngay_ky' (using ngay_tao for now as proxy if no contract date)
    // Ideally we use contract date, let's assume 'ngay_tao' is close enough or use 'ngay_cham_cuoi' if available? 
    // Actually better to use 'ngay_tao' for created opps trend, or 'ngay_tat_toan' for closed?
    // Let's use 'ngay_tao' for "Sales Volume Over Time"
    const revenueTrendData = useMemo(() => {
        const data: Record<string, number> = {};
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

        // Init current year months
        const currentYear = new Date().getFullYear();
        months.forEach(m => data[`${m}`] = 0);

        projects.forEach(p => {
            if (!p.ngay_tao) return;
            try {
                const date = new Date(p.ngay_tao);
                if (date.getFullYear() === currentYear) {
                    const monthIndex = date.getMonth(); // 0-11
                    const key = months[monthIndex];
                    const val = Number(p.contract_value || 0) + Number(p.phat_sinh || 0);
                    data[key] = (data[key] || 0) + val;
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                // ignore invalid dates
            }
        });

        return months.map(m => ({ name: m, value: data[m] }));
    }, [projects]);

    // 2. Sales Person Performance
    const salesPerformanceData = useMemo(() => {
        const data = new Map<string, { name: string; value: number; count: number }>();

        projects.forEach(p => {
            const saleId = p.sale_id;
            const saleKey = String(saleId ?? 'Unknown');

            if (!data.has(saleKey)) {
                let name = 'Chưa gán';
                if (saleId) {
                    const acc = accounts.find(a => String(a.id) === String(saleId));
                    name = acc ? acc.name : `SALE #${saleId}`;
                }
                data.set(saleKey, { name, value: 0, count: 0 });
            }

            const item = data.get(saleKey)!;
            item.value += Number(p.contract_value || 0) + Number(p.phat_sinh || 0);
            item.count += 1;
        });

        return Array.from(data.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10
    }, [projects, accounts]);

    // 3. Project Status
    const statusData = useMemo(() => {
        const counts = {
            DangCham: 0,
            DaKy: 0,
            Huy: 0
        };

        projects.forEach(p => {
            if (p.trang_thai_chot === 'DaKy') counts.DaKy++;
            else if (p.trang_thai_chot === 'Huy') counts.Huy++;
            else counts.DangCham++; // Default to DangCham
        });

        return [
            { name: 'Đã Ký', value: counts.DaKy, color: '#10b981' }, // emerald-500
            { name: 'Đang Chăm', value: counts.DangCham, color: '#f59e0b' }, // amber-500
            { name: 'Đã Huỷ', value: counts.Huy, color: '#ef4444' }, // red-500
        ].filter(i => i.value > 0);
    }, [projects]);

    // 4. Lead Source
    const leadSourceData = useMemo(() => {
        const counts = new Map<string, number>();
        projects.forEach(p => {
            const source = p.nguon_khach || 'Khác';
            counts.set(source, (counts.get(source) || 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [projects]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

            {/* Revenue Trend - Span 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Doanh số theo tháng (Năm nay)</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                tickFormatter={(value) => `${value / 1000000}M`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Project Status */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Tỷ lệ chốt đơn</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sales Performance - Span 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Top Doanh Số Theo Sale</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={salesPerformanceData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={120}
                                tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Lead Source */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Nguồn Khách Hàng</h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leadSourceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                interval={0}
                            />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} hide />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                {leadSourceData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
