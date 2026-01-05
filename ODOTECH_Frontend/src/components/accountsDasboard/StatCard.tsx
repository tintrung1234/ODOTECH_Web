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
        line: 'from-green-300',
        icon: 'text-green-500',
        value: 'text-green-700',
        border: 'border-green-100',
        bgFrom: 'from-green-50',
      };
    case 'purple':
      return {
        line: 'from-purple-300',
        icon: 'text-purple-500',
        value: 'text-purple-700',
        border: 'border-purple-100',
        bgFrom: 'from-purple-50',
      };
    case 'orange':
      return {
        line: 'from-orange-300',
        icon: 'text-orange-500',
        value: 'text-orange-700',
        border: 'border-orange-100',
        bgFrom: 'from-orange-50',
      };
    case 'blue':
      return {
        line: 'from-blue-300',
        icon: 'text-blue-500',
        value: 'text-blue-700',
        border: 'border-blue-100',
        bgFrom: 'from-blue-50',
      };
    case 'red':
      return {
        line: 'from-red-300',
        icon: 'text-red-500',
        value: 'text-red-700',
        border: 'border-red-100',
        bgFrom: 'from-red-50',
      };
    case 'gray':
    default:
      return {
        line: 'from-gray-200',
        icon: 'text-gray-400',
        value: 'text-gray-900',
        border: 'border-gray-100',
        bgFrom: 'from-white',
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
      className={`relative rounded-xl bg-gradient-to-br ${classes.bgFrom} to-gray-50 border ${classes.border} shadow-sm p-5 ${hasTooltip ? 'group' : ''}`}
      tabIndex={hasTooltip ? 0 : undefined}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${classes.line} to-transparent rounded-t-xl`}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {icon && <div className={`${classes.icon} text-lg`}>{icon}</div>}
      </div>

      <div className="mt-4 flex items-end gap-1">
        <p className={`text-3xl font-semibold tracking-tight ${classes.value}`}>{displayValue}</p>
        {suffix && <span className="text-sm text-gray-500 mb-1">{suffix}</span>}
      </div>

      {hasTooltip && (
        <div
          role="tooltip"
          className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-gray-200 bg-white shadow-lg p-3 opacity-0 invisible transition-opacity duration-150 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible z-50 max-h-72 overflow-auto"
        >
          {(tooltipTitle && tooltipTitle.trim()) && (
            <div className="text-xs font-semibold text-gray-800 mb-2">{tooltipTitle}</div>
          )}

          {tooltipLines.length > 0 ? (
            <ul className="text-[11px] text-gray-700 space-y-1 break-words">
              {tooltipLines.map((line, idx) => (
                <li key={`${idx}-${line}`} className="leading-snug break-words">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-gray-500">Không có dữ liệu chi tiết.</div>
          )}
        </div>
      )}
    </div>
  );
}