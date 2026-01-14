const { pool } = require("../config/postgres");
const { mapTicketCategoryRow } = require("../models/ticketCategory");

/**
 * Get all categories with optional type filter
 */
async function getAllCategories(type = null) {
    let query = `
        SELECT * FROM ticket_categories
        WHERE is_active = true
    `;

    const params = [];

    if (type) {
        query += ` AND type = $1`;
        params.push(type);
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, params);
    return result.rows.map(mapTicketCategoryRow);
}

/**
 * Get category by ID
 */
async function getCategoryById(id) {
    const query = `SELECT * FROM ticket_categories WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? mapTicketCategoryRow(result.rows[0]) : null;
}

/**
 * Create new category
 */
async function createCategory(data) {
    const query = `
        INSERT INTO ticket_categories (name, type, description, color, icon, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    const params = [
        data.name,
        data.type,
        data.description || null,
        data.color || '#6B7280',
        data.icon || 'ticket',
        data.is_active !== undefined ? data.is_active : true,
    ];

    const result = await pool.query(query, params);
    return mapTicketCategoryRow(result.rows[0]);
}

/**
 * Update category
 */
async function updateCategory(id, data) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    if (data.name !== undefined) {
        paramCount++;
        fields.push(`name = $${paramCount}`);
        params.push(data.name);
    }

    if (data.description !== undefined) {
        paramCount++;
        fields.push(`description = $${paramCount}`);
        params.push(data.description);
    }

    if (data.color !== undefined) {
        paramCount++;
        fields.push(`color = $${paramCount}`);
        params.push(data.color);
    }

    if (data.icon !== undefined) {
        paramCount++;
        fields.push(`icon = $${paramCount}`);
        params.push(data.icon);
    }

    if (data.is_active !== undefined) {
        paramCount++;
        fields.push(`is_active = $${paramCount}`);
        params.push(data.is_active);
    }

    if (fields.length === 0) {
        return getCategoryById(id);
    }

    paramCount++;
    params.push(id);

    const query = `
        UPDATE ticket_categories
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows.length > 0 ? mapTicketCategoryRow(result.rows[0]) : null;
}

/**
 * Delete category (soft delete by setting is_active to false)
 */
async function deleteCategory(id) {
    const query = `
        UPDATE ticket_categories
        SET is_active = false
        WHERE id = $1
        RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
}

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
