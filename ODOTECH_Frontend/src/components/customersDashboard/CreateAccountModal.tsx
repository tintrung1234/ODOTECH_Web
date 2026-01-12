import { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff, UserCog } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // onCreate is now used for both create and update
    onSave: (data: { username: string; password?: string }) => Promise<void>;
    defaultUsername?: string;
    isEdit?: boolean;
}

export default function AccountModal({ isOpen, onClose, onSave, defaultUsername = '', isEdit = false }: Props) {
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername(defaultUsername);
            setPassword('');
            setError('');
            setLoading(false);
        }
    }, [isOpen, defaultUsername]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Vui lòng nhập tên đăng nhập');
            return;
        }

        // Password is required for create, optional for edit
        if (!isEdit && !password.trim()) {
            setError('Vui lòng nhập mật khẩu');
            return;
        }

        if (password && password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await onSave({
                username: username.trim(),
                password: password.trim() || undefined
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {isEdit ? <UserCog size={20} className="text-blue-600" /> : <UserPlus size={20} className="text-blue-600" />}
                        {isEdit ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản khách hàng'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Nhập tên đăng nhập..."
                            autoFocus
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Gợi ý: Sử dụng số điện thoại hoặc mã khách hàng
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10"
                                placeholder={isEdit ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu..."}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
