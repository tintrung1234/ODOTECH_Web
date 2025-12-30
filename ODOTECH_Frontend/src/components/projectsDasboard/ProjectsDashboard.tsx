import StatCard from '../accountsDasboard/StatCard';

import type { ProjectManagementItem } from './interface/type';

export default function ProjectsDashboard({
  projects,
}: {
  projects: ProjectManagementItem[];
  today: Date;
}) {
  const totalProjects = projects.length;

  const totals = projects.reduce(
    (acc, p) => {
      acc.contract += Number(p.contract_value ?? 0);
      acc.cost += Number(p.actual_cost ?? 0);
      acc.deposit += Number(p.deposit_received ?? 0);
      return acc;
    },
    { contract: 0, cost: 0, deposit: 0 }
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Tổng dự án" value={totalProjects} color="green" />
        <StatCard title="Giá trị HĐ" value={Math.round(totals.contract)} color="purple" />
        <StatCard title="Chi phí thực" value={Math.round(totals.cost)} color="orange" />
        <StatCard title="Đã thu cọc" value={Math.round(totals.deposit)} color="purple" />
      </div>
    </>
  );
}
