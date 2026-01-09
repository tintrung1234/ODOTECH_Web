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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
            <div className="bg-white h-full w-full max-w-3xl shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <Shield className="w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-bold">{website.name}</h2>
                            <p className="text-sm text-blue-100 mt-0.5">{website.url}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors border border-white/10"
                        >
                            Chỉnh sửa
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50 px-6">
                    <div className="flex gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative ${activeTab === tab.id
                                        ? 'text-blue-600 bg-white'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    Thông tin cơ bản
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Tên website</label>
                                        <p className="text-gray-900 mt-1">{website.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Mã dự án</label>
                                        <p className="text-gray-900 mt-1">{website.project_code || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Người quản lý</label>
                                        <p className="text-gray-900 mt-1">{website.manager_name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Sale quản lý</label>
                                        <p className="text-gray-900 mt-1">{website.sale_manager_name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hosting Info */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Thông tin Hosting</h3>
                                <div className="grid grid-cols-2 gap-4">
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
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Dung lượng</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Đã sử dụng</span>
                                        <span className="font-semibold text-gray-900">{website.storage_used} MB</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Giới hạn</span>
                                        <span className="font-semibold text-gray-900">{website.storage_limit} MB</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
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
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Tỷ lệ sử dụng</span>
                                        <span className="font-semibold text-gray-900">{website.storage_percentage}%</span>
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
