import { useState, useRef, useEffect } from 'react';
import { formatDate } from '../../utils/formatDate';
import { useNavigate } from 'react-router-dom';
import { clearToken, getTokenUser, normalizeRole } from '../../utils/auth';
import type { CanonicalRole } from '../../utils/auth';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Building2,
  X
} from 'lucide-react';

interface HeaderProps {
  userName: string;
}

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
  };
  return roleMap[role] || 'Người dùng';
};

// Avatar Component
const Avatar = ({ name }: { name: string }) => {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white`}>
      {initial}
    </div>
  );
};

export default function Header({ userName }: HeaderProps) {
  const navigate = useNavigate();
  const formattedDate = formatDate(new Date());
  const userRole = normalizeRole(getTokenUser()?.role);
  const formattedUserRole = formatRole(userRole);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Dự án mới được giao', message: 'Bạn được giao dự án "Website ABC"', time: '5 phút trước', unread: true },
    { id: 2, title: 'Deadline sắp đến', message: 'Dự án "App XYZ" sẽ đến hạn trong 2 ngày', time: '1 giờ trước', unread: true },
    { id: 3, title: 'Thanh toán hoàn tất', message: 'Khách hàng đã thanh toán đợt 2', time: '3 giờ trước', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200 shadow-sm backdrop-blur-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3 shrink-0">
            {/* <img src="/logo.png" alt="ODOTECH Logo" className="h-10 w-auto object-contain" /> */}
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">ODOTECH</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Management System</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className={`relative transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm dự án, khách hàng..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Date Display */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 font-medium">{formattedDate}</div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all hover:scale-105 active:scale-95"
                aria-label="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Thông báo</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.unread ? 'bg-teal-50/30' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {notif.unread && (
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 text-center">
                    <button className="text-xs text-teal-600 hover:text-teal-700 font-semibold">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all hover:shadow-md group"
              >
                <Avatar name={userName} />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
                  <p className="text-xs text-gray-500">{formattedUserRole}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-teal-50 to-blue-50">
                    <div className="flex items-center gap-3">
                      <Avatar name={userName} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-600">{formattedUserRole}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left group">
                      <User size={18} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Hồ sơ cá nhân</span>
                    </button>
                    <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left group">
                      <Settings size={18} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Cài đặt</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors text-left group"
                    >
                      <LogOut size={18} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                      <span className="text-sm text-gray-700 group-hover:text-red-600 font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

