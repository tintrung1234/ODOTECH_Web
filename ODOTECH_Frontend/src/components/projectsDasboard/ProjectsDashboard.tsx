import { useCallback, useMemo } from 'react';

import StatCard from '../accountsDasboard/StatCard';
import {
  FolderKanban,
  Wallet,
  TrendingDown,
  Landmark,
  AlertTriangle,
  CalendarClock,
  Percent,
  CheckCircle2
} from 'lucide-react';

import type { Account, ProjectManagementItem } from './interface/type';
import type { CanonicalRole } from '../../utils/auth';

export default function ProjectsDashboard({
  projects,
  role = 'unknown',
  today = new Date(),
  accounts = [],
}: {
  projects: ProjectManagementItem[];
  role?: CanonicalRole;
  today?: Date;
  accounts?: Account[];
}) {
  const totalProjects = projects.length;

  const isDoneStatus = (status: string) => {
    const s = String(status || '').trim();
    return (
      s === 'completed' ||
      s === 'Kết thúc hài lòng' ||
      s === 'Kết thúc thất vọng' ||
      s === 'Hoàn thành đợi tất toán'
    );
  };

  const parseISODateUtcMs = (value: string): number | null => {
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(value || '').trim());
    if (!m) return null;
    const year = Number(m[1]);
    const monthIndex = Number(m[2]) - 1;
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
    return Date.UTC(year, monthIndex, day);
  };

  const todayUtcMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingWindowMs = 7 * 24 * 60 * 60 * 1000;

  const counts = projects.reduce(
    (acc, p) => {
      const done = isDoneStatus(String(p.status ?? ''));
      if (done) acc.done += 1;
      else acc.active += 1;

      const deadlineMs = parseISODateUtcMs(p.deadline ?? '');
      if (deadlineMs != null && !done) {
        if (deadlineMs < todayUtcMs) acc.overdue += 1;
        else if (deadlineMs < todayUtcMs + upcomingWindowMs) acc.upcoming += 1;
      }

      const progress = Number(p.progress_percent ?? 0);
      if (Number.isFinite(progress)) {
        acc.progressSum += Math.max(0, Math.min(100, progress));
        acc.progressCount += 1;
      }

      return acc;
    },
    { done: 0, active: 0, overdue: 0, upcoming: 0, progressSum: 0, progressCount: 0 }
  );

  const avgProgress = counts.progressCount > 0 ? Math.round((counts.progressSum / counts.progressCount) * 10) / 10 : 0;

  const totals = projects.reduce(
    (acc, p) => {
      acc.contract += Number(p.contract_value ?? 0);
      acc.cost += Number(p.actual_cost ?? 0);
      acc.deposit += Number(p.deposit_received ?? 0);
      return acc;
    },
    { contract: 0, cost: 0, deposit: 0 }
  );

  const accountsById = useMemo(() => {
    const map = new Map<number, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const displayAccount = useCallback(
    (id: number | null | undefined) => {
      if (!Number.isFinite(Number(id))) return '';
      const a = accountsById.get(Number(id));
      return (a?.name || a?.username || String(id)).trim();
    },
    [accountsById]
  );

  const projectPeopleSummary = useCallback(
    (p: ProjectManagementItem) => {
      const parts: string[] = [];
      const pm = displayAccount(p.pm_id);
      const sale = displayAccount(p.sale_id);
      if (pm) parts.push(`PM: ${pm}`);
      if (sale) parts.push(`Sale: ${sale}`);

      const assignee = String(p.assignee ?? '').trim();
      const techUser = String(p.tech_user ?? '').trim();
      if (assignee) parts.push(`Người làm: ${assignee}`);
      if (techUser) parts.push(`User kỹ thuật: ${techUser}`);

      return parts.join(' | ');
    },
    [displayAccount]
  );

  const buildProjectLines = useCallback(
    (list: ProjectManagementItem[], limit = 8) => {
      const lines = list.slice(0, limit).map((p) => {
        const code = String(p.project_code ?? `#${p.id}`).trim();
        const name = String(p.name ?? '').trim();
        const deadline = String(p.deadline ?? '').trim();
        const status = String(p.status ?? '').trim();
        const people = projectPeopleSummary(p);

        const head = name ? `${code} — ${name}` : code;
        const metaParts = [
          deadline ? `Deadline: ${deadline}` : '',
          status ? `Status: ${status}` : '',
          people,
        ].filter(Boolean);

        return metaParts.length ? `${head} (${metaParts.join(' • ')})` : head;
      });

      if (list.length > limit) lines.push(`+${list.length - limit} dự án khác...`);
      return lines;
    },
    [projectPeopleSummary]
  );

  const overdueProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const done = isDoneStatus(String(p.status ?? ''));
        if (done) return false;
        const deadlineMs = parseISODateUtcMs(p.deadline ?? '');
        return deadlineMs != null && deadlineMs < todayUtcMs;
      })
      .sort((a, b) => {
        const aMs = parseISODateUtcMs(a.deadline ?? '') ?? Number.MAX_SAFE_INTEGER;
        const bMs = parseISODateUtcMs(b.deadline ?? '') ?? Number.MAX_SAFE_INTEGER;
        return aMs - bMs;
      });
  }, [projects, todayUtcMs]);

  const upcomingProjects = useMemo(() => {
    const end = todayUtcMs + upcomingWindowMs;
    return projects
      .filter((p) => {
        const done = isDoneStatus(String(p.status ?? ''));
        if (done) return false;
        const deadlineMs = parseISODateUtcMs(p.deadline ?? '');
        return deadlineMs != null && deadlineMs >= todayUtcMs && deadlineMs < end;
      })
      .sort((a, b) => {
        const aMs = parseISODateUtcMs(a.deadline ?? '') ?? Number.MAX_SAFE_INTEGER;
        const bMs = parseISODateUtcMs(b.deadline ?? '') ?? Number.MAX_SAFE_INTEGER;
        return aMs - bMs;
      });
  }, [projects, todayUtcMs, upcomingWindowMs]);

  const lowProgressProjects = useMemo(() => {
    return [...projects]
      .filter((p) => !isDoneStatus(String(p.status ?? '')))
      .sort((a, b) => Number(a.progress_percent ?? 0) - Number(b.progress_percent ?? 0));
  }, [projects]);

  const topContractProjects = useMemo(() => {
    return [...projects]
      .filter((p) => Number(p.contract_value ?? 0) > 0)
      .sort((a, b) => Number(b.contract_value ?? 0) - Number(a.contract_value ?? 0));
  }, [projects]);

  const topDepositProjects = useMemo(() => {
    return [...projects]
      .filter((p) => Number(p.deposit_received ?? 0) > 0)
      .sort((a, b) => Number(b.deposit_received ?? 0) - Number(a.deposit_received ?? 0));
  }, [projects]);

  const cards = (() => {
    // Keep the dashboard compact: always show 4 cards, but vary by role.
    if (role === 'sale' || role === 'sales_manager') {
      return [
        {
          title: 'Tổng dự án',
          value: totalProjects,
          icon: <FolderKanban />,
          color: 'blue' as const,
          tooltipTitle: 'Danh sách dự án',
          tooltipItems: buildProjectLines(projects),
        },
        {
          title: 'Trễ deadline',
          value: counts.overdue,
          icon: <AlertTriangle />,
          color: 'red' as const,
          tooltipTitle: 'Dự án trễ deadline',
          tooltipItems: buildProjectLines(overdueProjects),
        },
        {
          title: 'Sắp đến hạn (7 ngày)',
          value: counts.upcoming,
          icon: <CalendarClock />,
          color: 'orange' as const,
          tooltipTitle: 'Dự án sắp đến hạn',
          tooltipItems: buildProjectLines(upcomingProjects),
        },
        {
          title: 'Giá trị hợp đồng',
          value: Math.round(totals.contract),
          suffix: 'VND',
          icon: <Landmark />,
          color: 'purple' as const,
          tooltipTitle: 'Top dự án theo hợp đồng',
          tooltipItems: buildProjectLines(topContractProjects),
        },
      ];
    }

    if (role === 'dev' || role === 'dev_manager' || role === 'head_tech') {
      return [
        {
          title: 'Tổng dự án',
          value: totalProjects,
          icon: <FolderKanban />,
          color: 'blue' as const,
          tooltipTitle: 'Danh sách dự án',
          tooltipItems: buildProjectLines(projects),
        },
        {
          title: 'Trễ deadline',
          value: counts.overdue,
          icon: <AlertTriangle />,
          color: 'red' as const,
          tooltipTitle: 'Dự án trễ deadline',
          tooltipItems: buildProjectLines(overdueProjects),
        },
        {
          title: 'Sắp đến hạn (7 ngày)',
          value: counts.upcoming,
          icon: <CalendarClock />,
          color: 'orange' as const,
          tooltipTitle: 'Dự án sắp đến hạn',
          tooltipItems: buildProjectLines(upcomingProjects),
        },
        {
          title: 'Tiến độ TB',
          value: avgProgress,
          suffix: '%',
          icon: <Percent />,
          color: 'green' as const,
          tooltipTitle: 'Dự án tiến độ thấp (ưu tiên)',
          tooltipItems: buildProjectLines(lowProgressProjects),
        },
      ];
    }

    // admin / head_sales / support / unknown
    return [
      {
        title: 'Tổng dự án',
        value: totalProjects,
        icon: <FolderKanban />,
        color: 'blue' as const,
        tooltipTitle: 'Danh sách dự án',
        tooltipItems: buildProjectLines(projects),
      },
      {
        title: 'Trễ deadline',
        value: counts.overdue,
        icon: <AlertTriangle />,
        color: 'red' as const,
        tooltipTitle: 'Dự án trễ deadline',
        tooltipItems: buildProjectLines(overdueProjects),
      },
      {
        title: 'Giá trị hợp đồng',
        value: Math.round(totals.contract),
        suffix: 'VND',
        icon: <Landmark />,
        color: 'purple' as const,
        tooltipTitle: 'Top dự án theo hợp đồng',
        tooltipItems: buildProjectLines(topContractProjects),
      },
      {
        title: 'Đã thu cọc',
        value: Math.round(totals.deposit),
        suffix: 'VND',
        icon: <Wallet />,
        color: 'green' as const,
        tooltipTitle: 'Top dự án theo thu cọc',
        tooltipItems: buildProjectLines(topDepositProjects),
      },
    ];
  })();

  return (
    <section className="mb-8 space-y-6">
      {/* Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Tổng quan dự án
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              Chỉ số hiệu suất & trạng thái
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((c) => (
            <StatCard
              key={c.title}
              title={c.title}
              value={c.value}
              suffix={c.suffix}
              icon={c.icon}
              color={c.color}
              tooltipTitle={c.tooltipTitle}
              tooltipItems={c.tooltipItems}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Chi phí thực"
            value={Math.round(totals.cost)}
            suffix="VND"
            icon={<TrendingDown />}
            color="red"
            tooltipTitle="Top dự án theo chi phí"
            tooltipItems={buildProjectLines(
              [...projects]
                .filter((p) => Number(p.actual_cost ?? 0) > 0)
                .sort((a, b) => Number(b.actual_cost ?? 0) - Number(a.actual_cost ?? 0))
            )}
          />
          <StatCard
            title="Đã hoàn thành"
            value={counts.done}
            icon={<CheckCircle2 />}
            color="green"
            tooltipTitle="Dự án đã hoàn thành"
            tooltipItems={buildProjectLines(projects.filter((p) => isDoneStatus(String(p.status ?? ''))))}
          />
          <StatCard
            title="Đang triển khai"
            value={counts.active}
            icon={<FolderKanban />}
            color="blue"
            tooltipTitle="Dự án đang triển khai"
            tooltipItems={buildProjectLines(projects.filter((p) => !isDoneStatus(String(p.status ?? ''))))}
          />
          <StatCard
            title="Sắp đến hạn (7 ngày)"
            value={counts.upcoming}
            icon={<CalendarClock />}
            color="orange"
            tooltipTitle="Dự án sắp đến hạn"
            tooltipItems={buildProjectLines(upcomingProjects)}
          />
        </div>
      </div>
    </section>
  );
}
