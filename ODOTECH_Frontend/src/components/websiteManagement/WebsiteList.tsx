import { AlertTriangle, ExternalLink, Globe, HardDrive, ShieldCheck, ShieldOff } from 'lucide-react';

interface Website {
	id: number;
	name: string;
	url: string;
	project_code: string;
	manager_id?: number;
	manager_name?: string;
	sale_manager_id?: number;
	hosting_package: string;
	hosting_provider: string;
	storage_used: number;
	storage_limit: number;
	storage_percentage: number;
	storage_alert_threshold: number;
	admin_login_url: string;
	admin_username: string;
	hosting_login_url: string;
	hosting_username: string;
	vps_login_url: string;
	vps_username: string;
	ssh_host: string;
	ssh_port: number;
	ssh_username: string;
	sale_manager_name: string;
	status: string;
	notes: string;
	created_at: string;
}

interface Props {
	websites: Website[];
	loading: boolean;
	onSelect: (website: Website) => void;
	selectedId?: number;
}

function statusMeta(status: string) {
	const normalized = (status || '').toLowerCase();

	switch (normalized) {
		case 'active':
			return {
				label: 'Hoạt động',
				badge: 'bg-green-50 text-green-700 border-green-200',
				icon: ShieldCheck,
			};
		case 'inactive':
			return {
				label: 'Không hoạt động',
				badge: 'bg-gray-50 text-gray-700 border-gray-200',
				icon: ShieldOff,
			};
		case 'suspended':
			return {
				label: 'Tạm ngưng',
				badge: 'bg-red-50 text-red-700 border-red-200',
				icon: AlertTriangle,
			};
		default:
			return {
				label: status || '—',
				badge: 'bg-slate-50 text-slate-700 border-slate-200',
				icon: Globe,
			};
	}
}

function storageColor(percentage: number, threshold: number) {
	if (percentage >= threshold) return 'bg-red-500';
	if (percentage >= threshold * 0.8) return 'bg-orange-500';
	return 'bg-green-500';
}

function percentTextColor(percentage: number, threshold: number) {
	if (percentage >= threshold) return 'text-red-700';
	if (percentage >= threshold * 0.8) return 'text-orange-700';
	return 'text-green-700';
}

function clampPercent(value: number) {
	const safe = Number.isFinite(value) ? value : 0;
	return Math.min(Math.max(safe, 0), 100);
}

function SkeletonRow() {
	return (
		<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="h-4 w-48 rounded bg-gray-200/80 animate-pulse" />
					<div className="mt-2 h-3 w-72 rounded bg-gray-200/60 animate-pulse" />
					<div className="mt-3 flex gap-2">
						<div className="h-5 w-24 rounded-full bg-gray-200/70 animate-pulse" />
						<div className="h-5 w-28 rounded-full bg-gray-200/70 animate-pulse" />
					</div>
				</div>
				<div className="h-9 w-9 rounded-xl bg-gray-200/70 animate-pulse" />
			</div>
			<div className="mt-4 h-2 w-full rounded-full bg-gray-200/70 animate-pulse" />
		</div>
	);
}

export default function WebsiteList({ websites, loading, onSelect, selectedId }: Props) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 gap-4">
				{Array.from({ length: 8 }).map((_, idx) => (
					<SkeletonRow key={idx} />
				))}
			</div>
		);
	}

	if (!websites || websites.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
					<Globe className="h-7 w-7 text-blue-600" />
				</div>
				<h3 className="mt-4 text-lg font-semibold text-gray-900">Chưa có website phù hợp</h3>
				<p className="mt-1 text-sm text-gray-600">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Mobile cards */}
			<div className="grid grid-cols-1 gap-4 sm:hidden">
				{websites.map((w) => {
					const meta = statusMeta(w.status);
					const StatusIcon = meta.icon;

					return (
						<button
							key={w.id}
							type="button"
							onClick={() => onSelect(w)}
							className={`text-left rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${selectedId === w.id ? 'border-blue-300 ring-2 ring-blue-500/15' : 'border-gray-200'} `}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 min-w-0">
										<div className="min-w-0">
											<p className="font-semibold text-gray-900 truncate">{w.name}</p>
											<p className="text-xs text-gray-600 truncate">{w.url}</p>
										</div>
									</div>
									<div className="mt-3 flex flex-wrap gap-2">
										<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.badge}`}>
											<StatusIcon className="h-4 w-4" />
											{meta.label}
										</span>
										{w.project_code && (
											<span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
												{w.project_code}
											</span>
										)}
									</div>
								</div>
								<a
									href={w.url}
									target="_blank"
									rel="noreferrer"
									onClick={(e) => e.stopPropagation()}
									className="p-2.5 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all"
									title="Mở website"
								>
									<ExternalLink className="h-5 w-5 text-gray-600" />
								</a>
							</div>

							<div className="mt-4">
								<div className="flex items-center justify-between text-xs text-gray-600">
									<span className="inline-flex items-center gap-1.5">
										<HardDrive className="h-4 w-4" />
										Dung lượng
									</span>
									<span className={`font-semibold ${percentTextColor(w.storage_percentage, w.storage_alert_threshold)}`}>
										{w.storage_percentage}%
									</span>
								</div>
								<div className="mt-2 h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
									<div
										className={`h-full ${storageColor(w.storage_percentage, w.storage_alert_threshold)} transition-all`}
										style={{ width: `${clampPercent(w.storage_percentage)}%` }}
									/>
								</div>
								<div className="mt-2 text-xs text-gray-600">
									{w.storage_used} / {w.storage_limit} MB
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{/* Desktop table */}
			<div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/20">
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-gray-700">Danh sách website</p>
						<p className="text-xs text-gray-500">{websites.length} mục</p>
					</div>
				</div>

				<div className="divide-y divide-gray-200">
					{websites.map((w) => {
						const meta = statusMeta(w.status);
						const StatusIcon = meta.icon;
						const isSelected = selectedId === w.id;

						return (
							<div
								key={w.id}
								role="button"
								tabIndex={0}
								onClick={() => onSelect(w)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') onSelect(w);
								}}
								className={`px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
							>
								<div className="col-span-5 min-w-0">
									<div className="flex items-start gap-3 min-w-0">
										<div className={`mt-0.5 h-10 w-10 rounded-2xl flex items-center justify-center border ${isSelected ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
											<Globe className={`h-5 w-5 ${isSelected ? 'text-blue-700' : 'text-gray-700'}`} />
										</div>
										<div className="min-w-0">
											<p className="font-semibold text-gray-900 truncate">{w.name}</p>
											<div className="flex items-center gap-2 min-w-0">
												<a
													href={w.url}
													target="_blank"
													rel="noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="text-xs text-blue-700 hover:text-blue-900 hover:underline truncate"
													title={w.url}
												>
													{w.url}
												</a>
												<ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
											</div>
										</div>
									</div>
								</div>

								<div className="col-span-2">
									<p className="text-xs text-gray-500">Mã dự án</p>
									<p className="text-sm font-semibold text-gray-900 truncate">{w.project_code || '—'}</p>
								</div>

								<div className="col-span-2">
									<p className="text-xs text-gray-500">Quản lý</p>
									<p className="text-sm font-semibold text-gray-900 truncate">{w.manager_name || '—'}</p>
								</div>

								<div className="col-span-2">
									<div className="flex items-center justify-between">
										<span className="text-xs text-gray-500">Dung lượng</span>
										<span className={`text-xs font-bold ${percentTextColor(w.storage_percentage, w.storage_alert_threshold)}`}>
											{w.storage_percentage}%
										</span>
									</div>
									<div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
										<div
											className={`h-full ${storageColor(w.storage_percentage, w.storage_alert_threshold)} transition-all`}
											style={{ width: `${clampPercent(w.storage_percentage)}%` }}
										/>
									</div>
									<div className="mt-1 text-[11px] text-gray-500">
										{w.storage_used} / {w.storage_limit} MB
									</div>
								</div>

								<div className="col-span-1 flex justify-end">
									<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.badge}`}>
										<StatusIcon className="h-4 w-4" />
										{meta.label}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

