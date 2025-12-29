import type { ProjectData } from './interface/type';
import { formatCurrency } from '../../utils/formatDate';

type StatusKey = ProjectData['trang_thai_chot'];

type StatusSummary = {
  key: StatusKey;
  label: string;
  count: number;
  totalValue: number;
  colorClassName: string;
};

const STATUS_ORDER: Array<{ key: StatusKey; label: string; colorClassName: string; chipClassName: string }> = [
  { key: 'DangCham', label: 'Đang chăm', colorClassName: 'text-yellow-600', chipClassName: 'bg-yellow-500' },
  { key: 'DaKy', label: 'Đã ký', colorClassName: 'text-green-600', chipClassName: 'bg-green-600' },
  { key: 'Huy', label: 'Huỷ', colorClassName: 'text-red-600', chipClassName: 'bg-red-600' },
];

const safeNumber = (n: unknown) => {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
};

export default function SalesChart({ projects }: { projects: ProjectData[] }) {
  const byStatus = new Map<StatusKey, StatusSummary>();
  for (const s of STATUS_ORDER) {
    byStatus.set(s.key, { key: s.key, label: s.label, count: 0, totalValue: 0, colorClassName: s.colorClassName });
  }

  for (const p of projects) {
    const s = byStatus.get(p.trang_thai_chot);
    if (!s) continue;
    s.count += 1;
    s.totalValue += safeNumber(p.phi_dich_vu) + safeNumber(p.phat_sinh);
  }

  const items = STATUS_ORDER.map((s) => byStatus.get(s.key)!).filter(Boolean);
  const totalProjects = projects.length;
  const totalValue = projects.reduce((acc, p) => acc + safeNumber(p.phi_dich_vu) + safeNumber(p.phat_sinh), 0);

  // Donut chart geometry (SVG)
  const size = 160;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalForChart = Math.max(1, totalProjects);
  let offset = 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Biểu đồ trạng thái chốt</h2>
        <div className="text-sm text-gray-600">
          Tổng: <b className="text-gray-800">{totalProjects}</b> dự án • Tổng phí: <b className="text-gray-800">{formatCurrency(totalValue)}</b>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth={stroke}
                />
                {items.map((i) => {
                  const seg = (i.count / totalForChart) * circumference;
                  const dash = `${seg} ${circumference - seg}`;
                  const dashOffset = -offset;
                  // eslint-disable-next-line react-hooks/immutability
                  offset += seg;
                  return (
                    <circle
                      key={i.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      className={i.colorClassName}
                      stroke="currentColor"
                      strokeWidth={stroke}
                      strokeDasharray={dash}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                    />
                  );
                })}
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xs text-gray-600">Dự án</div>
              <div className="text-2xl font-bold text-gray-800">{totalProjects}</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STATUS_ORDER.map((s) => {
              const i = byStatus.get(s.key)!;
              const pct = totalProjects ? Math.round((i.count / totalProjects) * 100) : 0;
              return (
                <div key={s.key} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded ${s.chipClassName}`} />
                      <span className="text-sm font-medium text-gray-700">{i.label}</span>
                    </div>
                    <span className="text-xs text-gray-600">{pct}%</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <b>{i.count}</b> dự án
                  </div>
                  <div className="text-sm text-gray-700">{formatCurrency(i.totalValue)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
