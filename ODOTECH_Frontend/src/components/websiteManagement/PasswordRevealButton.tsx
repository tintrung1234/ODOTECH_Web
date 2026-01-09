import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react';

interface Props {
    websiteId: number;
    websiteName: string;
    credentialType: 'admin' | 'hosting' | 'vps' | 'ssh' | 'ssh_key';
}

export default function PasswordRevealButton({ websiteId, websiteName, credentialType }: Props) {
    const [revealed, setRevealed] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [copied, setCopied] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleReveal = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/websites/${websiteId}/reveal-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send cookies
                body: JSON.stringify({ credential_type: credentialType }),
            });

            if (response.ok) {
                const data = await response.json();
                setPassword(data.password);
                setRevealed(true);
                setShowConfirm(false);

                // Auto-hide after 30 seconds
                setTimeout(() => {
                    setRevealed(false);
                    setPassword('');
                }, 30000);
            } else {
                alert('Không thể lấy mật khẩu. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error revealing password:', error);
            alert('Lỗi khi lấy mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getCredentialLabel = () => {
        switch (credentialType) {
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
                return '';
        }
    };

    if (revealed && password) {
        return (
            <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm">
                    {password}
                </div>
                <button
                    onClick={handleCopy}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                    title="Copy"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => {
                        setRevealed(false);
                        setPassword('');
                    }}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                    title="Hide"
                >
                    <EyeOff className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="mt-1 flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
            >
                <Eye className="w-4 h-4" />
                {loading ? 'Đang tải...' : 'Hiển thị mật khẩu'}
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">Xác nhận truy cập mật khẩu</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    Bạn đang yêu cầu xem mật khẩu <span className="font-semibold">{getCredentialLabel()}</span> của
                                    website <span className="font-semibold">{websiteName}</span>.
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ Hành động này sẽ được ghi lại và thông báo đến quản lý qua email/telegram.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReveal}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
