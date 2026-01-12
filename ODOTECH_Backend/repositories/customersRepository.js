const { pool } = require("../config/postgres");
const { mapCustomerRow } = require("../models/customer");

/**
 * List customers with pagination and filters
 */
async function listCustomers({ limit = 50, offset = 0, search = "", nguon_khach = "", sale_id = null }) {
  const params = [];
  const where = [];
  let paramIndex = 1;

  // Search filter
  if (search && search.trim()) {
    where.push(`(
      c.ma_kh ILIKE $${paramIndex} OR
      c.name ILIKE $${paramIndex} OR
      c.phone ILIKE $${paramIndex} OR
      c.email ILIKE $${paramIndex} OR
      c.website ILIKE $${paramIndex}
    )`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // Filter by nguon_khach
  if (nguon_khach && nguon_khach.trim()) {
    where.push(`c.nguon_khach = $${paramIndex}`);
    params.push(nguon_khach.trim());
    paramIndex++;
  }

  // Filter by sale_id
  if (sale_id) {
    where.push(`c.sale_id = $${paramIndex}`);
    params.push(sale_id);
    paramIndex++;
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM customers c
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = Number(countResult.rows[0]?.total || 0);

  // Get customers with project stats
  const query = `
    SELECT 
      c.*,
      COUNT(sp.id) as total_projects,
      COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
    FROM customers c
    LEFT JOIN sales_projects sp ON c.ma_kh = sp.ma_kh
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);
  const result = await pool.query(query, params);

  return {
    items: result.rows.map(mapCustomerRow),
    total,
    limit,
    offset,
  };
}

/**
 * Get customer by ID
 */
async function getCustomerById(id) {
  const query = `
    SELECT 
      c.*,
      COUNT(sp.id) as total_projects,
      COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
    FROM customers c
    LEFT JOIN sales_projects sp ON c.ma_kh = sp.ma_kh
    WHERE c.id = $1
    GROUP BY c.id
  `;

  const result = await pool.query(query, [id]);
  return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
}

/**
 * Get customer by ma_kh
 */
async function getCustomerByMaKh(ma_kh) {
  const query = `
    SELECT 
      c.*,
      COUNT(sp.id) as total_projects,
      COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
    FROM customers c
    LEFT JOIN sales_projects sp ON c.ma_kh = sp.ma_kh
    WHERE c.ma_kh = $1
    GROUP BY c.id
  `;

  const result = await pool.query(query, [ma_kh]);
  return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
}

/**
 * Get customer by email
 */
async function getCustomerByEmail(email) {
  const query = `
    SELECT 
      c.*,
      COUNT(sp.id) as total_projects,
      COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
    FROM customers c
    LEFT JOIN sales_projects sp ON c.ma_kh = sp.ma_kh
    WHERE LOWER(c.email) = LOWER($1)
    GROUP BY c.id
    LIMIT 1
  `;

  const result = await pool.query(query, [email.trim()]);
  return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
}

/**
 * Get customer projects
 */
async function getCustomerProjects(ma_kh) {
  const query = `
    SELECT 
      id,
      ma_du_an,
      ten_khach,
      website,
      trang_thai_chot,
      trang_thai_thu_tien,
      trang_thai_trien_khai,
      ngay_tao,
      phi_dich_vu,
      phat_sinh,
      ngay_ban_giao,
      sale_id,
      pm_id,
      nhu_cau,
      san_pham_dv
    FROM sales_projects
    WHERE ma_kh = $1
    ORDER BY ngay_tao DESC
  `;

  const result = await pool.query(query, [ma_kh]);
  return result.rows;
}

/**
 * Create customer
 */
async function createCustomer(data) {
  const query = `
    INSERT INTO customers (
      ma_kh, name, phone, email, zalo_fb, company,
      nguon_khach, nhu_cau, san_pham_dv, website, sale_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const params = [
    data.ma_kh,
    data.name,
    data.phone || null,
    data.email || null,
    data.zalo_fb || null,
    data.company || null,
    data.nguon_khach || null,
    data.nhu_cau || null,
    data.san_pham_dv || null,
    data.website || null,
    data.sale_id || null,
  ];

  const result = await pool.query(query, params);
  return mapCustomerRow(result.rows[0]);
}

/**
 * Update customer
 */
async function updateCustomer(id, data) {
  const query = `
    UPDATE customers SET
      name = $1,
      phone = $2,
      email = $3,
      zalo_fb = $4,
      company = $5,
      nguon_khach = $6,
      nhu_cau = $7,
      san_pham_dv = $8,
      website = $9,
      sale_id = $10,
      updated_at = NOW()
    WHERE id = $11
    RETURNING *
  `;

  const params = [
    data.name,
    data.phone || null,
    data.email || null,
    data.zalo_fb || null,
    data.company || null,
    data.nguon_khach || null,
    data.nhu_cau || null,
    data.san_pham_dv || null,
    data.website || null,
    data.sale_id || null,
    id,
  ];

  const result = await pool.query(query, params);
  return result.rows.length > 0 ? mapCustomerRow(result.rows[0]) : null;
}

/**
 * Delete customer
 */
async function deleteCustomer(id) {
  const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING id", [id]);
  return result.rows.length > 0;
}

/**
 * Get customer statistics
 */
async function getCustomerStats() {
  const query = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE nguon_khach = 'Facebook')::int as from_facebook,
      COUNT(*) FILTER (WHERE nguon_khach = 'Google')::int as from_google,
      COUNT(*) FILTER (WHERE nguon_khach = 'Referral')::int as from_referral,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int as new_this_month
    FROM customers
  `;

  const result = await pool.query(query);
  return result.rows[0];
}

module.exports = {
  listCustomers,
  getCustomerById,
  getCustomerByMaKh,
  getCustomerByEmail,
  getCustomerProjects,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
};
