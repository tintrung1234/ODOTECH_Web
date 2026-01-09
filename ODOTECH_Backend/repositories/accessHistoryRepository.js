const { pool } = require("../config/postgres");
const { mapAccessHistoryRow } = require("../models/accessHistory");

/**
 * Log credential access
 */
async function logAccess({ user_id, user_name, website_id, website_name, credential_type, ip_address = "", user_agent = "" }) {
    const query = `
    INSERT INTO access_history (
      user_id, user_name, website_id, website_name,
      credential_type, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

    const params = [
        user_id,
        user_name,
        website_id,
        website_name,
        credential_type,
        ip_address,
        user_agent,
    ];

    const result = await pool.query(query, params);
    return mapAccessHistoryRow(result.rows[0]);
}

/**
 * Get access history with pagination and filters
 */
async function getAccessHistory({ website_id = null, user_id = null, limit = 50, offset = 0 }) {
    const params = [];
    const where = [];
    let paramIndex = 1;

    if (website_id) {
        where.push(`website_id = $${paramIndex}`);
        params.push(website_id);
        paramIndex++;
    }

    if (user_id) {
        where.push(`user_id = $${paramIndex}`);
        params.push(user_id);
        paramIndex++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const query = `
    SELECT * FROM access_history
    ${whereClause}
    ORDER BY accessed_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows.map(mapAccessHistoryRow);
}

module.exports = {
    logAccess,
    getAccessHistory,
};
