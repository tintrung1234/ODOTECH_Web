import type { ProjectMgmtStatus, ProjectType } from './interface/type';
import { PROJECT_STATUSES, PROJECT_TYPES } from './helper/projectsTableHelpers';

export default function ProjectsToolbar({
  searchTerm,
  onChangeSearchTerm,
  projectType,
  onChangeProjectType,
  projectStatus,
  onChangeProjectStatus,
  filteredCount,
  onCreate,
  canCreate = true,
}: {
  searchTerm: string;
  onChangeSearchTerm: (next: string) => void;
  projectType: ProjectType | '';
  onChangeProjectType: (next: ProjectType | '') => void;
  projectStatus: ProjectMgmtStatus | '';
  onChangeProjectStatus: (next: ProjectMgmtStatus | '') => void;
  filteredCount: number;
  onCreate: () => void;
  canCreate?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-lg">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm (ID / mã dự án / tên website / client / PM)"
          value={searchTerm}
          onChange={(e) => onChangeSearchTerm(e.target.value)}
          className="w-full h-10 pl-11 pr-4 border border-gray-400 rounded-lg bg-white outline-none focus:border-gray-600"
        />
        </div>

        <select
          value={projectType}
          onChange={(e) => onChangeProjectType(e.target.value as ProjectType | '')}
          className="h-10 px-3 border border-gray-400 rounded-lg bg-white text-sm text-gray-700 outline-none focus:border-gray-600"
          aria-label="Lọc loại dự án"
        >
          <option value="">Tất cả loại</option>
          {PROJECT_TYPES.filter((t) => t !== '').map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={projectStatus}
          onChange={(e) => onChangeProjectStatus(e.target.value as ProjectMgmtStatus | '')}
          className="h-10 px-3 border border-gray-400 rounded-lg bg-white text-sm text-gray-700 outline-none focus:border-gray-600"
          aria-label="Lọc trạng thái dự án"
        >
          <option value="">Tất cả trạng thái</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">Hiển thị: {filteredCount}</div>
        {canCreate && (
          <button type="button" className="h-10 px-5 rounded-lg bg-teal-600 text-white font-medium" onClick={onCreate}>
            Tạo dự án
          </button>
        )}
      </div>
    </div>
  );
}
