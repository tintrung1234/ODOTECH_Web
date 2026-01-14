import React from 'react';
import { getPriorityColor, getPriorityLabel } from '../../utils/ticketUtils';

interface TicketPriorityBadgeProps {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    className?: string;
}

const TicketPriorityBadge: React.FC<TicketPriorityBadgeProps> = ({ priority, className = '' }) => {
    const color = getPriorityColor(priority);
    const label = getPriorityLabel(priority);

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

export default TicketPriorityBadge;
