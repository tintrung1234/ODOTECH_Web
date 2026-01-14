const { pool } = require("../config/postgres");
const { mapTicketRow, mapTicketListRow } = require("../models/ticket");

/**
 * Get all tickets with optional filters
 */
async function getAllTickets(filters = {}) {
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // Build WHERE clause based on filters
    if (filters.type) {
        paramCount++;
        conditions.push(`t.type = $${paramCount}`);
        params.push(filters.type);
    }

    if (filters.status) {
        paramCount++;
        conditions.push(`t.status = $${paramCount}`);
        params.push(filters.status);
    }

    if (filters.priority) {
        paramCount++;
        conditions.push(`t.priority = $${paramCount}`);
        params.push(filters.priority);
    }

    if (filters.category_id) {
        paramCount++;
        conditions.push(`t.category_id = $${paramCount}`);
        params.push(filters.category_id);
    }

    if (filters.assigned_to_id) {
        paramCount++;
        conditions.push(`t.assigned_to_id = $${paramCount}`);
        params.push(filters.assigned_to_id);
    }

    if (filters.customer_id) {
        paramCount++;
        conditions.push(`t.customer_id = $${paramCount}`);
        params.push(filters.customer_id);
    }

    if (filters.search) {
        paramCount++;
        conditions.push(`(t.ticket_number ILIKE $${paramCount} OR t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`);
        params.push(`%${filters.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    const orderBy = filters.sort_by || 'created_at';
    const orderDir = filters.sort_dir === 'asc' ? 'ASC' : 'DESC';

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
        SELECT 
            t.*,
            tc.name as category_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            c.name as customer_name,
            p.name as related_project_name
        FROM tickets t
        LEFT JOIN ticket_categories tc ON t.category_id = tc.id
        LEFT JOIN accounts creator ON t.created_by_id = creator.id AND t.created_by_type = 'employee'
        LEFT JOIN customers c ON t.created_by_id = c.id AND t.created_by_type = 'customer'
        LEFT JOIN accounts assignee ON t.assigned_to_id = assignee.id
        LEFT JOIN customers cust ON t.customer_id = cust.id
        LEFT JOIN projects p ON t.related_project_id = p.id
        ${whereClause}
        ORDER BY t.${orderBy} ${orderDir}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows.map(mapTicketListRow);
}

/**
 * Get ticket by ID with full details
 */
async function getTicketById(id) {
    const query = `
        SELECT 
            t.*,
            tc.name as category_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            c.name as customer_name,
            p.name as related_project_name
        FROM tickets t
        LEFT JOIN ticket_categories tc ON t.category_id = tc.id
        LEFT JOIN accounts creator ON t.created_by_id = creator.id AND t.created_by_type = 'employee'
        LEFT JOIN customers c ON t.created_by_id = c.id AND t.created_by_type = 'customer'
        LEFT JOIN accounts assignee ON t.assigned_to_id = assignee.id
        LEFT JOIN customers cust ON t.customer_id = cust.id
        LEFT JOIN projects p ON t.related_project_id = p.id
        WHERE t.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? mapTicketRow(result.rows[0]) : null;
}

/**
 * Get ticket by ticket number
 */
async function getTicketByNumber(ticketNumber) {
    const query = `
        SELECT 
            t.*,
            tc.name as category_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            c.name as customer_name,
            p.name as related_project_name
        FROM tickets t
        LEFT JOIN ticket_categories tc ON t.category_id = tc.id
        LEFT JOIN accounts creator ON t.created_by_id = creator.id AND t.created_by_type = 'employee'
        LEFT JOIN customers c ON t.created_by_id = c.id AND t.created_by_type = 'customer'
        LEFT JOIN accounts assignee ON t.assigned_to_id = assignee.id
        LEFT JOIN customers cust ON t.customer_id = cust.id
        LEFT JOIN projects p ON t.related_project_id = p.id
        WHERE t.ticket_number = $1
    `;

    const result = await pool.query(query, [ticketNumber]);
    return result.rows.length > 0 ? mapTicketRow(result.rows[0]) : null;
}

/**
 * Create new ticket
 */
async function createTicket(data) {
    const query = `
        INSERT INTO tickets (
            ticket_number, type, category_id, title, description,
            priority, status, created_by_id, created_by_type,
            assigned_to_id, customer_id, related_project_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
    `;

    const params = [
        data.ticket_number,
        data.type,
        data.category_id || null,
        data.title,
        data.description,
        data.priority || 'medium',
        data.status || 'new',
        data.created_by_id,
        data.created_by_type,
        data.assigned_to_id || null,
        data.customer_id || null,
        data.related_project_id || null,
        JSON.stringify(data.metadata || {}),
    ];

    const result = await pool.query(query, params);
    return getTicketById(result.rows[0].id);
}

/**
 * Update ticket
 */
async function updateTicket(id, data) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    if (data.category_id !== undefined) {
        paramCount++;
        fields.push(`category_id = $${paramCount}`);
        params.push(data.category_id);
    }

    if (data.title !== undefined) {
        paramCount++;
        fields.push(`title = $${paramCount}`);
        params.push(data.title);
    }

    if (data.description !== undefined) {
        paramCount++;
        fields.push(`description = $${paramCount}`);
        params.push(data.description);
    }

    if (data.priority !== undefined) {
        paramCount++;
        fields.push(`priority = $${paramCount}`);
        params.push(data.priority);
    }

    if (data.status !== undefined) {
        paramCount++;
        fields.push(`status = $${paramCount}`);
        params.push(data.status);

        // Set resolved_at or closed_at timestamps
        if (data.status === 'resolved') {
            paramCount++;
            fields.push(`resolved_at = $${paramCount}`);
            params.push(new Date().toISOString());
        } else if (data.status === 'closed') {
            paramCount++;
            fields.push(`closed_at = $${paramCount}`);
            params.push(new Date().toISOString());
        }
    }

    if (data.assigned_to_id !== undefined) {
        paramCount++;
        fields.push(`assigned_to_id = $${paramCount}`);
        params.push(data.assigned_to_id);
    }

    if (data.metadata !== undefined) {
        paramCount++;
        fields.push(`metadata = $${paramCount}`);
        params.push(JSON.stringify(data.metadata));
    }

    if (fields.length === 0) {
        return getTicketById(id);
    }

    paramCount++;
    params.push(id);

    const query = `
        UPDATE tickets
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
    `;

    await pool.query(query, params);
    return getTicketById(id);
}

/**
 * Delete ticket (soft delete by setting status to closed)
 */
async function deleteTicket(id) {
    const query = `
        UPDATE tickets
        SET status = 'closed', closed_at = NOW()
        WHERE id = $1
        RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
}

/**
 * Assign ticket to user
 */
async function assignTicket(id, assigneeId) {
    const query = `
        UPDATE tickets
        SET assigned_to_id = $1
        WHERE id = $2
        RETURNING *
    `;

    await pool.query(query, [assigneeId, id]);
    return getTicketById(id);
}

/**
 * Update ticket status
 */
async function updateTicketStatus(id, status, userId) {
    const updates = { status };

    if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
    } else if (status === 'closed') {
        updates.closed_at = new Date().toISOString();
    }

    return updateTicket(id, updates);
}

/**
 * Get tickets assigned to user
 */
async function getTicketsByUser(userId) {
    return getAllTickets({ assigned_to_id: userId });
}

/**
 * Get tickets for customer
 */
async function getTicketsByCustomer(customerId) {
    return getAllTickets({ customer_id: customerId });
}

/**
 * Get ticket statistics
 */
async function getTicketStats(type = null) {
    const typeCondition = type ? `WHERE type = $1` : '';
    const params = type ? [type] : [];

    const query = `
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'new') as new_count,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
            COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
            COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
            COUNT(*) FILTER (WHERE priority = 'high') as high_count,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
        FROM tickets
        ${typeCondition}
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
}

/**
 * Record status history
 */
async function recordStatusHistory(ticketId, changedById, fieldName, oldValue, newValue) {
    const query = `
        INSERT INTO ticket_status_history (ticket_id, changed_by_id, field_name, old_value, new_value)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

    await pool.query(query, [ticketId, changedById, fieldName, oldValue, newValue]);
}

/**
 * Get status history for ticket
 */
async function getStatusHistory(ticketId) {
    const query = `
        SELECT 
            tsh.*,
            a.name as changed_by_name
        FROM ticket_status_history tsh
        LEFT JOIN accounts a ON tsh.changed_by_id = a.id
        WHERE tsh.ticket_id = $1
        ORDER BY tsh.created_at DESC
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
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
    recordStatusHistory,
    getStatusHistory,
};
