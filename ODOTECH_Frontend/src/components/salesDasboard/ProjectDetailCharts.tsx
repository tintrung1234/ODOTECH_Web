import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import type { ProjectData, Payment } from './interface/type';
import { formatCurrency } from '../../utils/formatDate';

// Payment Progress Donut Chart
export const PaymentProgressChart = ({ data }: { data: ProjectData }) => {
    const tongPhi = Number(data.phi_dich_vu) + Number(data.phat_sinh);
    const daThanhToan = data.danh_sach_thanh_toan.reduce((acc: number, cur: Payment) => acc + Number(cur.so_tien), 0);
    const congNo = tongPhi - daThanhToan;
    const processPercent = tongPhi > 0 ? Math.min(100, Math.round((daThanhToan / tongPhi) * 100)) : 0;

    const chartData = [
        { name: 'Đã thanh toán', value: daThanhToan, color: '#10b981' },
        { name: 'Còn nợ', value: congNo > 0 ? congNo : 0, color: '#ef4444' },
    ].filter(item => item.value > 0);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Tiến độ thanh toán</h3>
            <div className="h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0];
                                return (
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
                                        <div className="font-semibold text-gray-900 mb-1">{data.name}</div>
                                        <div className="text-gray-600">{formatCurrency(Number(data.value))}</div>
                                    </div>
                                );
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconSize={10}
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{processPercent}%</div>
                <div className="text-sm text-gray-500 mt-1">Hoàn thành</div>
            </div>
        </div>
    );
};

// Payment Timeline Bar Chart
export const PaymentTimelineChart = ({ data }: { data: ProjectData }) => {
    const chartData = data.danh_sach_thanh_toan
        .filter((p: Payment) => Number(p.so_tien) > 0)
        .map((p: Payment) => ({
            name: `Đợt ${p.lan_thanh_toan}`,
            amount: Number(p.so_tien),
            date: p.ngay_thanh_toan || 'Chưa có',
        }));

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Lịch sử thanh toán</h3>
                <div className="h-[240px] flex items-center justify-center text-gray-400 italic">
                    Chưa có thanh toán nào
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Lịch sử thanh toán</h3>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 11 }}
                            tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
                                        <div className="font-semibold text-gray-900 mb-1">{data.name}</div>
                                        <div className="text-gray-600 mb-1">{formatCurrency(data.amount)}</div>
                                        <div className="text-gray-500 text-[10px]">{data.date}</div>
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Cost Breakdown Pie Chart
export const CostBreakdownChart = ({ data }: { data: ProjectData }) => {
    const chartData = [
        { name: 'Phí dịch vụ', value: Number(data.phi_dich_vu), color: '#3b82f6' },
        { name: 'Phát sinh', value: Number(data.phat_sinh), color: '#f59e0b' },
        { name: 'Outsource', value: Number(data.chi_phi_outsource), color: '#8b5cf6' },
    ].filter(item => item.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Cơ cấu chi phí</h3>
                <div className="h-[240px] flex items-center justify-center text-gray-400 italic">
                    Chưa có dữ liệu chi phí
                </div>
            </div>
        );
    }

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Cơ cấu chi phí</h3>
            <div className="h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0];
                                const percent = total > 0 ? ((Number(data.value) / total) * 100).toFixed(1) : 0;
                                return (
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
                                        <div className="font-semibold text-gray-900 mb-1">{data.name}</div>
                                        <div className="text-gray-600 mb-1">{formatCurrency(Number(data.value))}</div>
                                        <div className="text-gray-500">{percent}%</div>
                                    </div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Deployment Timeline Visualization
export const DeploymentTimelineChart = ({ data }: { data: ProjectData }) => {
    const milestones = [
        { label: 'Ngày tạo', date: data.ngay_tao, color: 'bg-blue-500' },
        { label: 'Bàn giao', date: data.ngay_ban_giao, color: 'bg-purple-500' },
        { label: 'Tất toán', date: data.ngay_tat_toan, color: 'bg-green-500' },
    ].filter(m => m.date);

    if (milestones.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Timeline triển khai</h3>
                <div className="h-[120px] flex items-center justify-center text-gray-400 italic">
                    Chưa có dữ liệu timeline
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Timeline triển khai</h3>
            <div className="relative py-8">
                {/* Timeline line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>

                {/* Milestones */}
                <div className="relative flex justify-between items-center">
                    {milestones.map((milestone, index) => (
                        <div key={index} className="flex flex-col items-center z-10">
                            <div className={`w-4 h-4 rounded-full ${milestone.color} border-4 border-white shadow-md mb-2`}></div>
                            <div className="text-xs font-semibold text-gray-700 mb-1 text-center">{milestone.label}</div>
                            <div className="text-xs text-gray-500 font-mono text-center">{milestone.date}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Renewal Services Visual Grid
export const RenewalServicesChart = ({ data }: { data: ProjectData }) => {
    const services = [
        {
            key: 'gia_han_domain',
            label: 'Domain',
            active: data.gia_han_domain,
            expiry: data.ngay_hh_domain,
            fee: data.phi_gh_domain,
            color: 'indigo'
        },
        {
            key: 'gia_han_hosting',
            label: 'Hosting',
            active: data.gia_han_hosting,
            expiry: data.ngay_hh_hosting,
            fee: data.phi_gh_hosting,
            color: 'blue'
        },
        {
            key: 'gia_han_email',
            label: 'Email',
            active: data.gia_han_email,
            expiry: data.ngay_hh_email,
            fee: data.phi_gh_email,
            color: 'purple'
        },
        {
            key: 'gia_han_content',
            label: 'Content',
            active: data.gia_han_content,
            expiry: data.ngay_hh_content,
            fee: data.phi_gh_content,
            color: 'pink'
        },
        {
            key: 'gia_han_ads',
            label: 'Ads',
            active: data.gia_han_ads,
            expiry: data.ngay_hh_ads,
            fee: data.phi_gh_ads,
            color: 'orange'
        },
    ];

    const activeServices = services.filter(s => s.active);

    if (activeServices.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Dịch vụ gia hạn</h3>
                <div className="h-[200px] flex items-center justify-center text-gray-400 italic">
                    Không có dịch vụ gia hạn nào
                </div>
            </div>
        );
    }

    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        pink: 'bg-pink-500',
        orange: 'bg-orange-500',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Dịch vụ gia hạn ({activeServices.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {activeServices.map((service) => (
                    <div
                        key={service.key}
                        className="relative p-4 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all"
                    >
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colorMap[service.color]}`}></div>
                        <div className="text-sm font-bold text-gray-800 mb-2">{service.label}</div>
                        {service.expiry && (
                            <div className="text-xs text-gray-500 mb-1">
                                <span className="font-semibold">HH:</span> {service.expiry}
                            </div>
                        )}
                        {Number(service.fee) > 0 && (
                            <div className="text-xs font-medium text-gray-700">
                                {formatCurrency(Number(service.fee))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
