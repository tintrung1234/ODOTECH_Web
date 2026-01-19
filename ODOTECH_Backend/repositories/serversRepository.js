const { pool } = require("../config/postgres");
const { mapServerRow } = require("../models/server");

/**
 * List servers with pagination and filters
 */
async function listServers({ limit = 50, offset = 0, search = "", status = "", server_type = "", provider = "" }) {
    const params = [];
    const where = [];
    let paramIndex = 1;

    if (search) {
        where.push(`(
      s.name ILIKE $${paramIndex} OR 
      s.hostname ILIKE $${paramIndex} OR 
      s.ip_address::text ILIKE $${paramIndex} OR
      s.purpose ILIKE $${paramIndex}
    )`);
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (status) {
        where.push(`s.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    if (server_type) {
        where.push(`s.server_type = $${paramIndex}`);
        params.push(server_type);
        paramIndex++;
    }

    if (provider) {
        where.push(`s.provider = $${paramIndex}`);
        params.push(provider);
        paramIndex++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const query = `
    SELECT 
      s.*,
      m.name as manager_name
    FROM servers s
    LEFT JOIN accounts m ON s.manager_id = m.id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows.map(mapServerRow);
}

/**
 * Get server by ID
 */
async function getServerById(id) {
    const query = `
    SELECT 
      s.*,
      m.name as manager_name
    FROM servers s
    LEFT JOIN accounts m ON s.manager_id = m.id
    WHERE s.id = $1
  `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? mapServerRow(result.rows[0]) : null;
}

/**
 * Create new server
 */
async function createServer(data) {
    const query = `
    INSERT INTO servers (
      name, hostname, ip_address, server_type,
      cpu_cores, ram_gb, storage_gb, bandwidth_gb,
      provider, datacenter_location,
      ssh_port, ssh_username, ssh_password, ssh_key, root_password,
      panel_type, panel_url, panel_username, panel_password,
      status, cpu_usage, ram_usage, storage_usage, uptime_days, last_check,
      manager_id, purpose, notes,
      monthly_cost, billing_cycle, next_billing_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
      $29, $30, $31
    )
    RETURNING *
  `;

    const params = [
        data.name,
        data.hostname,
        data.ip_address,
        data.server_type,
        data.cpu_cores || null,
        data.ram_gb || null,
        data.storage_gb || null,
        data.bandwidth_gb || null,
        data.provider || null,
        data.datacenter_location || null,
        data.ssh_port || 22,
        data.ssh_username || null,
        data.ssh_password || null, // should be encrypted before calling
        data.ssh_key || null, // should be encrypted before calling
        data.root_password || null, // should be encrypted before calling
        data.panel_type || null,
        data.panel_url || null,
        data.panel_username || null,
        data.panel_password || null, // should be encrypted before calling
        data.status || "active",
        data.cpu_usage || null,
        data.ram_usage || null,
        data.storage_usage || null,
        data.uptime_days || null,
        data.last_check || null,
        data.manager_id || null,
        data.purpose || null,
        data.notes || "",
        data.monthly_cost || null,
        data.billing_cycle || null,
        data.next_billing_date || null,
    ];

    const result = await pool.query(query, params);
    return mapServerRow(result.rows[0]);
}

/**
 * Update server
 */
async function updateServer(id, data) {
    const query = `
    UPDATE servers SET
      name = $1,
      hostname = $2,
      ip_address = $3,
      server_type = $4,
      cpu_cores = $5,
      ram_gb = $6,
      storage_gb = $7,
      bandwidth_gb = $8,
      provider = $9,
      datacenter_location = $10,
      ssh_port = $11,
      ssh_username = $12,
      ssh_password = $13,
      ssh_key = $14,
      root_password = $15,
      panel_type = $16,
      panel_url = $17,
      panel_username = $18,
      panel_password = $19,
      status = $20,
      cpu_usage = $21,
      ram_usage = $22,
      storage_usage = $23,
      uptime_days = $24,
      last_check = $25,
      manager_id = $26,
      purpose = $27,
      notes = $28,
      monthly_cost = $29,
      billing_cycle = $30,
      next_billing_date = $31,
      updated_at = NOW()
    WHERE id = $32
    RETURNING *
  `;

    const params = [
        data.name,
        data.hostname,
        data.ip_address,
        data.server_type,
        data.cpu_cores || null,
        data.ram_gb || null,
        data.storage_gb || null,
        data.bandwidth_gb || null,
        data.provider || null,
        data.datacenter_location || null,
        data.ssh_port || 22,
        data.ssh_username || null,
        data.ssh_password || null,
        data.ssh_key || null,
        data.root_password || null,
        data.panel_type || null,
        data.panel_url || null,
        data.panel_username || null,
        data.panel_password || null,
        data.status || "active",
        data.cpu_usage || null,
        data.ram_usage || null,
        data.storage_usage || null,
        data.uptime_days || null,
        data.last_check || null,
        data.manager_id || null,
        data.purpose || null,
        data.notes || "",
        data.monthly_cost || null,
        data.billing_cycle || null,
        data.next_billing_date || null,
        id,
    ];

    const result = await pool.query(query, params);
    return result.rows.length > 0 ? mapServerRow(result.rows[0]) : null;
}

/**
 * Delete server
 */
async function deleteServer(id) {
    const result = await pool.query("DELETE FROM servers WHERE id = $1 RETURNING id", [id]);
    return result.rows.length > 0;
}

/**
 * Get server statistics
 */
async function getServerStats() {
    const query = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'active')::int as active,
      COUNT(*) FILTER (WHERE status = 'inactive')::int as inactive,
      COUNT(*) FILTER (WHERE status = 'maintenance')::int as maintenance,
      COUNT(*) FILTER (WHERE status = 'error')::int as error,
      AVG(cpu_usage)::numeric(5,2) as avg_cpu_usage,
      AVG(ram_usage)::numeric(5,2) as avg_ram_usage,
      AVG(storage_usage)::numeric(5,2) as avg_storage_usage,
      SUM(monthly_cost)::numeric(10,2) as total_monthly_cost
    FROM servers
  `;

    const result = await pool.query(query);
    return result.rows[0];
}

/**
 * Get servers by type distribution
 */
async function getServersByType() {
    const query = `
    SELECT 
      server_type,
      COUNT(*)::int as count
    FROM servers
    GROUP BY server_type
    ORDER BY count DESC
  `;

    const result = await pool.query(query);
    return result.rows;
}

/**
 * Get servers by provider distribution
 */
async function getServersByProvider() {
    const query = `
    SELECT 
      provider,
      COUNT(*)::int as count
    FROM servers
    WHERE provider IS NOT NULL AND provider != ''
    GROUP BY provider
    ORDER BY count DESC
  `;

    const result = await pool.query(query);
    return result.rows;
}

module.exports = {
    listServers,
    getServerById,
    createServer,
    updateServer,
    deleteServer,
    getServerStats,
    getServersByType,
    getServersByProvider,
};
