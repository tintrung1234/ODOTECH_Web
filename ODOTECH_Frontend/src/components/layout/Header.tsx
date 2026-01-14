/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatDate';
import { useNavigate } from 'react-router-dom';
import { logout, getTokenUser, normalizeRole } from '../../utils/auth';
import type { CanonicalRole } from '../../utils/auth';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  X,
  Briefcase,
  Users,
  Globe,
  Loader2,
  Menu
} from 'lucide-react';
import { ImCtrl } from 'react-icons/im';

interface HeaderProps {
  userName: string;
  onToggleSidebar?: () => void;
}

interface SearchResult {
  id: number;
  type: 'project' | 'customer' | 'website';
  title: string;
  subtitle?: string;
  metadata?: string;
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
    customer: ''
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

import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from '../../services/notificationService';

// ... (rest of imports)

// ...

export default function Header({ userName, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const formattedDate = formatDate(new Date());
  const [userRole, setUserRole] = useState<CanonicalRole>('unknown');
  const formattedUserRole = formatRole(userRole);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = useCallback(async () => {
    const list = await getNotifications(20, 0);
    setNotifications(list);
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    fetchNotifs();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    // Navigate based on type/data if needed
    // if (notif.type === 'project') navigate(...)
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch user role on mount
  useEffect(() => {
    (async () => {
      const user = await getTokenUser();
      if (user?.role) {
        setUserRole(normalizeRole(user.role));
      }
    })();
  }, []);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const [projectsRes, customersRes, websitesRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/projects?q=${encodeURIComponent(query)}&limit=5`, {
          credentials: 'include',
        }),
        fetch(`${apiUrl}/api/customers?q=${encodeURIComponent(query)}&limit=5`, {
          credentials: 'include',
        }),
        fetch(`${apiUrl}/api/websites?search=${encodeURIComponent(query)}&limit=5`, {
          credentials: 'include',
        }),
      ]);

      const results: SearchResult[] = [];

      // Process projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
        const data = await projectsRes.value.json();
        const projects = Array.isArray(data) ? data : (data.items || []);
        projects.forEach((p: any) => {
          results.push({
            id: p.id,
            type: 'project',
            title: p.name || p.project_code,
            subtitle: p.project_code,
            metadata: p.status,
          });
        });
      }

      // Process customers
      if (customersRes.status === 'fulfilled' && customersRes.value.ok) {
        const data = await customersRes.value.json();
        const customers = Array.isArray(data) ? data : (data.customers || []);
        customers.forEach((c: any) => {
          results.push({
            id: c.id,
            type: 'customer',
            title: c.name,
            subtitle: c.email || c.phone,
            metadata: c.company,
          });
        });
      }

      // Process websites
      if (websitesRes.status === 'fulfilled' && websitesRes.value.ok) {
        const data = await websitesRes.value.json();
        const websites = Array.isArray(data) ? data : (data.websites || []);
        websites.forEach((w: any) => {
          results.push({
            id: w.id,
            type: 'website',
            title: w.name,
            subtitle: w.url,
            metadata: w.status,
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [apiUrl]);

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle search result navigation
  const handleResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchResults([]);

    switch (result.type) {
      case 'project':
        navigate(`/projects`); // Adjust route as needed
        break;
      case 'customer':
        navigate(`/customers`); // Adjust route as needed
        break;
      case 'website':
        navigate(`/websites`); // Adjust route as needed
        break;
    }
  };

  // Handle keyboard navigation in search results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(searchResults[selectedIndex]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedIndex(-1);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Get icon for result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return <Briefcase className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return 'Dự án';
      case 'customer':
        return 'Khách hàng';
      case 'website':
        return 'Website';
    }
  };

  // Group results by type
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Mock notifications removed in favor of real data

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm backdrop-blur-sm transition-colors duration-300">
      <div className="px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo Section */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">ODOTECH</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Management System</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm dự án, khách hàng, website..."
                className="w-full pl-10 pr-20 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={clearSearch}
                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-200 rounded text-xs text-gray-500">
                  <ImCtrl size={10} />
                  <span>K</span>
                </div>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                  {searchResults.length === 0 && !isSearching && (
                    <div className="p-8 text-center">
                      <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy kết quả</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  )}

                  {Object.entries(groupedResults).map(([type, results]) => (
                    <div key={type} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {getTypeLabel(type as SearchResult['type'])}
                      </div>
                      {results.map((result) => {
                        const globalIndex = searchResults.indexOf(result);
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${globalIndex === selectedIndex ? 'bg-teal-50 dark:bg-teal-900/30' : ''
                              }`}
                          >
                            <div className={`mt-0.5 p-2 rounded-lg ${result.type === 'project' ? 'bg-blue-100 text-blue-600' :
                              result.type === 'customer' ? 'bg-purple-100 text-purple-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                              {getResultIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                              )}
                              {result.metadata && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                                  {result.metadata}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Date Display */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg transition-colors duration-300">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formattedDate}</div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-all hover:scale-105 active:scale-95"
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
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white">Thông báo</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                        disabled={unreadCount === 0}
                      >
                        Đọc tất cả
                      </button>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">Không có thông báo mới</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${!notif.is_read ? 'bg-teal-50/30 dark:bg-teal-900/20' : ''
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.is_read && (
                              <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{notif.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-900 text-center transition-colors">
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all hover:shadow-md group"
              >
                <Avatar name={userName} />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formattedUserRole}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/30 dark:to-blue-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={userName} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formattedUserRole}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left group">
                      <User size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Hồ sơ cá nhân</span>
                    </button>
                    <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left group">
                      <Settings size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Cài đặt</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700 py-2 transition-colors">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                    >
                      <LogOut size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 font-medium">Đăng xuất</span>
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

