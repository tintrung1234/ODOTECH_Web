import type { ReactNode } from 'react';

type StatCardColor = 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'gray';

type StatCardProps = {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: StatCardColor;
  tooltipTitle?: string;
  tooltipItems?: string[];
};

const colorClass = (color: StatCardColor | undefined) => {
  switch (color) {
    case 'green':
      return {
        iconBg: 'bg-green-100 text-green-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-green-500',
      };
    case 'purple':
      return {
        iconBg: 'bg-purple-100 text-purple-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-purple-500',
      };
    case 'orange':
      return {
        iconBg: 'bg-orange-100 text-orange-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-orange-500',
      };
    case 'blue':
      return {
        iconBg: 'bg-blue-100 text-blue-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-blue-500',
      };
    case 'red':
      return {
        iconBg: 'bg-red-100 text-red-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-red-500',
      };
    case 'gray':
    default:
      return {
        iconBg: 'bg-gray-100 text-gray-600',
        value: 'text-gray-900',
        border: 'border-l-4 border-l-gray-500',
      };
  }
};

export default function StatCard({ title, value, suffix, icon, color = 'gray', tooltipTitle, tooltipItems }: StatCardProps) {
  const classes = colorClass(color);

  const displayValue =
    typeof value === 'number'
      ? value.toLocaleString()
      : value;

  const tooltipLines = (tooltipItems ?? []).map((s) => String(s).trim()).filter(Boolean);
  const hasTooltip = Boolean((tooltipTitle && tooltipTitle.trim()) || tooltipLines.length > 0);

  return (
    <div
      className={`relative rounded-xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-default ${hasTooltip ? 'group' : ''} ${classes.border}`}
      tabIndex={hasTooltip ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
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

      {hasTooltip && (
        <div
          role="tooltip"
          className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-gray-100 bg-white shadow-xl p-3 opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible z-50 max-h-72 overflow-auto"
        >
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