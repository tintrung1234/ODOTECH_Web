const { pool } = require("../config/postgres");
const { mapDevAssignmentRow, mapDevRotationRow } = require("../models/devAssignment");

/**
 * List dev assignments with pagination and filters
 */
async function listAssignments({ limit = 50, offset = 0, dev_id = null, status = "" }) {
    const params = [];
    const where = [];
    let paramIndex = 1;

    if (dev_id) {
        where.push(`da.assigned_dev_id = $${paramIndex}`);
        params.push(dev_id);
        paramIndex++;
    }

    if (status) {
        where.push(`da.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const query = `
    SELECT 
      da.*,
      a.name as assigned_dev_name
    FROM dev_assignments da
    LEFT JOIN accounts a ON da.assigned_dev_id = a.id
    ${whereClause}
    ORDER BY da.assigned_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows.map(mapDevAssignmentRow);
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(id) {
    const query = `
    SELECT 
      da.*,
      a.name as assigned_dev_name
    FROM dev_assignments da
    LEFT JOIN accounts a ON da.assigned_dev_id = a.id
    WHERE da.id = $1
  `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? mapDevAssignmentRow(result.rows[0]) : null;
}

/**
 * Create new assignment
 */
async function createAssignment(data) {
    const query = `
    INSERT INTO dev_assignments (
      virus_log_id, assigned_dev_id, status
    ) VALUES ($1, $2, $3)
    RETURNING *
  `;

    const params = [
        data.virus_log_id,
        data.assigned_dev_id,
        data.status || "pending",
    ];

    const result = await pool.query(query, params);
    return mapDevAssignmentRow(result.rows[0]);
}

/**
 * Update assignment status
 */
async function updateAssignmentStatus(id, status, notes = "") {
    const query = `
    UPDATE dev_assignments SET
      status = $1,
      resolution_notes = $2,
      accepted_at = CASE WHEN $1 = 'accepted' THEN NOW() ELSE accepted_at END,
      started_at = CASE WHEN $1 = 'in_progress' THEN NOW() ELSE started_at END,
      completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

    const result = await pool.query(query, [status, notes, id]);
    return result.rows.length > 0 ? mapDevAssignmentRow(result.rows[0]) : null;
}

/**
 * Delegate assignment to another dev
 */
async function delegateAssignment(id, from_dev_id, to_dev_id) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Get current assignment
        const getQuery = `SELECT * FROM dev_assignments WHERE id = $1`;
        const current = await client.query(getQuery, [id]);

        if (current.rows.length === 0) {
            throw new Error("Assignment not found");
        }

        const assignment = current.rows[0];

        // Build delegation history
        const delegationHistory = assignment.delegation_history || [];
        delegationHistory.push({
            from_dev_id,
            to_dev_id,
            requested_at: new Date().toISOString(),
            responded_at: null,
            accepted: null,
        });

        // Update assignment with delegation
        const updateQuery = `
      UPDATE dev_assignments SET
        status = 'delegated',
        delegation_history = $1,
        delegation_expires_at = NOW() + INTERVAL '15 minutes',
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

        const result = await client.query(updateQuery, [JSON.stringify(delegationHistory), id]);

        await client.query("COMMIT");
        return mapDevAssignmentRow(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Accept delegation
 */
async function acceptDelegation(id, dev_id) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Get current assignment
        const getQuery = `SELECT * FROM dev_assignments WHERE id = $1`;
        const current = await client.query(getQuery, [id]);

        if (current.rows.length === 0) {
            throw new Error("Assignment not found");
        }

        const assignment = current.rows[0];
        const delegationHistory = assignment.delegation_history || [];

        // Update last delegation entry
        if (delegationHistory.length > 0) {
            const lastDelegation = delegationHistory[delegationHistory.length - 1];
            lastDelegation.responded_at = new Date().toISOString();
            lastDelegation.accepted = true;
        }

        // Update assignment
        const updateQuery = `
      UPDATE dev_assignments SET
        assigned_dev_id = $1,
        status = 'accepted',
        delegation_history = $2,
        delegation_expires_at = NULL,
        accepted_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

        const result = await client.query(updateQuery, [dev_id, JSON.stringify(delegationHistory), id]);

        await client.query("COMMIT");
        return mapDevAssignmentRow(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get next dev in rotation (round-robin)
 */
async function getNextDevInRotation() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Get last assigned dev
        const trackerQuery = `SELECT last_assigned_dev_id FROM dev_assignment_tracker WHERE id = 1`;
        const trackerResult = await client.query(trackerQuery);
        const lastAssignedDevId = trackerResult.rows[0]?.last_assigned_dev_id;

        // Get active devs in rotation order
        const devsQuery = `
      SELECT dr.*, a.name as dev_name
      FROM dev_rotation dr
      JOIN accounts a ON dr.dev_id = a.id
      WHERE dr.is_active = true AND a.status = 'active'
      ORDER BY dr.rotation_order ASC
    `;
        const devsResult = await client.query(devsQuery);
        const devs = devsResult.rows.map(mapDevRotationRow);

        if (devs.length === 0) {
            throw new Error("No active developers in rotation");
        }

        // Find next dev
        let nextDev;
        if (!lastAssignedDevId) {
            // First assignment, use first dev in rotation
            nextDev = devs[0];
        } else {
            // Find current dev index
            const currentIndex = devs.findIndex(d => d.dev_id === lastAssignedDevId);
            if (currentIndex === -1 || currentIndex === devs.length - 1) {
                // Last dev or not found, wrap to first
                nextDev = devs[0];
            } else {
                // Next dev in rotation
                nextDev = devs[currentIndex + 1];
            }
        }

        // Update tracker
        const updateTrackerQuery = `
      UPDATE dev_assignment_tracker 
      SET last_assigned_dev_id = $1, last_assigned_at = NOW()
      WHERE id = 1
    `;
        await client.query(updateTrackerQuery, [nextDev.dev_id]);

        await client.query("COMMIT");
        return nextDev;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get expired delegations
 */
async function getExpiredDelegations() {
    const query = `
    SELECT 
      da.*,
      a.name as assigned_dev_name
    FROM dev_assignments da
    LEFT JOIN accounts a ON da.assigned_dev_id = a.id
    WHERE da.status = 'delegated' 
      AND da.delegation_expires_at IS NOT NULL
      AND da.delegation_expires_at < NOW()
  `;

    const result = await pool.query(query);
    return result.rows.map(mapDevAssignmentRow);
}

/**
 * List dev rotation
 */
async function listDevRotation() {
    const query = `
    SELECT dr.*, a.name as dev_name
    FROM dev_rotation dr
    JOIN accounts a ON dr.dev_id = a.id
    ORDER BY dr.rotation_order ASC
  `;

    const result = await pool.query(query);
    return result.rows.map(mapDevRotationRow);
}

/**
 * Add dev to rotation
 */
async function addDevToRotation(dev_id) {
    // Get max rotation order
    const maxQuery = `SELECT COALESCE(MAX(rotation_order), 0) as max_order FROM dev_rotation`;
    const maxResult = await pool.query(maxQuery);
    const nextOrder = maxResult.rows[0].max_order + 1;

    const query = `
    INSERT INTO dev_rotation (dev_id, rotation_order, is_active)
    VALUES ($1, $2, true)
    ON CONFLICT (dev_id) DO UPDATE SET is_active = true, rotation_order = $2
    RETURNING *
  `;

    const result = await pool.query(query, [dev_id, nextOrder]);
    return mapDevRotationRow(result.rows[0]);
}

/**
 * Remove dev from rotation
 */
async function removeDevFromRotation(dev_id) {
    const query = `
    UPDATE dev_rotation SET is_active = false, updated_at = NOW()
    WHERE dev_id = $1
    RETURNING *
  `;

    const result = await pool.query(query, [dev_id]);
    return result.rows.length > 0 ? mapDevRotationRow(result.rows[0]) : null;
}

module.exports = {
    listAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignmentStatus,
    delegateAssignment,
    acceptDelegation,
    getNextDevInRotation,
    getExpiredDelegations,
    listDevRotation,
    addDevToRotation,
    removeDevFromRotation,
};
