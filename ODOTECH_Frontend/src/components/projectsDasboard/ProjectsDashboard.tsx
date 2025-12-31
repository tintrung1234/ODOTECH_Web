import StatCard from '../accountsDasboard/StatCard';
import {
  FolderKanban,
  Wallet,
  TrendingDown,
  Landmark
} from 'lucide-react';

import type { ProjectManagementItem } from './interface/type';

export default function ProjectsDashboard({
  projects,
}: {
  projects: ProjectManagementItem[];
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
    <section className="mb-8">
      {/* Section title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Tổng quan dự án
        </h2>
        <p className="text-sm text-gray-500">
          Số liệu tài chính & tiến độ hiện tại
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Tổng dự án"
          value={totalProjects}
          icon={<FolderKanban />}
          color="blue"
        />

        <StatCard
          title="Giá trị hợp đồng"
          value={Math.round(totals.contract)}
          suffix="VND"
          icon={<Landmark />}
          color="purple"
        />

        <StatCard
          title="Chi phí thực"
          value={Math.round(totals.cost)}
          suffix="VND"
          icon={<TrendingDown />}
          color="red"
        />

        <StatCard
          title="Đã thu cọc"
          value={Math.round(totals.deposit)}
          suffix="VND"
          icon={<Wallet />}
          color="green"
        />
      </div>
    </section>
  );
}
