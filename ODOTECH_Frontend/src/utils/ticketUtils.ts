// Ticket utility functions

/**
 * Get color for ticket status
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        new: '#3B82F6', // blue
        in_progress: '#F59E0B', // amber
        resolved: '#10B981', // green
        closed: '#6B7280', // gray
    };
    return colors[status] || '#6B7280';
}

/**
 * Get color for ticket priority
 */
export function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
        low: '#10B981', // green
        medium: '#3B82F6', // blue
        high: '#F59E0B', // amber
        urgent: '#EF4444', // red
    };
    return colors[priority] || '#3B82F6';
}

/**
 * Get status label in Vietnamese
 */
export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        new: 'Mới',
        in_progress: 'Đang xử lý',
        resolved: 'Đã giải quyết',
        closed: 'Đã đóng',
    };
    return labels[status] || status;
}

/**
 * Get priority label in Vietnamese
 */
export function getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
        low: 'Thấp',
        medium: 'Trung bình',
        high: 'Cao',
        urgent: 'Khẩn cấp',
    };
    return labels[priority] || priority;
}

/**
 * Get type label in Vietnamese
 */
export function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        customer: 'Khách hàng',
        internal: 'Nội bộ',
    };
    return labels[type] || type;
}

/**
 * Format ticket number for display
 */
export function formatTicketNumber(ticketNumber: string): string {
    return ticketNumber;
}

/**
 * Check if user can edit ticket
 */
export function canEditTicket(ticket: any, user: any): boolean {
    if (!user) return false;

    // Admin can edit all tickets
    if (user.role_system === 'admin') return true;

    // Creator can edit their own tickets
    if (ticket.created_by_type === 'employee' && ticket.created_by_id === user.id) {
        return true;
    }

    // Assigned user can edit
    if (ticket.assigned_to_id === user.id) return true;

    return false;
}

/**
 * Check if user can assign ticket
 */
export function canAssignTicket(user: any): boolean {
    if (!user) return false;

    // Admin and managers can assign tickets
    if (user.role_system === 'admin' || user.role_system === 'manager') {
        return true;
    }

    return false;
}

/**
 * Check if user can delete ticket
 */
export function canDeleteTicket(user: any): boolean {
    if (!user) return false;

    // Only admin can delete tickets
    return user.role_system === 'admin';
}

/**
 * Get time ago string
 */
export function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;

    return date.toLocaleDateString('vi-VN');
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
        new: ['in_progress', 'closed'],
        in_progress: ['resolved', 'closed'],
        resolved: ['closed', 'in_progress'],
        closed: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
}
