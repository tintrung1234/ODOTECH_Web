import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketList from '../components/tickets/TicketList';
import type { TicketFilters } from '../interface/ticket.interface';
import { getTokenUser, normalizeRole } from '../utils/auth';

const Tickets: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'internal' | 'my'>('all');
    const [filters, setFilters] = useState<TicketFilters>({});
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Load user role on mount
        getTokenUser().then((user) => {
            setUserRole(normalizeRole(user?.role));
        });
    }, []);

    const handleTabChange = (tab: 'all' | 'customer' | 'internal' | 'my') => {
        setActiveTab(tab);

        switch (tab) {
            case 'customer':
                setFilters({ type: 'customer' });
                break;
            case 'internal':
                setFilters({ type: 'internal' });
                break;
            case 'my':
                // My tickets will be handled by TicketList component
                setFilters({});
                break;
            default:
                setFilters({});
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý Tickets
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý tickets từ khách hàng và nội bộ
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/tickets/new')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo Ticket
                    </button>
                </div>
            </div>

            {/* Tabs - Hide for customer role */}
            {userRole !== 'customer' && (
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => handleTabChange('customer')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'customer'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Tickets Khách hàng
                        </button>
                        <button
                            onClick={() => handleTabChange('internal')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'internal'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Tickets Nội bộ
                        </button>
                        <button
                            onClick={() => handleTabChange('my')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Tickets của tôi
                        </button>
                    </nav>
                </div>
            )}

            {/* Ticket List */}
            <TicketList filters={filters} activeTab={activeTab} />
        </div>
    );
};

export default Tickets;
