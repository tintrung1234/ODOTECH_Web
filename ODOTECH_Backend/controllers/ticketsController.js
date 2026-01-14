const ticketsService = require("../services/ticketsService");
const commentsService = require("../services/ticketCommentsService");

/**
 * GET /api/tickets
 * Get all tickets with filters
 */
async function getAllTickets(req, res, next) {
    try {
        const filters = {
            type: req.query.type,
            status: req.query.status,
            priority: req.query.priority,
            category_id: req.query.category_id,
            assigned_to_id: req.query.assigned_to_id,
            customer_id: req.query.customer_id,
            search: req.query.search,
            sort_by: req.query.sort_by,
            sort_dir: req.query.sort_dir,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        };

        const tickets = await ticketsService.getAllTickets(filters);
        res.json(tickets);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tickets/stats
 * Get ticket statistics
 */
async function getTicketStats(req, res, next) {
    try {
        const type = req.query.type;
        const stats = await ticketsService.getTicketStats(type);
        res.json(stats);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tickets/my-tickets
 * Get current user's assigned tickets
 */
async function getMyTickets(req, res, next) {
    try {
        const userId = req.user.uid || req.user.id;
        const tickets = await ticketsService.getTicketsByUser(userId);
        res.json(tickets);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tickets/:id
 * Get ticket by ID
 */
async function getTicketById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const ticket = await ticketsService.getTicketById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tickets
 * Create new ticket
 */
async function createTicket(req, res, next) {
    try {
        const currentUserId = req.user.uid || req.user.id; // Support both uid and id
        console.log('Creating ticket - req.user:', req.user);
        console.log('Creating ticket - currentUserId:', currentUserId);

        const ticket = await ticketsService.createTicket(req.body, currentUserId);
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        next(error);
    }
}

/**
 * PUT /api/tickets/:id
 * Update ticket
 */
async function updateTicket(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const currentUserId = req.user.uid || req.user.id;
        const ticket = await ticketsService.updateTicket(id, req.body, currentUserId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/tickets/:id
 * Delete ticket
 */
async function deleteTicket(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const success = await ticketsService.deleteTicket(id);

        if (!success) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tickets/:id/assign
 * Assign ticket to user
 */
async function assignTicket(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const { assigned_to_id } = req.body;
        const currentUserId = req.user.uid || req.user.id;

        if (!assigned_to_id) {
            return res.status(400).json({ message: 'assigned_to_id is required' });
        }

        const ticket = await ticketsService.assignTicket(id, assigned_to_id, currentUserId);
        res.json(ticket);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tickets/:id/status
 * Update ticket status
 */
async function updateTicketStatus(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const currentUserId = req.user.uid || req.user.id;

        if (!status) {
            return res.status(400).json({ message: 'status is required' });
        }

        const ticket = await ticketsService.updateTicketStatus(id, status, currentUserId);
        res.json(ticket);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tickets/:id/comments
 * Get comments for ticket
 */
async function getTicketComments(req, res, next) {
    try {
        const ticketId = parseInt(req.params.id);
        const userId = req.user.uid || req.user.id;
        const userRole = req.user.role_system || req.user.role;

        const comments = await commentsService.getCommentsByTicket(ticketId, userId, userRole);
        res.json(comments);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tickets/:id/comments
 * Add comment to ticket
 */
async function addTicketComment(req, res, next) {
    try {
        const ticketId = parseInt(req.params.id);
        const currentUserId = req.user.uid || req.user.id;

        const commentData = {
            ...req.body,
            ticket_id: ticketId,
        };

        const comment = await commentsService.createComment(commentData, currentUserId);
        res.status(201).json(comment);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/tickets/:id/comments/:commentId
 * Update comment
 */
async function updateTicketComment(req, res, next) {
    try {
        const commentId = parseInt(req.params.commentId);
        const currentUserId = req.user.uid || req.user.id;

        const comment = await commentsService.updateComment(commentId, req.body, currentUserId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.json(comment);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/tickets/:id/comments/:commentId
 * Delete comment
 */
async function deleteTicketComment(req, res, next) {
    try {
        const commentId = parseInt(req.params.commentId);
        const currentUserId = req.user.uid || req.user.id;
        const userRole = req.user.role_system || req.user.role;

        const success = await commentsService.deleteComment(commentId, currentUserId, userRole);

        if (!success) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tickets/:id/history
 * Get status history for ticket
 */
async function getTicketHistory(req, res, next) {
    try {
        const ticketId = parseInt(req.params.id);
        const history = await ticketsService.getStatusHistory(ticketId);
        res.json(history);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllTickets,
    getTicketStats,
    getMyTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    updateTicketStatus,
    getTicketComments,
    addTicketComment,
    updateTicketComment,
    deleteTicketComment,
    getTicketHistory,
};
