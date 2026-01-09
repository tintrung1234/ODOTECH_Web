import { useState, useEffect } from 'react';
import { Bug, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';

interface VirusLog {
    id: number;
    website_id: number;
    website_name: string;
    detected_at: string;
    threat_type: string;
    severity: string;
    affected_files: string[];
    threat_description: string;
    scanner_name: string;
    action_taken: string;
    status: string;
    resolved_at: string;
    resolution_notes: string;
}

interface Props {
    websiteId: number;
}

export default function VirusLogPanel({ websiteId }: Props) {
    const [logs, setLogs] = useState<VirusLog[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchVirusLogs();
    }, [websiteId]);

    const fetchVirusLogs = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/virus-logs?website_id=${websiteId}`, {
                credentials: 'include', // Send cookies
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching virus logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'in_progress':
                return <Clock className="w-5 h-5 text-blue-600" />;
            case 'assigned':
                return <Shield className="w-5 h-5 text-purple-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-orange-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'detected':
                return 'Phát hiện';
            case 'assigned':
                return 'Đã phân công';
            case 'in_progress':
                return 'Đang xử lý';
            case 'resolved':
                return 'Đã giải quyết';
            case 'false_positive':
                return 'Cảnh báo nhầm';
            default:
                return status;
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
                <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không có log diệt virus nào</p>
                <p className="text-sm text-gray-400 mt-1">Website này chưa có phát hiện mối đe dọa nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <div key={log.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                            {getStatusIcon(log.status)}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">{log.threat_type}</h4>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                                            log.severity
                                        )}`}
                                    >
                                        {log.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{log.threat_description}</p>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(log.detected_at)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Scanner:</span>
                            <span className="ml-2 text-gray-900">{log.scanner_name || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Trạng thái:</span>
                            <span className="ml-2 text-gray-900">{getStatusText(log.status)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Hành động:</span>
                            <span className="ml-2 text-gray-900">{log.action_taken || '-'}</span>
                        </div>
                        {log.resolved_at && (
                            <div>
                                <span className="text-gray-600">Giải quyết lúc:</span>
                                <span className="ml-2 text-gray-900">{formatDate(log.resolved_at)}</span>
                            </div>
                        )}
                    </div>

                    {log.affected_files && log.affected_files.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">File bị ảnh hưởng:</p>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                {log.affected_files.map((file, index) => (
                                    <p key={index} className="text-xs font-mono text-gray-600">
                                        {file}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {log.resolution_notes && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-900 mb-1">Ghi chú giải quyết:</p>
                            <p className="text-sm text-green-800">{log.resolution_notes}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
