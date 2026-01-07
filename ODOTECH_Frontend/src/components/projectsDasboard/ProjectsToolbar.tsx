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
    <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-md group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={searchTerm}
            onChange={(e) => onChangeSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={projectType}
            onChange={(e) => onChangeProjectType(e.target.value as ProjectType | '')}
            className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer hover:bg-gray-50 transition-colors flex-1 md:flex-none"
          >
            <option value="">Tất cả loại</option>
            {PROJECT_TYPES.filter((t) => t !== '').map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={projectStatus}
            onChange={(e) => onChangeProjectStatus(e.target.value as ProjectMgmtStatus | '')}
            className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer hover:bg-gray-50 transition-colors flex-1 md:flex-none"
            style={{ maxWidth: '200px' }}
          >
            <option value="">Tất cả trạng thái</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          {filteredCount} kết quả
        </div>
        {canCreate && (
          <button
            type="button"
            className="h-10 px-5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95"
            onClick={onCreate}
          >
            <span>+ Tạo dự án</span>
          </button>
        )}
      </div>
    </div>
  );
}
