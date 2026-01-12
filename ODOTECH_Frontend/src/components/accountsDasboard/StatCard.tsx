import { useId, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type StatCardColor = 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'gray';
type ChartType = 'none' | 'progress' | 'trend' | 'sparkline' | 'ring' | 'comparison';

type StatCardProps = {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: StatCardColor;
  tooltipTitle?: string;
  tooltipItems?: string[];
  // Chart enhancements
  chartType?: ChartType;
  chartData?: {
    percentage?: number; // for progress & ring (0-100)
    current?: number;
    previous?: number;
    target?: number;
    max?: number;
    sparkline?: number[]; // array of values for sparkline
  };
};

const colorClass = (color: StatCardColor | undefined) => {
  switch (color) {
    case 'green':
      return {
        iconBg: 'bg-green-100 text-green-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-green-500',
        chart: 'bg-green-500',
        chartSecondary: 'bg-green-200',
        stroke: '#22c55e',
      };
    case 'purple':
      return {
        iconBg: 'bg-purple-100 text-purple-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-purple-500',
        chart: 'bg-purple-500',
        chartSecondary: 'bg-purple-200',
        stroke: '#a855f7',
      };
    case 'orange':
      return {
        iconBg: 'bg-orange-100 text-orange-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-orange-500',
        chart: 'bg-orange-500',
        chartSecondary: 'bg-orange-200',
        stroke: '#f97316',
      };
    case 'blue':
      return {
        iconBg: 'bg-blue-100 text-blue-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-blue-500',
        chart: 'bg-blue-500',
        chartSecondary: 'bg-blue-200',
        stroke: '#3b82f6',
      };
    case 'red':
      return {
        iconBg: 'bg-red-100 text-red-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-red-500',
        chart: 'bg-red-500',
        chartSecondary: 'bg-red-200',
        stroke: '#ef4444',
      };
    case 'gray':
    default:
      return {
        iconBg: 'bg-gray-100 text-gray-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-gray-500',
        chart: 'bg-gray-500',
        chartSecondary: 'bg-gray-200',
        stroke: '#6b7280',
      };
  }
};

// Progress Bar Chart
const ProgressChart = ({ percentage, color }: { percentage: number; color: string }) => {
  const safePercent = Math.max(0, Math.min(100, percentage));
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 font-medium">Tiến độ</span>
        <span className="text-xs text-gray-700 font-bold">{safePercent.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
};

// Trend Indicator
const TrendChart = ({ current, previous }: { current: number; previous: number }) => {
  const change = current - previous;
  const percentChange = previous !== 0 ? ((change / previous) * 100) : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className="mt-3 flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isNeutral ? 'bg-gray-100 text-gray-600' :
          isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
        {isNeutral ? <Minus size={14} /> : isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span className="text-xs font-bold">
          {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
        </span>
      </div>
      <span className="text-xs text-gray-500">vs kỳ trước</span>
    </div>
  );
};

// Sparkline Chart
const SparklineChart = ({ data, stroke }: { data: number[]; stroke: string }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const padding = 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="mt-3">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        {data.map((val, idx) => {
          const x = (idx / (data.length - 1)) * width;
          const y = height - padding - ((val - min) / range) * (height - padding * 2);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="2"
              fill={stroke}
              className="opacity-60"
            />
          );
        })}
      </svg>
    </div>
  );
};

// Circular Ring Chart
const RingChart = ({ percentage, stroke }: { percentage: number; stroke: string }) => {
  const safePercent = Math.max(0, Math.min(100, percentage));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="mt-3 flex items-center gap-3">
      <svg width="50" height="50" className="transform -rotate-90">
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div>
        <div className="text-lg font-bold text-gray-900">{safePercent.toFixed(0)}%</div>
        <div className="text-xs text-gray-500">Hoàn thành</div>
      </div>
    </div>
  );
};

// Comparison Bar Chart
const ComparisonChart = ({ current, target, color, secondaryColor }: {
  current: number;
  target: number;
  color: string;
  secondaryColor: string;
}) => {
  const max = Math.max(current, target);
  const currentPercent = max > 0 ? (current / max) * 100 : 0;
  const targetPercent = max > 0 ? (target / max) * 100 : 0;

  return (
    <div className="mt-3 space-y-2">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 font-medium">Thực tế</span>
          <span className="text-xs text-gray-700 font-bold">{current.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500 rounded-full`}
            style={{ width: `${currentPercent}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 font-medium">Mục tiêu</span>
          <span className="text-xs text-gray-700 font-bold">{target.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${secondaryColor} transition-all duration-500 rounded-full`}
            style={{ width: `${targetPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default function StatCard({
  title,
  value,
  suffix,
  icon,
  color = 'gray',
  tooltipTitle,
  tooltipItems,
  chartType = 'none',
  chartData
}: StatCardProps) {
  const classes = colorClass(color);
  const tooltipId = useId();

  const displayValue =
    typeof value === 'number'
      ? value.toLocaleString()
      : value;

  const tooltipLines = (tooltipItems ?? []).map((s) => String(s).trim()).filter(Boolean);
  const hasTooltip = Boolean((tooltipTitle && tooltipTitle.trim()) || tooltipLines.length > 0);

  return (
    <div
      className={`relative rounded-xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-default ${hasTooltip ? 'group focus:outline-none focus:ring-2 focus:ring-blue-200' : ''} ${classes.border}`}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className={`text-2xl font-bold tracking-tight ${classes.value}`}>{displayValue}</h3>
            {suffix && <span className="text-xs text-gray-500 font-medium">{suffix}</span>}
          </div>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${classes.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Chart Rendering */}
      {chartType === 'progress' && chartData?.percentage !== undefined && (
        <ProgressChart percentage={chartData.percentage} color={classes.chart} />
      )}

      {chartType === 'trend' && chartData?.current !== undefined && chartData?.previous !== undefined && (
        <TrendChart current={chartData.current} previous={chartData.previous} />
      )}

      {chartType === 'sparkline' && chartData?.sparkline && chartData.sparkline.length > 1 && (
        <SparklineChart data={chartData.sparkline} stroke={classes.stroke} />
      )}

      {chartType === 'ring' && chartData?.percentage !== undefined && (
        <RingChart percentage={chartData.percentage} stroke={classes.stroke} />
      )}

      {chartType === 'comparison' && chartData?.current !== undefined && chartData?.target !== undefined && (
        <ComparisonChart
          current={chartData.current}
          target={chartData.target}
          color={classes.chart}
          secondaryColor={classes.chartSecondary}
        />
      )}

      {hasTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute top-full left-0 mt-2 w-[320px] max-w-[min(360px,calc(100vw-24px))] rounded-xl border border-gray-200 bg-white shadow-xl p-3 opacity-0 invisible translate-y-1 scale-[0.98] transition-all duration-150 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 z-50 max-h-72 overflow-auto pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
        >
          {/* Arrow */}
          <div className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 bg-white border border-gray-200 border-r-0 border-b-0" />

          {(tooltipTitle && tooltipTitle.trim()) && (
            <div className="text-xs font-bold text-gray-800 mb-2 pb-1 border-b border-gray-100">{tooltipTitle}</div>
          )}

          {tooltipLines.length > 0 ? (
            <ul className="space-y-1.5">
              {tooltipLines.map((line, idx) => (
                <li key={`${idx}-${line}`} className="text-[11px] text-gray-600 leading-snug flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-gray-400 italic">Không có dữ liệu chi tiết.</div>
          )}
        </div>
      )}
    </div>
  );
}