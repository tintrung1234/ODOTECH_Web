const commentsRepo = require("../repositories/ticketCommentsRepository");
const { validateTicketCommentData } = require("../models/ticketComment");
const { notifyUser } = require("./notificationService");
const ticketsRepo = require("../repositories/ticketsRepository");

/**
 * Get comments for ticket
 */
async function getCommentsByTicket(ticketId, userId, userRole) {
    // Only include internal comments for employees
    const includeInternal = userRole !== 'customer';
    return await commentsRepo.getCommentsByTicket(ticketId, includeInternal);
}

/**
 * Create new comment
 */
async function createComment(data, currentUserId) {
    const validation = validateTicketCommentData(data);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }

    const commentData = {
        ...data,
        user_id: currentUserId,
    };

    const comment = await commentsRepo.createComment(commentData);

    // Get ticket details for notification
    const ticket = await ticketsRepo.getTicketById(data.ticket_id);

    if (ticket) {
        // Notify ticket creator if they're not the commenter
        if (ticket.created_by_type === 'employee' && ticket.created_by_id !== currentUserId) {
            await notifyUser({
                userId: ticket.created_by_id,
                type: 'ticket_comment_added',
                title: 'Comment mới trên ticket',
                message: `${comment.user_name} đã comment trên ticket ${ticket.ticket_number}`,
                data: { ticket_id: ticket.id, ticket_number: ticket.ticket_number, comment_id: comment.id },
            });
        }

        // Notify assigned user if they're not the commenter
        if (ticket.assigned_to_id && ticket.assigned_to_id !== currentUserId) {
            await notifyUser({
                userId: ticket.assigned_to_id,
                type: 'ticket_comment_added',
                title: 'Comment mới trên ticket',
                message: `${comment.user_name} đã comment trên ticket ${ticket.ticket_number}`,
                data: { ticket_id: ticket.id, ticket_number: ticket.ticket_number, comment_id: comment.id },
            });
        }
    }

    return comment;
}

/**
 * Update comment
 */
async function updateComment(id, data, currentUserId) {
    const existingComment = await commentsRepo.getCommentById(id);

    if (!existingComment) {
        throw new Error('Comment not found');
    }

    // Only allow user to update their own comments
    if (existingComment.user_id !== currentUserId) {
        throw new Error('You can only update your own comments');
    }

    const validation = validateTicketCommentData(data);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }

    return await commentsRepo.updateComment(id, data);
}

/**
 * Delete comment
 */
async function deleteComment(id, currentUserId, userRole) {
    const existingComment = await commentsRepo.getCommentById(id);

    if (!existingComment) {
        throw new Error('Comment not found');
    }

    // Only allow user to delete their own comments, or admin can delete any
    if (existingComment.user_id !== currentUserId && userRole !== 'admin') {
        throw new Error('You can only delete your own comments');
    }

    return await commentsRepo.deleteComment(id);
}

module.exports = {
    getCommentsByTicket,
    createComment,
    updateComment,
    deleteComment,
};
