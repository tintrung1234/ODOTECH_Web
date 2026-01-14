import React from 'react';
import { getStatusColor, getStatusLabel } from '../../utils/ticketUtils';

interface TicketStatusBadgeProps {
    status: 'new' | 'in_progress' | 'resolved' | 'closed';
    className?: string;
}

const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status, className = '' }) => {
    const color = getStatusColor(status);
    const label = getStatusLabel(status);

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
            style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
            }}
        >
            {label}
        </span>
    );
};

export default TicketStatusBadge;
