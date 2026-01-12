const { pool } = require("../config/postgres");
const { mapWebsiteRow } = require("../models/website");

/**
 * List websites with pagination and filters
 */
async function listWebsites({ limit = 50, offset = 0, search = "", status = "", sale_manager_id = null }) {
  const params = [];
  const where = [];
  let paramIndex = 1;

  if (search) {
    where.push(`(
      w.name ILIKE $${paramIndex} OR 
      w.url ILIKE $${paramIndex} OR 
      w.project_code ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    where.push(`w.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (sale_manager_id) {
    where.push(`w.sale_manager_id = $${paramIndex}`);
    params.push(sale_manager_id);
    paramIndex++;
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const query = `
    SELECT 
      w.*,
      m.name as manager_name,
      s.name as sale_manager_name
    FROM websites w
    LEFT JOIN accounts m ON w.manager_id = m.id
    LEFT JOIN accounts s ON w.sale_manager_id = s.id
    ${whereClause}
    ORDER BY w.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapWebsiteRow);
}

/**
 * Get website by ID
 */
async function getWebsiteById(id) {
  const query = `
    SELECT 
      w.*,
      m.name as manager_name,
      s.name as sale_manager_name
    FROM websites w
    LEFT JOIN accounts m ON w.manager_id = m.id
    LEFT JOIN accounts s ON w.sale_manager_id = s.id
    WHERE w.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows.length > 0 ? mapWebsiteRow(result.rows[0]) : null;
}

/**
 * Create new website
 */
async function createWebsite(data) {
  const query = `
    INSERT INTO websites (
      name, url, project_code, manager_id,
      hosting_package, hosting_provider,
      storage_used, storage_limit, storage_alert_threshold,
      admin_login_url, admin_username, admin_password,
      hosting_login_url, hosting_username, hosting_password,
      vps_login_url, vps_username, vps_password,
      ssh_host, ssh_port, ssh_username, ssh_password, ssh_key,
      sale_manager_id, status, notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
    )
    RETURNING *
  `;

  const params = [
    data.name,
    data.url,
    data.project_code || null,
    data.manager_id || null,
    data.hosting_package || null,
    data.hosting_provider || null,
    data.storage_used || 0,
    data.storage_limit || 0,
    data.storage_alert_threshold || 90,
    data.admin_login_url || null,
    data.admin_username || null,
    data.admin_password || null, // should be encrypted before calling
    data.hosting_login_url || null,
    data.hosting_username || null,
    data.hosting_password || null, // should be encrypted before calling
    data.vps_login_url || null,
    data.vps_username || null,
    data.vps_password || null, // should be encrypted before calling
    data.ssh_host || null,
    data.ssh_port || 22,
    data.ssh_username || null,
    data.ssh_password || null, // should be encrypted before calling
    data.ssh_key || null, // should be encrypted before calling
    data.sale_manager_id || null,
    data.status || "active",
    data.notes || "",
  ];

  const result = await pool.query(query, params);
  return mapWebsiteRow(result.rows[0]);
}

/**
 * Update website
 */
async function updateWebsite(id, data) {
  const query = `
    UPDATE websites SET
      name = $1,
      url = $2,
      project_code = $3,
      manager_id = $4,
      hosting_package = $5,
      hosting_provider = $6,
      storage_used = $7,
      storage_limit = $8,
      storage_alert_threshold = $9,
      admin_login_url = $10,
      admin_username = $11,
      admin_password = $12,
      hosting_login_url = $13,
      hosting_username = $14,
      hosting_password = $15,
      vps_login_url = $16,
      vps_username = $17,
      vps_password = $18,
      ssh_host = $19,
      ssh_port = $20,
      ssh_username = $21,
      ssh_password = $22,
      ssh_key = $23,
      sale_manager_id = $24,
      status = $25,
      notes = $26,
      updated_at = NOW()
    WHERE id = $27
    RETURNING *
  `;

  const params = [
    data.name,
    data.url,
    data.project_code || null,
    data.manager_id || null,
    data.hosting_package || null,
    data.hosting_provider || null,
    data.storage_used || 0,
    data.storage_limit || 0,
    data.storage_alert_threshold || 90,
    data.admin_login_url || null,
    data.admin_username || null,
    data.admin_password || null,
    data.hosting_login_url || null,
    data.hosting_username || null,
    data.hosting_password || null,
    data.vps_login_url || null,
    data.vps_username || null,
    data.vps_password || null,
    data.ssh_host || null,
    data.ssh_port || 22,
    data.ssh_username || null,
    data.ssh_password || null,
    data.ssh_key || null,
    data.sale_manager_id || null,
    data.status || "active",
    data.notes || "",
    id,
  ];

  const result = await pool.query(query, params);
  return result.rows.length > 0 ? mapWebsiteRow(result.rows[0]) : null;
}

/**
 * Delete website
 */
async function deleteWebsite(id) {
  const result = await pool.query("DELETE FROM websites WHERE id = $1 RETURNING id", [id]);
  return result.rows.length > 0;
}

/**
 * Get website statistics
 */
async function getWebsiteStats() {
  const query = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'active')::int as active,
      COUNT(*) FILTER (WHERE status = 'inactive')::int as inactive,
      COUNT(*) FILTER (WHERE status = 'suspended')::int as suspended,
      COUNT(*) FILTER (WHERE storage_limit > 0 AND (storage_used::float / storage_limit * 100) >= storage_alert_threshold)::int as storage_alerts
    FROM websites
  `;

  const result = await pool.query(query);
  return result.rows[0];
}

/**
 * Get websites with storage alerts
 */
async function getStorageAlerts() {
  const query = `
    SELECT 
      w.*,
      m.name as manager_name,
      s.name as sale_manager_name
    FROM websites w
    LEFT JOIN accounts m ON w.manager_id = m.id
    LEFT JOIN accounts s ON w.sale_manager_id = s.id
    WHERE w.storage_limit > 0 
      AND (w.storage_used::float / w.storage_limit * 100) >= w.storage_alert_threshold
    ORDER BY (w.storage_used::float / w.storage_limit * 100) DESC
  `;

  const result = await pool.query(query);
  return result.rows.map(mapWebsiteRow);
}

module.exports = {
  listWebsites,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  deleteWebsite,
  getWebsiteStats,
  getStorageAlerts,
};
