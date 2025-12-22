import StatCard from '../accountsDasboard/StatCard';

import type { ProjectItem, ProjectStatus } from '../../types/types';
import { clampNumber, deriveDisplayStatus, statusLabel } from './projectUtils';

export default function ProjectsDashboard({
  projects,
  today,
}: {
  projects: ProjectItem[];
  today: Date;
}) {
  const totalProjects = projects.length;

  let totalTasks = 0;
  let overdueTasks = 0;
  const memberSet = new Set<string>();

  let lateProjects = 0;
  for (const p of projects) {
    totalTasks += p.soTask;
    overdueTasks += p.taskQuaHan;
    for (const m of p.thanhVien) memberSet.add(m);

    const displayStatus = deriveDisplayStatus(p, today);
    if (displayStatus === 'late') lateProjects += 1;
  }

  const avgProgress = projects.length === 0 ? 0 : Math.round(projects.reduce((sum, p) => sum + p.tienDo, 0) / projects.length);

  const statusSummary = (
    [
      { key: 'not_started', label: statusLabel('not_started') },
      { key: 'in_progress', label: statusLabel('in_progress') },
      { key: 'on_hold', label: statusLabel('on_hold') },
      { key: 'completed', label: statusLabel('completed') },
      { key: 'late', label: statusLabel('late') },
    ] as const
  ).map((s) => {
    const count = projects.filter((p) => deriveDisplayStatus(p, today) === (s.key as ProjectStatus)).length;
    const percent = projects.length === 0 ? 0 : Math.round((count / projects.length) * 100);
    return { ...s, count, percent };
  });

  const workloadByPm = (() => {
    const map = new Map<string, { pm: string; projects: number; tasks: number; overdue: number }>();
    for (const p of projects) {
      const key = p.pm.trim() || '—';
      const prev = map.get(key) ?? { pm: key, projects: 0, tasks: 0, overdue: 0 };
      map.set(key, {
        pm: key,
        projects: prev.projects + 1,
        tasks: prev.tasks + p.soTask,
        overdue: prev.overdue + p.taskQuaHan,
      });
    }
    const list = Array.from(map.values());
    list.sort((a, b) => b.tasks - a.tasks);
    return list;
  })();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Tổng dự án" value={totalProjects} color="green" />
        <StatCard title="Số task" value={totalTasks} color="purple" />
        <StatCard title="Task quá hạn" value={overdueTasks} color="orange" />
        <StatCard title="Thành viên" value={memberSet.size} color="purple" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-base font-semibold text-gray-900">Biểu đồ tiến độ</div>
            <div className="text-sm text-gray-600">TB: {avgProgress}%</div>
          </div>

          <div className="mt-3">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div className="h-full bg-teal-500" style={{ width: `${clampNumber(avgProgress, 0, 100)}%` }} />
            </div>
            <div className="mt-2 text-sm text-gray-600">Số dự án trễ tiến độ: {lateProjects}</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {statusSummary.map((s) => (
              <div key={s.key} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-gray-800">{s.label}</div>
                  <div className="text-sm text-gray-600">{s.count}</div>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div className="h-full bg-gray-700" style={{ width: `${clampNumber(s.percent, 0, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-base font-semibold text-gray-900">Biểu đồ workload</div>
            <div className="text-sm text-gray-600">Theo PM</div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            {workloadByPm.length === 0 ? (
              <div className="text-gray-600">Chưa có dữ liệu.</div>
            ) : (
              workloadByPm.slice(0, 6).map((row, index) => {
                const maxTasks = workloadByPm[0]?.tasks ?? 0;
                const width = maxTasks <= 0 ? 0 : Math.round((row.tasks / maxTasks) * 100);
                return (
                  <div key={`${row.pm}-${index}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-gray-800">{row.pm}</div>
                      <div className="text-sm text-gray-600">
                        {row.projects} dự án · {row.tasks} task · {row.overdue} quá hạn
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div className="h-full bg-purple-600" style={{ width: `${clampNumber(width, 0, 100)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
