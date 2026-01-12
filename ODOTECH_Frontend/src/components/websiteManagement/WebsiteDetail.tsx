import { useState } from 'react';
import { X, Info, Key, Shield, History, Bug } from 'lucide-react';
import PasswordRevealButton from './PasswordRevealButton.tsx';
import VirusLogPanel from './VirusLogPanel.tsx';
import AccessHistoryPanel from './AccessHistoryPanel.tsx';

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
    website: Website;
    onClose: () => void;
    onUpdate: () => void;
    onEdit: () => void;
}

export default function WebsiteDetail({ website, onClose, onEdit }: Props) {
    const [activeTab, setActiveTab] = useState<'info' | 'credentials' | 'virus-logs' | 'access-history'>('info');

    const tabs = [
        { id: 'info' as const, label: 'Thông tin', icon: Info },
        { id: 'credentials' as const, label: 'Thông tin đăng nhập', icon: Key },
        { id: 'virus-logs' as const, label: 'Log diệt virus', icon: Bug },
        { id: 'access-history' as const, label: 'Lịch sử truy cập', icon: History },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative flex items-center gap-4 text-white flex-1 min-w-0">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold truncate tracking-tight">{website.name}</h2>
                            <a
                                href={website.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-100 hover:text-white mt-1 flex items-center gap-1.5 w-fit group"
                            >
                                <span className="truncate">{website.url}</span>
                                <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                        <button
                            onClick={onEdit}
                            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-semibold transition-all border border-white/20 hover:border-white/30 shadow-lg"
                        >
                            Chỉnh sửa
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-white/20 rounded-xl text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/30 px-8">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-5 py-4 font-semibold text-sm transition-all relative group ${activeTab === tab.id
                                        ? 'text-blue-600 bg-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50/50 to-white">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2.5 text-base">
                                    <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                        <Info className="w-5 h-5 text-blue-600" />
                                    </div>
                                    Thông tin cơ bản
                                </h3>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="bg-gray-50/50 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên website</label>
                                        <p className="text-gray-900 mt-2 font-medium">{website.name}</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã dự án</label>
                                        <p className="text-gray-900 mt-2 font-medium">{website.project_code || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người quản lý (Dev)</label>
                                        <p className="text-gray-900 mt-2 font-medium">{website.manager_name || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-xl">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sale quản lý</label>
                                        <p className="text-gray-900 mt-2 font-medium">{website.sale_manager_name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hosting Info */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2.5 text-base">
                                    <div className="p-2 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                        </svg>
                                    </div>
                                    Thông tin Hosting
                                </h3>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Gói hosting</label>
                                        <p className="text-gray-900 mt-1">{website.hosting_package || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Nhà cung cấp</label>
                                        <p className="text-gray-900 mt-1">{website.hosting_provider || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Storage Info */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2.5 text-base">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                        </svg>
                                    </div>
                                    Dung lượng
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-white p-4 rounded-xl">
                                        <span className="text-sm font-medium text-gray-600">Đã sử dụng</span>
                                        <span className="font-bold text-gray-900 text-lg">{website.storage_used} MB</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-4 rounded-xl">
                                        <span className="text-sm font-medium text-gray-600">Giới hạn</span>
                                        <span className="font-bold text-gray-900 text-lg">{website.storage_limit} MB</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all ${website.storage_percentage >= website.storage_alert_threshold
                                                ? 'bg-red-500'
                                                : website.storage_percentage >= website.storage_alert_threshold * 0.8
                                                    ? 'bg-orange-500'
                                                    : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(website.storage_percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-white p-4 rounded-xl">
                                        <span className="font-medium text-gray-600">Tỷ lệ sử dụng</span>
                                        <span className={`font-bold text-lg ${website.storage_percentage >= website.storage_alert_threshold
                                            ? 'text-red-600'
                                            : website.storage_percentage >= website.storage_alert_threshold * 0.8
                                                ? 'text-orange-600'
                                                : 'text-green-600'
                                            }`}>{website.storage_percentage}%</span>
                                    </div>
                                    {website.storage_percentage >= website.storage_alert_threshold && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                                            <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-orange-800">
                                                <p className="font-medium">Cảnh báo dung lượng</p>
                                                <p className="text-orange-700 mt-1">
                                                    Dung lượng đã vượt ngưỡng cảnh báo {website.storage_alert_threshold}%
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {website.notes && (
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{website.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'credentials' && (
                        <div className="space-y-6">
                            {/* Admin Credentials */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Key className="w-5 h-5 text-blue-600" />
                                    Thông tin đăng nhập Admin
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">URL đăng nhập</label>
                                        <p className="text-gray-900 mt-1">{website.admin_login_url || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Username</label>
                                        <p className="text-gray-900 mt-1">{website.admin_username || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Password</label>
                                        <PasswordRevealButton
                                            websiteId={website.id}
                                            websiteName={website.name}
                                            credentialType="admin"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hosting Credentials */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Thông tin đăng nhập Hosting</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">URL đăng nhập</label>
                                        <p className="text-gray-900 mt-1">{website.hosting_login_url || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Username</label>
                                        <p className="text-gray-900 mt-1">{website.hosting_username || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Password</label>
                                        <PasswordRevealButton
                                            websiteId={website.id}
                                            websiteName={website.name}
                                            credentialType="hosting"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* VPS Credentials */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Thông tin đăng nhập VPS</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">URL đăng nhập</label>
                                        <p className="text-gray-900 mt-1">{website.vps_login_url || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Username</label>
                                        <p className="text-gray-900 mt-1">{website.vps_username || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Password</label>
                                        <PasswordRevealButton
                                            websiteId={website.id}
                                            websiteName={website.name}
                                            credentialType="vps"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SSH Credentials */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Thông tin SSH</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">SSH Host</label>
                                        <p className="text-gray-900 mt-1">{website.ssh_host || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">SSH Port</label>
                                        <p className="text-gray-900 mt-1">{website.ssh_port || 22}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">SSH Username</label>
                                        <p className="text-gray-900 mt-1">{website.ssh_username || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">SSH Password</label>
                                        <PasswordRevealButton
                                            websiteId={website.id}
                                            websiteName={website.name}
                                            credentialType="ssh"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'virus-logs' && <VirusLogPanel websiteId={website.id} />}

                    {activeTab === 'access-history' && <AccessHistoryPanel websiteId={website.id} />}
                </div>
            </div>
        </div >
    );
}
