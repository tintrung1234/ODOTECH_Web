import type { ReactNode } from 'react';

type StatCardColor = 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'gray';

type StatCardProps = {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: StatCardColor;
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

export default function StatCard({ title, value, suffix, icon, color = 'gray' }: StatCardProps) {
  const classes = colorClass(color);

  const displayValue =
    typeof value === 'number'
      ? value.toLocaleString()
      : value;

  return (
    <div className={`relative rounded-xl bg-gradient-to-br ${classes.bgFrom} to-gray-50 border ${classes.border} shadow-sm p-5`}>
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
    </div>
  );
}