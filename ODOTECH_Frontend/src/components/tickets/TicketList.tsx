import React, { useState, useEffect } from 'react';
import type { Ticket, TicketFilters } from '../../interface/ticket.interface';
import { ticketService } from '../../services/ticketService';
import TicketCard from './TicketCard';
import { getTokenUser, normalizeRole } from '../../utils/auth';

interface TicketListProps {
    filters?: TicketFilters;
    showFilters?: boolean;
    activeTab?: 'all' | 'customer' | 'internal' | 'my';
}

const TicketList: React.FC<TicketListProps> = ({ filters: externalFilters, showFilters = true, activeTab = 'all' }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TicketFilters>(externalFilters || {});
    const [userRole, setUserRole] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        // Load user role on mount
        getTokenUser().then((user) => {
            setUserRole(normalizeRole(user?.role));
        });
    }, []);

    // Debounce search input - wait 500ms after user stops typing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm || undefined }));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        // Sync filter type handling with activeTab
        // This ensures the correct filter is applied when switching tabs
        if (activeTab === 'customer') {
            setFilters(prev => ({ ...prev, type: 'customer' }));
        } else if (activeTab === 'internal') {
            setFilters(prev => ({ ...prev, type: 'internal' }));
        } else if (activeTab === 'all') {
            setFilters(prev => ({ ...prev, type: undefined }));
        }
    }, [activeTab]);

    useEffect(() => {
        if (userRole !== null) {
            loadTickets();
        }
    }, [filters, activeTab, userRole]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setError(null);

            // Customer role users can ONLY see their own tickets
            if (userRole === 'customer') {
                // Fetch customer profile to get real customer_id
                const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:5000';
                try {
                    const res = await fetch(`${apiBaseUrl}/api/customer-portal/profile`, { credentials: 'include' });
                    if (res.ok) {
                        const profile = await res.json();
                        if (profile && profile.id) {
                            // Use getAllTickets with customer_id filter
                            // This assumes backend allows customers to query /api/tickets with their own customer_id
                            let data = await ticketService.getAllTickets({ customer_id: Number(profile.id) });

                            // Apply client-side filtering for customer users
                            if (filters.status) {
                                data = data.filter(t => t.status === filters.status);
                            }
                            if (filters.priority) {
                                data = data.filter(t => t.priority === filters.priority);
                            }
                            if (filters.search) {
                                const searchLower = filters.search.toLowerCase();
                                data = data.filter(t =>
                                    (t.title && t.title.toLowerCase().includes(searchLower)) ||
                                    (t.ticket_number && t.ticket_number.toLowerCase().includes(searchLower))
                                );
                            }

                            setTickets(data);
                        } else {
                            // Fallback if no profile id
                            let data = await ticketService.getMyTickets();

                            // Apply client-side filtering
                            if (filters.status) {
                                data = data.filter(t => t.status === filters.status);
                            }
                            if (filters.priority) {
                                data = data.filter(t => t.priority === filters.priority);
                            }
                            if (filters.search) {
                                const searchLower = filters.search.toLowerCase();
                                data = data.filter(t =>
                                    (t.title && t.title.toLowerCase().includes(searchLower)) ||
                                    (t.ticket_number && t.ticket_number.toLowerCase().includes(searchLower))
                                );
                            }

                            setTickets(data);
                        }
                    } else {
                        // Fallback if fetch profile fails
                        let data = await ticketService.getMyTickets();

                        // Apply client-side filtering
                        if (filters.status) {
                            data = data.filter(t => t.status === filters.status);
                        }
                        if (filters.priority) {
                            data = data.filter(t => t.priority === filters.priority);
                        }
                        if (filters.search) {
                            const searchLower = filters.search.toLowerCase();
                            data = data.filter(t =>
                                (t.title && t.title.toLowerCase().includes(searchLower)) ||
                                (t.ticket_number && t.ticket_number.toLowerCase().includes(searchLower))
                            );
                        }

                        setTickets(data);
                    }
                } catch (e) {
                    console.error('Error fetching profile for tickets:', e);
                    let data = await ticketService.getMyTickets();

                    // Apply client-side filtering
                    if (filters.status) {
                        data = data.filter(t => t.status === filters.status);
                    }
                    if (filters.priority) {
                        data = data.filter(t => t.priority === filters.priority);
                    }
                    if (filters.search) {
                        const searchLower = filters.search.toLowerCase();
                        data = data.filter(t =>
                            (t.title && t.title.toLowerCase().includes(searchLower)) ||
                            (t.ticket_number && t.ticket_number.toLowerCase().includes(searchLower))
                        );
                    }

                    setTickets(data);
                }
            } else {
                // For other roles
                if (activeTab === 'my') {
                    let data = await ticketService.getMyTickets();

                    // Client-side filtering for My Tickets since API doesn't support params
                    if (filters.type) {
                        data = data.filter(t => t.type === filters.type);
                    }
                    if (filters.status) {
                        data = data.filter(t => t.status === filters.status);
                    }
                    if (filters.priority) {
                        data = data.filter(t => t.priority === filters.priority);
                    }
                    if (filters.search) {
                        const searchLower = filters.search.toLowerCase();
                        data = data.filter(t =>
                            (t.title && t.title.toLowerCase().includes(searchLower)) ||
                            (t.ticket_number && t.ticket_number.toLowerCase().includes(searchLower))
                        );
                    }
                    setTickets(data);
                } else {
                    const data = await ticketService.getAllTickets(filters);
                    setTickets(data);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách tickets');
            console.error('Error loading tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof TicketFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
                <button
                    onClick={loadTickets}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Type filter */}
                        {/* Type filter - Hide for customer since they only see customer tickets */}
                        {userRole !== 'customer' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Loại ticket
                                </label>
                                <select
                                    value={filters.type || ''}
                                    onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="customer">Khách hàng</option>
                                    <option value="internal">Nội bộ</option>
                                </select>
                            </div>
                        )}

                        {/* Status filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Tất cả</option>
                                <option value="new">Mới</option>
                                <option value="in_progress">Đang xử lý</option>
                                <option value="resolved">Đã giải quyết</option>
                                <option value="closed">Đã đóng</option>
                            </select>
                        </div>

                        {/* Priority filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Độ ưu tiên
                            </label>
                            <select
                                value={filters.priority || ''}
                                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Tất cả</option>
                                <option value="low">Thấp</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Mã ticket, tiêu đề..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Clear filters button */}
                    {Object.keys(filters).length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={handleClearFilters}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Ticket count */}
            <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tìm thấy <span className="font-semibold">{tickets.length}</span> tickets
                </p>
            </div>

            {/* Tickets grid */}
            {tickets.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        Không có tickets
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Chưa có ticket nào phù hợp với bộ lọc của bạn.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TicketList;
