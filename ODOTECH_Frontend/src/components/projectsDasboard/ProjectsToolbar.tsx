export default function ProjectsToolbar({
  searchTerm,
  onChangeSearchTerm,
  filteredCount,
  onCreate,
}: {
  searchTerm: string;
  onChangeSearchTerm: (next: string) => void;
  filteredCount: number;
  onCreate: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
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

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">Hiển thị: {filteredCount}</div>
        <button type="button" className="h-10 px-5 rounded-lg bg-teal-600 text-white font-medium" onClick={onCreate}>
          Tạo dự án
        </button>
      </div>
    </div>
  );
}
