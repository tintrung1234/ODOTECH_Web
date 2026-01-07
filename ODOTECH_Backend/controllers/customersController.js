const { pool } = require("../config/postgres");
const { requireUser } = require("../utils/authz");
const { mapCustomerRow, mapCustomerProjectRow } = require("../models/customer");

function canViewCustomers(role) {
    return ["sale", "sales_manager", "head_sales", "support", "admin"].includes(role);
}

function canEditCustomers(role) {
    return ["sale", "sales_manager", "head_sales", "admin"].includes(role);
}

function getSaleScopeId(req) {
    const name = typeof req.user?.name === "string" ? req.user.name.trim() : "";
    const username = typeof req.user?.username === "string" ? req.user.username.trim() : "";
    return name || username;
}

/**
 * List customers with aggregated data from sales_projects
 * Groups by ma_kh and aggregates project count and total revenue
 */
async function listCustomers(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const {
            limit = 50,
            offset = 0,
            q = "",
            nguon_khach = "",
            sale_id = "",
        } = req.listQuery || {};

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // Search filter
        if (q && q.trim()) {
            whereConditions.push(`(
        sp.ma_kh ILIKE $${paramIndex} OR
        sp.ten_khach ILIKE $${paramIndex} OR
        sp.sdt ILIKE $${paramIndex} OR
        sp.website ILIKE $${paramIndex}
      )`);
            params.push(`%${q.trim()}%`);
            paramIndex++;
        }

        // Filter by nguon_khach
        if (nguon_khach && nguon_khach.trim()) {
            whereConditions.push(`sp.nguon_khach = $${paramIndex}`);
            params.push(nguon_khach.trim());
            paramIndex++;
        }

        // Filter by sale_id
        if (sale_id && sale_id.trim()) {
            whereConditions.push(`sp.sale_id = $${paramIndex}`);
            params.push(sale_id.trim());
            paramIndex++;
        }

        // Role-based filtering: sale can only see their own customers
        if (auth.role === "sale") {
            const scope = getSaleScopeId(req);
            whereConditions.push(`sp.sale_id = $${paramIndex}`);
            params.push(scope);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

        // Get total count
        const countQuery = `
      SELECT COUNT(DISTINCT sp.ma_kh) as total
      FROM sales_projects sp
      ${whereClause}
    `;
        const countResult = await pool.query(countQuery, params);
        const total = Number(countResult.rows[0]?.total || 0);

        // Get customers with aggregated data
        const query = `
      SELECT 
        MIN(sp.id) as id,
        sp.ma_kh,
        MAX(sp.ten_khach) as ten_khach,
        MAX(sp.sdt) as sdt,
        MAX(sp.zalo_fb) as zalo_fb,
        MAX(sp.nguon_khach) as nguon_khach,
        MAX(sp.nhu_cau) as nhu_cau,
        MAX(sp.san_pham_dv) as san_pham_dv,
        MAX(sp.website) as website,
        MAX(sp.sale_id) as sale_id,
        MAX(sp.pm_id) as pm_id,
        MIN(sp.ngay_tao) as ngay_tao,
        COUNT(sp.id) as total_projects,
        COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
      FROM sales_projects sp
      ${whereClause}
      GROUP BY sp.ma_kh
      ORDER BY MIN(sp.ngay_tao) DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        params.push(limit, offset);
        const result = await pool.query(query, params);

        const items = result.rows.map(mapCustomerRow);

        res.json({ items, total, limit, offset });
    } catch (err) {
        next(err);
    }
}

/**
 * Get customer details by ma_kh
 */
async function getCustomerById(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const ma_kh = req.params.id;

        let whereConditions = ["sp.ma_kh = $1"];
        let params = [ma_kh];

        // Role-based filtering
        if (auth.role === "sale") {
            const scope = getSaleScopeId(req);
            whereConditions.push("sp.sale_id = $2");
            params.push(scope);
        }

        const whereClause = whereConditions.join(" AND ");

        const query = `
      SELECT 
        MIN(sp.id) as id,
        sp.ma_kh,
        MAX(sp.ten_khach) as ten_khach,
        MAX(sp.sdt) as sdt,
        MAX(sp.zalo_fb) as zalo_fb,
        MAX(sp.nguon_khach) as nguon_khach,
        MAX(sp.nhu_cau) as nhu_cau,
        MAX(sp.san_pham_dv) as san_pham_dv,
        MAX(sp.website) as website,
        MAX(sp.sale_id) as sale_id,
        MAX(sp.pm_id) as pm_id,
        MIN(sp.ngay_tao) as ngay_tao,
        COUNT(sp.id) as total_projects,
        COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
      FROM sales_projects sp
      WHERE ${whereClause}
      GROUP BY sp.ma_kh
    `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const customer = mapCustomerRow(result.rows[0]);

        res.json(customer);
    } catch (err) {
        next(err);
    }
}

/**
 * Get all projects for a specific customer
 */
async function getCustomerProjects(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const ma_kh = req.params.id;

        let whereConditions = ["sp.ma_kh = $1"];
        let params = [ma_kh];

        // Role-based filtering
        if (auth.role === "sale") {
            const scope = getSaleScopeId(req);
            whereConditions.push("sp.sale_id = $2");
            params.push(scope);
        }

        const whereClause = whereConditions.join(" AND ");

        const query = `
      SELECT 
        sp.id,
        sp.ma_du_an,
        sp.ten_khach,
        sp.website,
        sp.trang_thai_chot,
        sp.trang_thai_thu_tien,
        sp.trang_thai_trien_khai,
        sp.ngay_tao,
        sp.phi_dich_vu,
        sp.phat_sinh,
        sp.ngay_ban_giao,
        sp.sale_id,
        sp.pm_id,
        sp.nhu_cau,
        sp.san_pham_dv
      FROM sales_projects sp
      WHERE ${whereClause}
      ORDER BY sp.ngay_tao DESC
    `;

        const result = await pool.query(query, params);

        const items = result.rows.map(mapCustomerProjectRow);

        res.json({ items });
    } catch (err) {
        next(err);
    }
}

/**
 * Update customer information (updates all projects with the same ma_kh)
 */
async function updateCustomer(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canEditCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const ma_kh = req.params.id;
        const { ten_khach, sdt, zalo_fb, nguon_khach, website } = req.body;

        // Check if customer exists and user has access
        let checkConditions = ["ma_kh = $1"];
        let checkParams = [ma_kh];

        if (auth.role === "sale") {
            const scope = getSaleScopeId(req);
            checkConditions.push("sale_id = $2");
            checkParams.push(scope);
        }

        const checkQuery = `SELECT COUNT(*) as count FROM sales_projects WHERE ${checkConditions.join(" AND ")}`;
        const checkResult = await pool.query(checkQuery, checkParams);

        if (Number(checkResult.rows[0]?.count || 0) === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Update all projects with this ma_kh
        const updateFields = [];
        const updateParams = [ma_kh];
        let paramIndex = 2;

        if (ten_khach !== undefined) {
            updateFields.push(`ten_khach = $${paramIndex}`);
            updateParams.push(ten_khach);
            paramIndex++;
        }
        if (sdt !== undefined) {
            updateFields.push(`sdt = $${paramIndex}`);
            updateParams.push(sdt);
            paramIndex++;
        }
        if (zalo_fb !== undefined) {
            updateFields.push(`zalo_fb = $${paramIndex}`);
            updateParams.push(zalo_fb);
            paramIndex++;
        }
        if (nguon_khach !== undefined) {
            updateFields.push(`nguon_khach = $${paramIndex}`);
            updateParams.push(nguon_khach);
            paramIndex++;
        }
        if (website !== undefined) {
            updateFields.push(`website = $${paramIndex}`);
            updateParams.push(website);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        const updateQuery = `
      UPDATE sales_projects
      SET ${updateFields.join(", ")}
      WHERE ma_kh = $1
    `;

        await pool.query(updateQuery, updateParams);

        // Return updated customer
        const updatedCustomer = await getCustomerByMaKh(ma_kh, auth.role === "sale" ? getSaleScopeId(req) : null);
        res.json(updatedCustomer);
    } catch (err) {
        next(err);
    }
}

// Helper function to get customer by ma_kh
async function getCustomerByMaKh(ma_kh, sale_id = null) {
    let whereConditions = ["sp.ma_kh = $1"];
    let params = [ma_kh];

    if (sale_id) {
        whereConditions.push("sp.sale_id = $2");
        params.push(sale_id);
    }

    const whereClause = whereConditions.join(" AND ");

    const query = `
    SELECT 
      MIN(sp.id) as id,
      sp.ma_kh,
      MAX(sp.ten_khach) as ten_khach,
      MAX(sp.sdt) as sdt,
      MAX(sp.zalo_fb) as zalo_fb,
      MAX(sp.nguon_khach) as nguon_khach,
      MAX(sp.nhu_cau) as nhu_cau,
      MAX(sp.san_pham_dv) as san_pham_dv,
      MAX(sp.website) as website,
      MAX(sp.sale_id) as sale_id,
      MAX(sp.pm_id) as pm_id,
      MIN(sp.ngay_tao) as ngay_tao,
      COUNT(sp.id) as total_projects,
      COALESCE(SUM(sp.phi_dich_vu + sp.phat_sinh), 0) as total_revenue
    FROM sales_projects sp
    WHERE ${whereClause}
    GROUP BY sp.ma_kh
  `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
        return null;
    }

    return mapCustomerRow(result.rows[0]);
}

module.exports = {
    listCustomers,
    getCustomerById,
    getCustomerProjects,
    updateCustomer,
};
