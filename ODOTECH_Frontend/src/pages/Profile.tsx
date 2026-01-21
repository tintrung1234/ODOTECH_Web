import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword, type UserProfile, type UpdateProfileData, type ChangePasswordData } from '../services/profileService';
import { formatDate } from '../utils/formatDate';
import { normalizeRole } from '../utils/auth';
import type { CanonicalRole } from '../utils/auth';
import { User, Mail, Phone, Briefcase, Calendar, Shield, Award, Save, X, Edit2, Key, Eye, EyeOff } from 'lucide-react';

// Format role for display
const formatRole = (role: CanonicalRole): string => {
    const roleMap: Record<CanonicalRole, string> = {
        admin: 'Quản trị viên',
        sale: 'Nhân viên kinh doanh',
        sales_manager: 'Quản lý kinh doanh',
        head_sales: 'Trưởng phòng kinh doanh',
        dev: 'Lập trình viên',
        dev_manager: 'Quản lý kỹ thuật',
        head_tech: 'Trưởng phòng kỹ thuật',
        support: 'Hỗ trợ',
        unknown: 'Người dùng',
        customer: 'Khách hàng'
    };
    return roleMap[role] || 'Người dùng';
};

export default function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [formData, setFormData] = useState<UpdateProfileData>({
        name: '',
        email: '',
        phone: '',
        username: '',
    });

    const [passwordData, setPasswordData] = useState<ChangePasswordData>({
        newPassword: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProfile();
            setProfile(data);
            setFormData({
                name: data.name,
                email: data.email,
                phone: data.phone || '',
                username: data.username,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Tên không được để trống');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email không được để trống');
            return;
        }
        if (!formData.username.trim()) {
            setError('Username không được để trống');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            const updated = await updateProfile(formData);
            setProfile(updated);
            setIsEditing(false);
            setSuccess('Cập nhật thông tin thành công!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordData.newPassword) {
            setError('Vui lòng nhập mật khẩu mới');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setChangingPassword(true);
            setError(null);
            setSuccess(null);
            await changePassword(passwordData);
            setPasswordData({ newPassword: '' });
            setShowPasswordSection(false);
            setSuccess('Đổi mật khẩu thành công!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                name: profile.name,
                email: profile.email,
                phone: profile.phone || '',
                username: profile.username,
            });
        }
        setIsEditing(false);
        setError(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Không thể tải thông tin hồ sơ'}</p>
                    <button
                        onClick={loadProfile}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const formattedRole = formatRole(normalizeRole(profile.role_system));

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hồ sơ cá nhân</h1>
                    <p className="text-gray-600 dark:text-gray-400">Quản lý thông tin cá nhân của bạn</p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700 mb-6">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-teal-500 to-blue-500 px-8 py-12 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold mb-2">{profile.name}</h2>
                                <p className="text-white/90 text-lg">{formattedRole}</p>
                                <p className="text-white/75 text-sm mt-1">@{profile.username}</p>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all hover:scale-105 flex items-center gap-2 border border-white/30"
                                >
                                    <Edit2 size={18} />
                                    <span className="font-medium">Chỉnh sửa</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Username Field */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <User size={16} className="text-teal-600 dark:text-teal-400" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    placeholder="Nhập username"
                                />
                            </div>

                            {/* Name Field */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <User size={16} className="text-teal-600 dark:text-teal-400" />
                                    Họ và tên
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Mail size={16} className="text-teal-600 dark:text-teal-400" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    placeholder="Nhập email"
                                />
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Phone size={16} className="text-teal-600 dark:text-teal-400" />
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            {/* Position Field (Read-only) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Briefcase size={16} className="text-gray-400" />
                                    Chức vụ
                                </label>
                                <input
                                    type="text"
                                    value={profile.position || 'Chưa cập nhật'}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                />
                            </div>

                            {/* Join Date (Read-only) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Calendar size={16} className="text-gray-400" />
                                    Ngày vào làm
                                </label>
                                <input
                                    type="text"
                                    value={profile.join_date ? formatDate(new Date(profile.join_date)) : 'Chưa cập nhật'}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                />
                            </div>

                            {/* Status (Read-only) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Shield size={16} className="text-gray-400" />
                                    Trạng thái
                                </label>
                                <div className="px-4 py-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profile.status === 'active'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                        }`}>
                                        {profile.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                                    </span>
                                </div>
                            </div>

                            {/* Points (Read-only) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <Award size={16} className="text-gray-400" />
                                    Điểm
                                </label>
                                <input
                                    type="text"
                                    value={profile.point || 0}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Lưu thay đổi</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <X size={18} />
                                    <span>Hủy</span>
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Password Change Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <button
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                            className="w-full flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                    <Key size={20} className="text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Đổi mật khẩu</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Cập nhật mật khẩu của bạn</p>
                                </div>
                            </div>
                            <div className={`transform transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                    </div>

                    {showPasswordSection && (
                        <form onSubmit={handlePasswordChange} className="p-6">
                            <div className="space-y-4">


                                {/* New Password */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <Key size={16} className="text-teal-600 dark:text-teal-400" />
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mật khẩu phải có ít nhất 6 ký tự</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {changingPassword ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang đổi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Key size={18} />
                                            <span>Đổi mật khẩu</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPasswordData({ newPassword: '' });
                                        setShowPasswordSection(false);
                                        setError(null);
                                    }}
                                    disabled={changingPassword}
                                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <X size={18} />
                                    <span>Hủy</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Tài khoản được tạo: {formatDate(new Date(profile.created_at))}</p>
                    {profile.last_login_at && (
                        <p className="mt-1">Đăng nhập lần cuối: {formatDate(new Date(profile.last_login_at))}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
