const { pool } = require("../config/postgres");

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function mapProjectRow(row) {
  return {
    id: Number(row.id),
    ma_kh: row.ma_kh ?? "",
    ma_du_an: row.ma_du_an ?? "",
    ten_khach: row.ten_khach ?? "",
    sdt: row.sdt ?? "",
    zalo_fb: row.zalo_fb ?? "",
    nguon_khach: row.nguon_khach ?? "",
    nhu_cau: row.nhu_cau ?? "",
    san_pham_dv: row.san_pham_dv ?? "",
    website: row.website ?? "",

    sale_id: row.sale_id ?? "",
    ky_thuat_id: row.ky_thuat_id ?? "",

    trang_thai_chot: row.trang_thai_chot ?? "DangCham",
    trang_thai_thu_tien: row.trang_thai_thu_tien ?? "Chua",
    trang_thai_trien_khai: row.trang_thai_trien_khai ?? "",
    ngay_tao: formatDate(row.ngay_tao),
    lich_hen: formatDate(row.lich_hen),
    ghi_chu: row.ghi_chu ?? "",
    ngay_cham_cuoi: formatDate(row.ngay_cham_cuoi),
    hinh_thuc_cham: row.hinh_thuc_cham ?? "",

    phi_dich_vu: Number(row.phi_dich_vu ?? 0),
    phat_sinh: Number(row.phat_sinh ?? 0),
    ngay_doi_cuoi: formatDate(row.ngay_doi_cuoi),
    so_lan_doi: Number(row.so_lan_doi ?? 0),
    danh_sach_thanh_toan: [],

    ngay_ban_giao: formatDate(row.ngay_ban_giao),
    ngay_tat_toan: formatDate(row.ngay_tat_toan),
    ly_do_lau: row.ly_do_lau ?? "",
    chi_phi_outsource: Number(row.chi_phi_outsource ?? 0),

    gia_han_domain: Boolean(row.gia_han_domain),
    ngay_hh_domain: formatDate(row.ngay_hh_domain),
    phi_gh_domain: Number(row.phi_gh_domain ?? 0),

    gia_han_hosting: Boolean(row.gia_han_hosting),
    ngay_hh_hosting: formatDate(row.ngay_hh_hosting),
    phi_gh_hosting: Number(row.phi_gh_hosting ?? 0),

    gia_han_email: Boolean(row.gia_han_email),
    ngay_hh_email: formatDate(row.ngay_hh_email),
    phi_gh_email: Number(row.phi_gh_email ?? 0),

    gia_han_content: Boolean(row.gia_han_content),
    gia_han_ads: Boolean(row.gia_han_ads),
  };
}

function mapPaymentRow(row) {
  return {
    id: Number(row.id),
    lan_thanh_toan: Number(row.lan_thanh_toan),
    so_tien: Number(row.so_tien),
    ngay_thanh_toan: formatDate(row.ngay_thanh_toan),
    ghi_chu: row.ghi_chu ?? "",
  };
}

function toDbDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

async function listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`(LOWER(ten_khach) LIKE $${params.length} OR LOWER(ma_du_an) LIKE $${params.length})`);
  }

  if (trang_thai_chot) {
    params.push(trang_thai_chot);
    where.push(`trang_thai_chot = $${params.length}`);
  }

  if (trang_thai_thu_tien) {
    params.push(trang_thai_thu_tien);
    where.push(`trang_thai_thu_tien = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const listSql = `
    SELECT *
    FROM sales_projects
    ${whereSql}
    ORDER BY id DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `SELECT COUNT(*)::int AS total FROM sales_projects ${whereSql}`;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    items: listResult.rows.map(mapProjectRow),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getProjectById(projectId) {
  const projectResult = await pool.query(
    `
      SELECT *
      FROM sales_projects
      WHERE id = $1
      LIMIT 1
    `,
    [projectId]
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

  const project = mapProjectRow(projectRow);
  project.danh_sach_thanh_toan = paymentsResult.rows.map(mapPaymentRow);
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
          sale_id, ky_thuat_id,
          trang_thai_chot, trang_thai_thu_tien, trang_thai_trien_khai,
          ngay_tao, lich_hen, ghi_chu, ngay_cham_cuoi, hinh_thuc_cham,
          phi_dich_vu, phat_sinh, ngay_doi_cuoi, so_lan_doi,
          ngay_ban_giao, ngay_tat_toan, ly_do_lau, chi_phi_outsource,
          gia_han_domain, ngay_hh_domain, phi_gh_domain,
          gia_han_hosting, ngay_hh_hosting, phi_gh_hosting,
          gia_han_email, ngay_hh_email, phi_gh_email,
          gia_han_content, gia_han_ads
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,
          $12,$13,$14,
          $15,$16,$17,$18,$19,
          $20,$21,$22,$23,
          $24,$25,$26,$27,
          $28,$29,$30,
          $31,$32,$33,
          $34,$35,$36,
          $37,$38
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

        input.trang_thai_chot,
        input.trang_thai_thu_tien,
        input.trang_thai_trien_khai,

        toDbDate(input.ngay_tao),
        toDbDate(input.lich_hen),
        input.ghi_chu,
        toDbDate(input.ngay_cham_cuoi),
        input.hinh_thuc_cham,

        input.phi_dich_vu,
        input.phat_sinh,
        toDbDate(input.ngay_doi_cuoi),
        input.so_lan_doi,

        toDbDate(input.ngay_ban_giao),
        toDbDate(input.ngay_tat_toan),
        input.ly_do_lau,
        input.chi_phi_outsource,

        input.gia_han_domain,
        toDbDate(input.ngay_hh_domain),
        input.phi_gh_domain,

        input.gia_han_hosting,
        toDbDate(input.ngay_hh_hosting),
        input.phi_gh_hosting,

        input.gia_han_email,
        toDbDate(input.ngay_hh_email),
        input.phi_gh_email,

        input.gia_han_content,
        input.gia_han_ads,
      ]
    );

    const row = insertResult.rows[0];

    const payments = Array.isArray(input.danh_sach_thanh_toan)
      ? input.danh_sach_thanh_toan
      : [];

    for (const payment of payments) {
      await client.query(
        `
          INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [row.id, payment.lan_thanh_toan, payment.so_tien, toDbDate(payment.ngay_thanh_toan), payment.ghi_chu]
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
          trang_thai_chot = $13,
          trang_thai_thu_tien = $14,
          trang_thai_trien_khai = $15,
          ngay_tao = $16,
          lich_hen = $17,
          ghi_chu = $18,
          ngay_cham_cuoi = $19,
          hinh_thuc_cham = $20,
          phi_dich_vu = $21,
          phat_sinh = $22,
          ngay_doi_cuoi = $23,
          so_lan_doi = $24,
          ngay_ban_giao = $25,
          ngay_tat_toan = $26,
          ly_do_lau = $27,
          chi_phi_outsource = $28,
          gia_han_domain = $29,
          ngay_hh_domain = $30,
          phi_gh_domain = $31,
          gia_han_hosting = $32,
          ngay_hh_hosting = $33,
          phi_gh_hosting = $34,
          gia_han_email = $35,
          ngay_hh_email = $36,
          phi_gh_email = $37,
          gia_han_content = $38,
          gia_han_ads = $39
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
        input.trang_thai_chot,
        input.trang_thai_thu_tien,
        input.trang_thai_trien_khai,
        toDbDate(input.ngay_tao),
        toDbDate(input.lich_hen),
        input.ghi_chu,
        toDbDate(input.ngay_cham_cuoi),
        input.hinh_thuc_cham,
        input.phi_dich_vu,
        input.phat_sinh,
        toDbDate(input.ngay_doi_cuoi),
        input.so_lan_doi,
        toDbDate(input.ngay_ban_giao),
        toDbDate(input.ngay_tat_toan),
        input.ly_do_lau,
        input.chi_phi_outsource,
        input.gia_han_domain,
        toDbDate(input.ngay_hh_domain),
        input.phi_gh_domain,
        input.gia_han_hosting,
        toDbDate(input.ngay_hh_hosting),
        input.phi_gh_hosting,
        input.gia_han_email,
        toDbDate(input.ngay_hh_email),
        input.phi_gh_email,
        input.gia_han_content,
        input.gia_han_ads,
      ]
    );

    if (!updateResult.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("DELETE FROM sales_payments WHERE project_id = $1", [projectId]);

    const payments = Array.isArray(input.danh_sach_thanh_toan)
      ? input.danh_sach_thanh_toan
      : [];

    for (const payment of payments) {
      await client.query(
        `
          INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [projectId, payment.lan_thanh_toan, payment.so_tien, toDbDate(payment.ngay_thanh_toan), payment.ghi_chu]
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
