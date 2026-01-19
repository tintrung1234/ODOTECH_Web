
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
import type { Account } from '../../interface/type';
import { calculateDaysDiff, formatCurrency } from '../../utils/formatDate';

interface Props {
    projects: ProjectData[];
    accounts?: Account[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

function getProjectTotalValue(p: ProjectData): number {
    const base = p.contract_value ?? p.phi_dich_vu ?? 0;
    return Number(base || 0) + Number(p.phat_sinh || 0);
}

function getProjectContractValue(p: ProjectData): number {
    // "Tổng giá trị hợp đồng" must come from Projects API contract_value.
    // If a project has no contract_value, it contributes 0 to this chart.
    return Number(p.contract_value || 0);
}

type ProjectHint = { maDuAn: string; tenKhach: string; value: number };
function toProjectHint(p: ProjectData): ProjectHint {
    return {
        maDuAn: String(p.ma_du_an || '').trim() || `#${p.id}`,
        tenKhach: String(p.ten_khach || '').trim() || '',
        value: getProjectTotalValue(p),
    };
}

function buildTooltipLines(list: ProjectHint[], limit = 8): { items: ProjectHint[]; more: number; total: number } {
    const sorted = [...list].sort((a, b) => b.value - a.value);
    const items = sorted.slice(0, limit);
    return {
        items,
        more: Math.max(0, sorted.length - items.length),
        total: sorted.reduce((sum, x) => sum + Number(x.value || 0), 0),
    };
}

function asRecord(v: unknown): Record<string, unknown> | null {
    if (!v || typeof v !== 'object') return null;
    return v as Record<string, unknown>;
}

function getFirstPayloadEntry(payload: unknown): Record<string, unknown> | null {
    if (!Array.isArray(payload) || payload.length === 0) return null;
    return asRecord(payload[0]);
}

function readStringField(obj: Record<string, unknown> | null, field: string): string {
    if (!obj) return '';
    const v = obj[field];
    return v === undefined || v === null ? '' : String(v);
}

function ProjectsTooltip({ active, label, payload, getKey, getProjectsForKey, valueFormatter }: {
    active?: boolean;
    payload?: readonly unknown[];
    label?: unknown;
    getKey: (label: unknown, payload: unknown) => string;
    getProjectsForKey: (key: string) => ProjectHint[];
    valueFormatter?: (v: number) => string;
}) {
    if (!active) return null;
    const key = getKey(label, payload);
    if (!key) return null;

    const projects = getProjectsForKey(key) || [];
    const { items, more, total } = buildTooltipLines(projects, 14);

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs text-gray-800 min-w-[260px] max-w-[360px]">
            <div className="font-semibold text-gray-900 mb-1">{key}</div>
            <div className="text-[11px] text-gray-600 mb-2">{projects.length} dự án</div>
            {valueFormatter && projects.length > 0 && (
                <div className="text-[11px] text-gray-600 mb-2">Tổng: <span className="font-semibold text-gray-800">{valueFormatter(total)}</span></div>
            )}

            {items.length === 0 ? (
                <div className="text-gray-500">Không có dự án.</div>
            ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-auto pr-1">
                    {items.map((p, idx) => (
                        <span
                            key={`${p.maDuAn}-${idx}`}
                            className="px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-800 font-medium"
                            title={p.maDuAn}
                        >
                            {p.maDuAn}
                        </span>
                    ))}
                    {more > 0 && (
                        <span className="px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-500 italic">
                            +{more}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SalesChartsSection({ projects, accounts = [] }: Props) {

    // 1. Revenue Trend (Monthly) using 'ngay_tao' or 'ngay_ky' (using ngay_tao for now as proxy if no contract date)
    // Ideally we use contract date, let's assume 'ngay_tao' is close enough or use 'ngay_cham_cuoi' if available? 
    // Actually better to use 'ngay_tao' for created opps trend, or 'ngay_tat_toan' for closed?
    // Let's use 'ngay_tao' for "Sales Volume Over Time"
    const revenueTrendBundle = useMemo(() => {
        const sums: Record<string, number> = {};
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const projectsByMonth = new Map<string, ProjectHint[]>();

        // Init current year months
        const currentYear = new Date().getFullYear();
        months.forEach(m => { sums[m] = 0; projectsByMonth.set(m, []); });

        projects.forEach(p => {
            if (!p.ngay_tao) return;
            try {
                const date = new Date(p.ngay_tao);
                if (date.getFullYear() !== currentYear) return;
                const monthIndex = date.getMonth(); // 0-11
                const key = months[monthIndex];
                const hint = toProjectHint(p);
                sums[key] = (sums[key] || 0) + hint.value;
                const list = projectsByMonth.get(key) || [];
                list.push(hint);
                projectsByMonth.set(key, list);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                // ignore invalid dates
            }
        });

        return { months, data: months.map(m => ({ name: m, value: sums[m] })), projectsByMonth };
    }, [projects]);

    // 2. Sales Person Performance
    const salesPerformanceBundle = useMemo(() => {
        const data = new Map<string, { name: string; value: number; count: number; projects: ProjectHint[] }>();
        const projectsByLabel = new Map<string, ProjectHint[]>();

        projects.forEach(p => {
            const saleId = p.sale_id;
            const saleKey = String(saleId ?? 'Unknown');

            if (!data.has(saleKey)) {
                let name = 'Chưa gán';
                if (saleId) {
                    const acc = accounts.find(a => String(a.id) === String(saleId));
                    name = acc ? acc.name : `SALE #${saleId}`;
                }
                data.set(saleKey, { name, value: 0, count: 0, projects: [] });
            }

            const item = data.get(saleKey)!;
            const hint: ProjectHint = {
                maDuAn: String(p.ma_du_an || '').trim() || `#${p.id}`,
                tenKhach: String(p.ten_khach || '').trim() || '',
                value: getProjectContractValue(p),
            };
            item.value += hint.value;
            item.count += 1;
            item.projects.push(hint);
        });

        const top = Array.from(data.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        for (const row of top) {
            projectsByLabel.set(row.name, row.projects);
        }

        return { data: top, projectsByLabel };
    }, [projects, accounts]);

    // 3. Project Status
    const statusBundle = useMemo(() => {
        const byLabel = new Map<string, ProjectHint[]>();
        const add = (label: string, p: ProjectData) => {
            const list = byLabel.get(label) || [];
            list.push(toProjectHint(p));
            byLabel.set(label, list);
        };

        projects.forEach(p => {
            if (p.trang_thai_chot === 'DaKy') add('Đã Ký', p);
            else if (p.trang_thai_chot === 'Huy') add('Đã Huỷ', p);
            else add('Đang Chăm', p);
        });

        const data = [
            { name: 'Đã Ký', value: (byLabel.get('Đã Ký') || []).length, color: '#10b981' },
            { name: 'Đang Chăm', value: (byLabel.get('Đang Chăm') || []).length, color: '#f59e0b' },
            { name: 'Đã Huỷ', value: (byLabel.get('Đã Huỷ') || []).length, color: '#ef4444' },
        ].filter(i => i.value > 0);

        return { data, byLabel };
    }, [projects]);

    // 4. Lead Source
    const leadSourceBundle = useMemo(() => {
        const bySource = new Map<string, ProjectHint[]>();
        projects.forEach(p => {
            const source = String(p.nguon_khach || 'Khác').trim() || 'Khác';
            const list = bySource.get(source) || [];
            list.push(toProjectHint(p));
            bySource.set(source, list);
        });

        const data = Array.from(bySource.entries())
            .map(([name, list]) => ({ name, value: list.length }))
            .sort((a, b) => b.value - a.value);

        return { data, bySource };
    }, [projects]);

    // 5. Payment Status Distribution
    const paymentStatusBundle = useMemo(() => {
        const byLabel = new Map<string, ProjectHint[]>();
        const add = (label: string, p: ProjectData) => {
            const list = byLabel.get(label) || [];
            list.push(toProjectHint(p));
            byLabel.set(label, list);
        };

        projects.forEach((p) => {
            if (p.trang_thai_thu_tien === 'Du') add('Thu đủ', p);
            else if (p.trang_thai_thu_tien === 'MotPhan') add('Thu 1 phần', p);
            else add('Chưa thu', p);
        });

        const data = [
            { name: 'Chưa thu', value: (byLabel.get('Chưa thu') || []).length, color: '#ef4444' },
            { name: 'Thu 1 phần', value: (byLabel.get('Thu 1 phần') || []).length, color: '#f59e0b' },
            { name: 'Thu đủ', value: (byLabel.get('Thu đủ') || []).length, color: '#10b981' },
        ].filter((i) => i.value > 0);

        return { data, byLabel };
    }, [projects]);

    // 6. Follow-up Status (On-time / Overdue)
    const followupAgingBundle = useMemo(() => {
        const buckets = [
            { name: 'Đúng hạn', value: 0, color: '#10b981' },
            { name: 'Quá hạn', value: 0, color: '#ef4444' },
        ];
        const byBucket = new Map<string, ProjectHint[]>();
        for (const b of buckets) byBucket.set(b.name, []);

        projects.forEach((p) => {
            const diff = calculateDaysDiff(p.ngay_cham_cuoi);
            if (!Number.isFinite(diff) || diff < 0) return;
            const idx = diff <= 7 ? 0 : 1;
            buckets[idx].value += 1;
            const list = byBucket.get(buckets[idx].name) || [];
            list.push(toProjectHint(p));
            byBucket.set(buckets[idx].name, list);
        });

        return { data: buckets, byBucket };
    }, [projects]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            {/* Revenue Trend - Span 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Doanh số theo tháng (Năm nay)</h3>
                <div className="h-[220px] min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <AreaChart data={revenueTrendBundle.data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
                                content={(props) => (
                                    <ProjectsTooltip
                                        {...props}
                                        getKey={(lbl) => String(lbl ?? '')}
                                        getProjectsForKey={(k) => revenueTrendBundle.projectsByMonth.get(k) || []}
                                        valueFormatter={(v) => formatCurrency(v)}
                                    />
                                )}
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
                <div className="h-[220px] min-h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <PieChart>
                            <Pie
                                data={statusBundle.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusBundle.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                content={(props) => (
                                    <ProjectsTooltip
                                        {...props}
                                        getKey={(_lbl, pl) => readStringField(getFirstPayloadEntry(pl), 'name')}
                                        getProjectsForKey={(k) => statusBundle.byLabel.get(k) || []}
                                    />
                                )}
                            />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Trạng thái thu tiền</h3>
                <div className="h-[220px] min-h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <PieChart>
                            <Pie
                                data={paymentStatusBundle.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {paymentStatusBundle.data.map((entry, index) => (
                                    <Cell key={`cell-pay-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                content={(props) => (
                                    <ProjectsTooltip
                                        {...props}
                                        getKey={(_lbl, pl) => readStringField(getFirstPayloadEntry(pl), 'name')}
                                        getProjectsForKey={(k) => paymentStatusBundle.byLabel.get(k) || []}
                                    />
                                )}
                            />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sales Performance - Span 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Top Doanh Số Theo Sale</h3>
                <div className="h-[220px] min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <BarChart layout="vertical" data={salesPerformanceBundle.data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
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
                                content={(props) => (
                                    <ProjectsTooltip
                                        {...props}
                                        getKey={(_lbl, pl) => {
                                            const entry = getFirstPayloadEntry(pl);
                                            const innerPayload = asRecord(entry ? entry['payload'] : null);
                                            const categoryName = readStringField(innerPayload, 'name').trim();
                                            if (categoryName) return categoryName;

                                            // Fallback: entry.name can be the series key (e.g. 'value'), not the Y-axis label.
                                            const entryName = readStringField(entry, 'name').trim();
                                            if (entryName && entryName !== 'value') return entryName;
                                            return '';
                                        }}
                                        getProjectsForKey={(k) => salesPerformanceBundle.projectsByLabel.get(k) || []}
                                        valueFormatter={(v) => formatCurrency(v)}
                                    />
                                )}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Lead Source */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Nguồn Khách Hàng</h3>
                <div className="h-[220px] min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <BarChart data={leadSourceBundle.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                                content={(props) => (
                                    <ProjectsTooltip
                                        {...props}
                                        getKey={(lbl) => String(lbl ?? '')}
                                        getProjectsForKey={(k) => leadSourceBundle.bySource.get(k) || []}
                                    />
                                )}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                {leadSourceBundle.data.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Follow-up aging */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Tình trạng chăm sóc (Đúng hạn / Quá hạn)</h3>
                <div className="h-[220px] min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <BarChart data={followupAgingBundle.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                content={(props) => (
                                    <ProjectsTooltip
                                        {...props}
                                        getKey={(lbl) => String(lbl ?? '')}
                                        getProjectsForKey={(k) => followupAgingBundle.byBucket.get(k) || []}
                                    />
                                )}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                                {followupAgingBundle.data.map((entry, index) => (
                                    <Cell key={`cell-age-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
