const { pool } = require("../config/postgres");
const { mapVirusLogRow } = require("../models/virusLog");

/**
 * List virus logs with pagination and filters
 */
async function listVirusLogs({ limit = 50, offset = 0, website_id = null, status = "", severity = "" }) {
    const params = [];
    const where = [];
    let paramIndex = 1;

    if (website_id) {
        where.push(`vl.website_id = $${paramIndex}`);
        params.push(website_id);
        paramIndex++;
    }

    if (status) {
        where.push(`vl.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    if (severity) {
        where.push(`vl.severity = $${paramIndex}`);
        params.push(severity);
        paramIndex++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const query = `
    SELECT 
      vl.*,
      w.name as website_name
    FROM virus_logs vl
    LEFT JOIN websites w ON vl.website_id = w.id
    ${whereClause}
    ORDER BY vl.detected_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows.map(mapVirusLogRow);
}

/**
 * Get virus log by ID
 */
async function getVirusLogById(id) {
    const query = `
    SELECT 
      vl.*,
      w.name as website_name
    FROM virus_logs vl
    LEFT JOIN websites w ON vl.website_id = w.id
    WHERE vl.id = $1
  `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? mapVirusLogRow(result.rows[0]) : null;
}

/**
 * Create new virus log
 */
async function createVirusLog(data) {
    const query = `
    INSERT INTO virus_logs (
      website_id, detected_at, threat_type, severity,
      affected_files, threat_description, scanner_name,
      action_taken, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

    const params = [
        data.website_id,
        data.detected_at || new Date(),
        data.threat_type,
        data.severity || "medium",
        data.affected_files || [],
        data.threat_description || "",
        data.scanner_name || "",
        data.action_taken || "",
        data.status || "detected",
    ];

    const result = await pool.query(query, params);
    return mapVirusLogRow(result.rows[0]);
}

/**
 * Update virus log status
 */
async function updateVirusLogStatus(id, status, resolution_notes = "") {
    const query = `
    UPDATE virus_logs SET
      status = $1,
      resolution_notes = $2,
      resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

    const result = await pool.query(query, [status, resolution_notes, id]);
    return result.rows.length > 0 ? mapVirusLogRow(result.rows[0]) : null;
}

/**
 * Get unassigned virus logs (status = 'detected')
 */
async function getUnassignedLogs() {
    const query = `
    SELECT 
      vl.*,
      w.name as website_name
    FROM virus_logs vl
    LEFT JOIN websites w ON vl.website_id = w.id
    WHERE vl.status = 'detected'
    ORDER BY vl.detected_at ASC
  `;

    const result = await pool.query(query);
    return result.rows.map(mapVirusLogRow);
}

module.exports = {
    listVirusLogs,
    getVirusLogById,
    createVirusLog,
    updateVirusLogStatus,
    getUnassignedLogs,
};
