const ticketsRepo = require("../repositories/ticketsRepository");
const { generateTicketNumber, validateTicketData } = require("../models/ticket");
const { notifyUser } = require("./notificationService");

/**
 * Get all tickets with filters
 */
async function getAllTickets(filters) {
    return await ticketsRepo.getAllTickets(filters);
}

/**
 * Get ticket by ID
 */
async function getTicketById(id) {
    return await ticketsRepo.getTicketById(id);
}

/**
 * Get ticket by number
 */
async function getTicketByNumber(ticketNumber) {
    return await ticketsRepo.getTicketByNumber(ticketNumber);
}

/**
 * Create new ticket
 */
async function createTicket(data, currentUserId) {
    // Validate ticket data
    const validation = validateTicketData(data);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }

    // Generate unique ticket number
    let ticketNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        ticketNumber = generateTicketNumber();
        const existing = await ticketsRepo.getTicketByNumber(ticketNumber);
        if (!existing) break;
        attempts++;
    }

    if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique ticket number');
    }

    // Create ticket
    const ticketData = {
        ...data,
        ticket_number: ticketNumber,
        created_by_id: data.created_by_id || currentUserId,
        created_by_type: data.created_by_type || 'employee',
    };

    const ticket = await ticketsRepo.createTicket(ticketData);

    // Send notification to assigned user if ticket is assigned
    if (ticket.assigned_to_id) {
        await notifyUser({
            userId: ticket.assigned_to_id,
            type: 'ticket_assigned',
            title: 'Ticket mới được giao',
            message: `Bạn được giao ticket ${ticket.ticket_number}: ${ticket.title}`,
            data: { ticket_id: ticket.id, ticket_number: ticket.ticket_number },
        });
    }

    return ticket;
}

/**
 * Update ticket
 */
async function updateTicket(id, data, currentUserId) {
    const existingTicket = await ticketsRepo.getTicketById(id);
    if (!existingTicket) {
        throw new Error('Ticket not found');
    }

    // Validate status transition
    if (data.status) {
        validateStatusTransition(existingTicket.status, data.status);
    }

    // Record status history for important changes
    if (data.status && data.status !== existingTicket.status) {
        await ticketsRepo.recordStatusHistory(
            id,
            currentUserId,
            'status',
            existingTicket.status,
            data.status
        );

        // Send notification on status change
        const notifyUserId = existingTicket.created_by_type === 'employee'
            ? existingTicket.created_by_id
            : existingTicket.assigned_to_id;

        if (notifyUserId) {
            await notifyUser({
                userId: notifyUserId,
                type: 'ticket_status_changed',
                title: 'Trạng thái ticket thay đổi',
                message: `Ticket ${existingTicket.ticket_number} đã chuyển sang trạng thái: ${getStatusLabel(data.status)}`,
                data: { ticket_id: id, ticket_number: existingTicket.ticket_number, new_status: data.status },
            });
        }
    }

    if (data.priority && data.priority !== existingTicket.priority) {
        await ticketsRepo.recordStatusHistory(
            id,
            currentUserId,
            'priority',
            existingTicket.priority,
            data.priority
        );
    }

    if (data.assigned_to_id && data.assigned_to_id !== existingTicket.assigned_to_id) {
        await ticketsRepo.recordStatusHistory(
            id,
            currentUserId,
            'assigned_to',
            existingTicket.assigned_to_id?.toString() || 'null',
            data.assigned_to_id.toString()
        );
    }

    return await ticketsRepo.updateTicket(id, data);
}

/**
 * Delete ticket
 */
async function deleteTicket(id) {
    return await ticketsRepo.deleteTicket(id);
}

/**
 * Assign ticket to user
 */
async function assignTicket(id, assigneeId, currentUserId) {
    const ticket = await ticketsRepo.getTicketById(id);
    if (!ticket) {
        throw new Error('Ticket not found');
    }

    // Record history
    await ticketsRepo.recordStatusHistory(
        id,
        currentUserId,
        'assigned_to',
        ticket.assigned_to_id?.toString() || 'null',
        assigneeId.toString()
    );

    const updatedTicket = await ticketsRepo.assignTicket(id, assigneeId);

    // Send notification to assignee
    await notifyUser({
        userId: assigneeId,
        type: 'ticket_assigned',
        title: 'Ticket mới được giao',
        message: `Bạn được giao ticket ${ticket.ticket_number}: ${ticket.title}`,
        data: { ticket_id: id, ticket_number: ticket.ticket_number },
    });

    return updatedTicket;
}

/**
 * Update ticket status
 */
async function updateTicketStatus(id, status, currentUserId) {
    return await updateTicket(id, { status }, currentUserId);
}

/**
 * Get tickets by user
 */
async function getTicketsByUser(userId) {
    return await ticketsRepo.getTicketsByUser(userId);
}

/**
 * Get tickets by customer
 */
async function getTicketsByCustomer(customerId) {
    return await ticketsRepo.getTicketsByCustomer(customerId);
}

/**
 * Get ticket statistics
 */
async function getTicketStats(type) {
    return await ticketsRepo.getTicketStats(type);
}

/**
 * Get status history
 */
async function getStatusHistory(ticketId) {
    return await ticketsRepo.getStatusHistory(ticketId);
}

/**
 * Validate status transition
 */
function validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
        'new': ['in_progress', 'closed'],
        'in_progress': ['resolved', 'closed'],
        'resolved': ['closed', 'in_progress'],
        'closed': [], // Cannot reopen closed tickets
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
}

/**
 * Get status label in Vietnamese
 */
function getStatusLabel(status) {
    const labels = {
        'new': 'Mới',
        'in_progress': 'Đang xử lý',
        'resolved': 'Đã giải quyết',
        'closed': 'Đã đóng',
    };
    return labels[status] || status;
}

module.exports = {
    getAllTickets,
    getTicketById,
    getTicketByNumber,
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    updateTicketStatus,
    getTicketsByUser,
    getTicketsByCustomer,
    getTicketStats,
    getStatusHistory,
};
