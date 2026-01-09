import { ExternalLink, AlertCircle, HardDrive } from 'lucide-react';

interface Website {
    id: number;
    name: string;
    url: string;
    project_code: string;
    manager_name: string;
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

export default function WebsiteList({ websites, loading, onSelect, selectedId }: Props) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'suspended':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Hoạt động';
            case 'inactive':
                return 'Không hoạt động';
            case 'suspended':
                return 'Tạm ngưng';
            default:
                return status;
        }
    };

    const getStorageColor = (percentage: number, threshold: number) => {
        if (percentage >= threshold) return 'bg-red-500';
        if (percentage >= threshold * 0.8) return 'bg-orange-500';
        return 'bg-green-500';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (websites.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                <div className="text-center">
                    <p className="text-gray-500">Không tìm thấy website nào</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Website
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Mã dự án
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Hosting
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Dung lượng
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Quản lý
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Trạng thái
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {websites.map((website) => (
                            <tr
                                key={website.id}
                                onClick={() => onSelect(website)}
                                className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedId === website.id ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900 truncate">{website.name}</p>
                                                {website.storage_percentage >= website.storage_alert_threshold && (
                                                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <a
                                                href={website.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 group"
                                            >
                                                <span className="truncate">{website.url}</span>
                                                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700">{website.project_code || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">{website.hosting_package || '-'}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{website.hosting_provider || '-'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700">
                                                {website.storage_used}MB / {website.storage_limit}MB
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${getStorageColor(
                                                    website.storage_percentage,
                                                    website.storage_alert_threshold
                                                )}`}
                                                style={{ width: `${Math.min(website.storage_percentage, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">{website.storage_percentage}% đã dùng</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <p className="text-gray-700">{website.manager_name || '-'}</p>
                                        {website.sale_manager_name && (
                                            <p className="text-gray-500 text-xs mt-0.5">Sale: {website.sale_manager_name}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                            website.status
                                        )}`}
                                    >
                                        {getStatusText(website.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
