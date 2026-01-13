const { pool } = require("../config/postgres");
const salesModel = require("../models/sales");

async function listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien, sale_ids, ky_thuat_ids }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(LOWER(sp.ten_khach) LIKE $${params.length} OR LOWER(sp.ma_du_an) LIKE $${params.length})`);
  }

  if (trang_thai_chot) {
    params.push(trang_thai_chot);
    where.push(`sp.trang_thai_chot = $${params.length}`);
  }

  if (trang_thai_thu_tien) {
    params.push(trang_thai_thu_tien);
    where.push(`sp.trang_thai_thu_tien = $${params.length}`);
  }

  const normalizedSaleIds = Array.isArray(sale_ids)
    ? Array.from(new Set(sale_ids.map((v) => String(v ?? "").trim()).filter(Boolean)))
    : [];

  if (normalizedSaleIds.length > 0) {
    params.push(normalizedSaleIds);
    where.push(`sp.sale_id = ANY($${params.length}::text[])`);
  }

  const normalizedDevIds = Array.isArray(ky_thuat_ids)
    ? Array.from(new Set(ky_thuat_ids.map((v) => String(v ?? "").trim()).filter(Boolean)))
    : [];

  if (normalizedDevIds.length > 0) {
    params.push(normalizedDevIds);
    where.push(`sp.ky_thuat_id = ANY($${params.length}::text[])`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const listSql = `
    SELECT
      sp.*,
      p.status AS project_status,
      p.completed_at AS project_completed_at,
      p.contract_value AS contract_value
    FROM sales_projects sp
    LEFT JOIN projects p ON p.project_code = sp.ma_du_an
    ${whereSql}
    ORDER BY sp.id DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `SELECT COUNT(*)::int AS total FROM sales_projects sp ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    items: listResult.rows.map(salesModel.mapSalesProjectRow),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getProjectById(projectId, { sale_ids, ky_thuat_ids } = {}) {
  const normalizedSaleIds = Array.isArray(sale_ids)
    ? Array.from(new Set(sale_ids.map((v) => String(v ?? "").trim()).filter(Boolean)))
    : [];
  const normalizedDevIds = Array.isArray(ky_thuat_ids)
    ? Array.from(new Set(ky_thuat_ids.map((v) => String(v ?? "").trim()).filter(Boolean)))
    : [];

  const projectResult = await pool.query(
    `
      SELECT
        sp.*,
        p.status AS project_status,
        p.completed_at AS project_completed_at,
        p.contract_value AS contract_value
      FROM sales_projects sp
      LEFT JOIN projects p ON p.project_code = sp.ma_du_an
      WHERE sp.id = $1
        AND ($2::text[] IS NULL OR sp.sale_id = ANY($2::text[]))
        AND ($3::text[] IS NULL OR sp.ky_thuat_id = ANY($3::text[]))
      LIMIT 1
    `,
    [
      projectId,
      normalizedSaleIds.length > 0 ? normalizedSaleIds : null,
      normalizedDevIds.length > 0 ? normalizedDevIds : null,
    ]
  );

  const projectRow = projectResult.rows[0];
  if (!projectRow) return null;

  const paymentsResult = await pool.query(
    `
      SELECT id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu
      FROM sales_payments
      WHERE project_id = $1
      ORDER BY lan_thanh_toan ASC, id ASC
    `,
    [projectId]
  );

  const project = salesModel.mapSalesProjectRow(projectRow);
  project.danh_sach_thanh_toan = paymentsResult.rows.map(salesModel.mapSalesPaymentRow);
  return project;
}

async function createProject(input) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertResult = await client.query(
      `
        INSERT INTO sales_projects (
          ma_kh, ma_du_an, ten_khach, sdt, zalo_fb, nguon_khach, nhu_cau, san_pham_dv, website,
          sale_id, ky_thuat_id, pm_id,
          trang_thai_chot, trang_thai_thu_tien, trang_thai_trien_khai,
          ngay_tao, lich_hen, ghi_chu, ngay_cham_cuoi, hinh_thuc_cham,
          phi_dich_vu, phat_sinh, ngay_doi_cuoi, so_lan_doi,
          ngay_ban_giao, ngay_tat_toan, ly_do_lau, chi_phi_outsource,
          gia_han_domain, ngay_hh_domain, phi_gh_domain,
          gia_han_hosting, ngay_hh_hosting, phi_gh_hosting,
          gia_han_email, ngay_hh_email, phi_gh_email,
          gia_han_content, ngay_hh_content, phi_gh_content,
          gia_han_ads, ngay_hh_ads, phi_gh_ads
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,
          $13,$14,$15,
          $16,$17,$18,$19,$20,
          $21,$22,$23,$24,
          $25,$26,$27,$28,
          $29,$30,$31,$32,
          $33,$34,$35,
          $36,$37,$38,
          $39,$40,$41,
          $42,$43,$44
        )
        RETURNING *
      `,
      [
        input.ma_kh,
        input.ma_du_an,
        input.ten_khach,
        input.sdt,
        input.zalo_fb,
        input.nguon_khach,
        input.nhu_cau,
        input.san_pham_dv,
        input.website,

        input.sale_id,
        input.ky_thuat_id,
        input.pm_id,

        input.trang_thai_chot,
        input.trang_thai_thu_tien,
        input.trang_thai_trien_khai,

        salesModel.toDbDate(input.ngay_tao),
        salesModel.toDbDate(input.lich_hen),
        input.ghi_chu,
        salesModel.toDbDate(input.ngay_cham_cuoi),
        input.hinh_thuc_cham,

        input.phi_dich_vu,
        input.phat_sinh,
        salesModel.toDbDate(input.ngay_doi_cuoi),
        input.so_lan_doi,

        salesModel.toDbDate(input.ngay_ban_giao),
        salesModel.toDbDate(input.ngay_tat_toan),
        input.ly_do_lau,
        input.chi_phi_outsource,

        input.gia_han_domain,
        salesModel.toDbDate(input.ngay_hh_domain),
        input.phi_gh_domain,

        input.gia_han_hosting,
        salesModel.toDbDate(input.ngay_hh_hosting),
        input.phi_gh_hosting,

        input.gia_han_email,
        salesModel.toDbDate(input.ngay_hh_email),
        input.phi_gh_email,

        input.gia_han_content,
        salesModel.toDbDate(input.ngay_hh_content),
        input.phi_gh_content,

        input.gia_han_ads,
        salesModel.toDbDate(input.ngay_hh_ads),
        input.phi_gh_ads,
      ]
    );

    const row = insertResult.rows[0];

    const payments = Array.isArray(input.danh_sach_thanh_toan) ? input.danh_sach_thanh_toan : [];

    for (const payment of payments) {
      await client.query(
        `
          INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [row.id, payment.lan_thanh_toan, payment.so_tien, salesModel.toDbDate(payment.ngay_thanh_toan), payment.ghi_chu]
      );
    }

    await client.query("COMMIT");
    return await getProjectById(Number(row.id));
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

async function updateProject(projectId, input) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateResult = await client.query(
      `
        UPDATE sales_projects
        SET
          ma_kh = $2,
          ma_du_an = $3,
          ten_khach = $4,
          sdt = $5,
          zalo_fb = $6,
          nguon_khach = $7,
          nhu_cau = $8,
          san_pham_dv = $9,
          website = $10,
          sale_id = $11,
          ky_thuat_id = $12,
          pm_id = $13,
          trang_thai_chot = $14,
          trang_thai_thu_tien = $15,
          trang_thai_trien_khai = $16,
          ngay_tao = $17,
          lich_hen = $18,
          ghi_chu = $19,
          ngay_cham_cuoi = $20,
          hinh_thuc_cham = $21,
          phi_dich_vu = $22,
          phat_sinh = $23,
          ngay_doi_cuoi = $24,
          so_lan_doi = $25,
          ngay_ban_giao = $26,
          ngay_tat_toan = $27,
          ly_do_lau = $28,
          chi_phi_outsource = $29,
          gia_han_domain = $30,
          ngay_hh_domain = $31,
          phi_gh_domain = $32,
          gia_han_hosting = $33,
          ngay_hh_hosting = $34,
          phi_gh_hosting = $35,
          gia_han_email = $36,
          ngay_hh_email = $37,
          phi_gh_email = $38,
          gia_han_content = $39,
          ngay_hh_content = $40,
          phi_gh_content = $41,
          gia_han_ads = $42,
          ngay_hh_ads = $43,
          phi_gh_ads = $44
        WHERE id = $1
        RETURNING *
      `,
      [
        projectId,
        input.ma_kh,
        input.ma_du_an,
        input.ten_khach,
        input.sdt,
        input.zalo_fb,
        input.nguon_khach,
        input.nhu_cau,
        input.san_pham_dv,
        input.website,
        input.sale_id,
        input.ky_thuat_id,
        input.pm_id,
        input.trang_thai_chot,
        input.trang_thai_thu_tien,
        input.trang_thai_trien_khai,
        salesModel.toDbDate(input.ngay_tao),
        salesModel.toDbDate(input.lich_hen),
        input.ghi_chu,
        salesModel.toDbDate(input.ngay_cham_cuoi),
        input.hinh_thuc_cham,
        input.phi_dich_vu,
        input.phat_sinh,
        salesModel.toDbDate(input.ngay_doi_cuoi),
        input.so_lan_doi,
        salesModel.toDbDate(input.ngay_ban_giao),
        salesModel.toDbDate(input.ngay_tat_toan),
        input.ly_do_lau,
        input.chi_phi_outsource,
        input.gia_han_domain,
        salesModel.toDbDate(input.ngay_hh_domain),
        input.phi_gh_domain,
        input.gia_han_hosting,
        salesModel.toDbDate(input.ngay_hh_hosting),
        input.phi_gh_hosting,
        input.gia_han_email,
        salesModel.toDbDate(input.ngay_hh_email),
        input.phi_gh_email,
        input.gia_han_content,
        salesModel.toDbDate(input.ngay_hh_content),
        input.phi_gh_content,

        input.gia_han_ads,
        salesModel.toDbDate(input.ngay_hh_ads),
        input.phi_gh_ads,
      ]
    );

    if (!updateResult.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("DELETE FROM sales_payments WHERE project_id = $1", [projectId]);

    const payments = Array.isArray(input.danh_sach_thanh_toan) ? input.danh_sach_thanh_toan : [];

    for (const payment of payments) {
      await client.query(
        `
          INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [projectId, payment.lan_thanh_toan, payment.so_tien, salesModel.toDbDate(payment.ngay_thanh_toan), payment.ghi_chu]
      );
    }

    await client.query("COMMIT");
    return await getProjectById(projectId);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
};
