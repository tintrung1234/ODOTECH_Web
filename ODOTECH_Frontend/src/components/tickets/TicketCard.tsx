import React from 'react';
import type { Ticket } from '../../interface/ticket.interface';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';
import { getTimeAgo, getTypeLabel } from '../../utils/ticketUtils';
import { useNavigate } from 'react-router-dom';

interface TicketCardProps {
    ticket: Ticket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/tickets/${ticket.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 p-4"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                            {ticket.ticket_number}
                        </span>
                        <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                                backgroundColor: ticket.type === 'customer' ? '#3B82F620' : '#8B5CF620',
                                color: ticket.type === 'customer' ? '#3B82F6' : '#8B5CF6',
                            }}
                        >
                            {getTypeLabel(ticket.type)}
                        </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {ticket.title}
                    </h3>
                </div>
                <div className="flex flex-col gap-1 ml-3">
                    <TicketStatusBadge status={ticket.status} />
                    <TicketPriorityBadge priority={ticket.priority} />
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                {ticket.description}
            </p>

            {/* Category */}
            {ticket.category_name && (
                <div className="mb-3">
                    <span className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {ticket.category_name}
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    {ticket.assigned_to_name ? (
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {ticket.assigned_to_name}
                        </span>
                    ) : (
                        <span className="text-gray-400 italic">Chưa giao</span>
                    )}
                    {ticket.customer_name && (
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {ticket.customer_name}
                        </span>
                    )}
                </div>
                <span>{getTimeAgo(ticket.created_at)}</span>
            </div>
        </div>
    );
};

export default TicketCard;
