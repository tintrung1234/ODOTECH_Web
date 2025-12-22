interface StatCardProps {
  title: string;
  value: number;
  color: 'green' | 'purple' | 'orange';
}

const colorClasses = {
  green: 'bg-emerald-400',
  purple: 'bg-purple-500',
  orange: 'bg-amber-500',
};

export default function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className={`${colorClasses[color]} rounded-2xl px-6 py-5 text-white flex items-center justify-center text-center min-h-[120px]`}>
      <div>
        <p className="text-base font-semibold opacity-95">{title}</p>
        <p className="text-5xl font-extrabold mt-2 leading-none">{value}</p>
      </div>
    </div>
  );
}
