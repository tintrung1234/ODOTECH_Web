import { useState, useEffect } from 'react';
import { History, Key, User, Globe, Clock } from 'lucide-react';

interface AccessLog {
    id: number;
    user_id: number;
    user_name: string;
    website_id: number;
    website_name: string;
    credential_type: string;
    accessed_at: string;
    ip_address: string;
    user_agent: string;
}

interface Props {
    websiteId: number;
}

export default function AccessHistoryPanel({ websiteId }: Props) {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchAccessHistory();
    }, [websiteId]);

    const fetchAccessHistory = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/websites/access-history/list?website_id=${websiteId}`, {
                credentials: 'include', // Send cookies
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.history || []);
            }
        } catch (error) {
            console.error('Error fetching access history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCredentialTypeLabel = (type: string) => {
        switch (type) {
            case 'admin':
                return 'Admin';
            case 'hosting':
                return 'Hosting';
            case 'vps':
                return 'VPS';
            case 'ssh':
                return 'SSH';
            case 'ssh_key':
                return 'SSH Key';
            default:
                return type;
        }
    };

    const getCredentialTypeColor = (type: string) => {
        switch (type) {
            case 'admin':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'hosting':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'vps':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'ssh':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có lịch sử truy cập</p>
                <p className="text-sm text-gray-400 mt-1">Chưa có ai truy cập thông tin đăng nhập của website này</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Key className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{log.user_name}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCredentialTypeColor(
                                            log.credential_type
                                        )}`}
                                    >
                                        {getCredentialTypeLabel(log.credential_type)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(log.accessed_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {log.ip_address && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Globe className="w-4 h-4" />
                                <span className="font-mono text-xs">{log.ip_address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="text-xs">ID: {log.user_id}</span>
                        </div>
                    </div>

                    {log.user_agent && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-mono truncate" title={log.user_agent}>
                                {log.user_agent}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
