const { pool } = require("../config/postgres");
const renewalsModel = require("../models/renewals");

function clampInt(value, fallback, { min, max }) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

function computeDueStatusSql() {
  // expiring if due date within 30 days
  return `
    CASE
      WHEN ngay_gia_han IS NULL THEN ''
      WHEN ngay_gia_han < CURRENT_DATE THEN 'expired'
      WHEN ngay_gia_han <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring'
      ELSE 'active'
    END
  `;
}

async function listRenewalItems({
  limit,
  offset,
  q,
  kind,
  sale_id,
  pm_id,
  due,
  redactMoney,
}) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${String(q).toLowerCase()}%`);
    where.push(
      `(
        LOWER(COALESCE(sp.ma_kh,'')) LIKE $${params.length}
        OR LOWER(COALESCE(sp.ma_du_an,'')) LIKE $${params.length}
        OR LOWER(COALESCE(sp.ten_khach,'')) LIKE $${params.length}
        OR LOWER(COALESCE(sp.website,'')) LIKE $${params.length}
        OR LOWER(COALESCE(sp.sale_id,'')) LIKE $${params.length}
        OR LOWER(COALESCE(rp.provider,'')) LIKE $${params.length}
      )`
    );
  }

  if (kind) {
    params.push(kind);
    where.push(`items.kind = $${params.length}`);
  }

  if (sale_id) {
    params.push(sale_id);
    where.push(`sp.sale_id = $${params.length}`);
  }

  if (pm_id) {
    params.push(pm_id);
    where.push(`sp.pm_id = $${params.length}`);
  }

  if (due) {
    params.push(due);
    where.push(`${computeDueStatusSql()} = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const dueStatusExpr = computeDueStatusSql();

  const listSql = `
    WITH auto AS (
      SELECT
        sp.id AS sales_project_id,
        sp.ma_kh,
        sp.ma_du_an,
        sp.ten_khach,
        sp.website,
        sp.sale_id,
        sp.pm_id,
        sp.ngay_tao AS ngay_dang_ky,
        v.kind,
        v.ngay_gia_han AS base_ngay_gia_han,
        v.amount AS base_amount
      FROM sales_projects sp
      CROSS JOIN LATERAL (
        VALUES
          ('domain',  sp.gia_han_domain,  sp.ngay_hh_domain,  sp.phi_gh_domain),
          ('hosting', sp.gia_han_hosting, sp.ngay_hh_hosting, sp.phi_gh_hosting),
          ('email',   sp.gia_han_email,   sp.ngay_hh_email,   sp.phi_gh_email),
          ('content', sp.gia_han_content, sp.ngay_hh_content, sp.phi_gh_content),
          ('ads',     sp.gia_han_ads,     sp.ngay_hh_ads,     sp.phi_gh_ads)
      ) AS v(kind, enabled, ngay_gia_han, amount)
      WHERE v.enabled = TRUE
    ),
    manual AS (
      SELECT
        sp.id AS sales_project_id,
        sp.ma_kh,
        sp.ma_du_an,
        sp.ten_khach,
        sp.website,
        sp.sale_id,
        sp.pm_id,
        sp.ngay_tao AS ngay_dang_ky,
        rp.kind,
        rp.renewal_date AS base_ngay_gia_han,
        rp.amount AS base_amount
      FROM renewal_packages rp
      JOIN sales_projects sp ON sp.id = rp.sales_project_id
      WHERE rp.enabled = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM auto a
          WHERE a.sales_project_id = rp.sales_project_id
            AND a.kind = rp.kind
        )
    ),
    base AS (
      SELECT * FROM auto
      UNION ALL
      SELECT * FROM manual
    ),
    items AS (
      SELECT
        b.sales_project_id,
        b.ma_kh,
        b.ma_du_an,
        b.ten_khach,
        b.website,
        b.sale_id,
        b.pm_id,
        b.ngay_dang_ky,
        b.kind,
        COALESCE(rp.renewal_date, b.base_ngay_gia_han) AS ngay_gia_han,
        COALESCE(rp.amount, b.base_amount) AS amount,
        rp.provider,
        rp.management_place,
        rp.management_url,
        rp.login_username,
        (rp.login_password IS NOT NULL AND rp.login_password <> '') AS has_password,
        rp.hosting_used_mb,
        rp.hosting_limit_mb
      FROM base b
      LEFT JOIN renewal_packages rp
        ON rp.sales_project_id = b.sales_project_id
       AND rp.kind = b.kind
    )
    SELECT
      items.sales_project_id,
      items.ma_kh,
      items.ma_du_an,
      items.ten_khach,
      items.website,
      items.sale_id,
      items.pm_id,
      items.ngay_dang_ky,
      items.kind,
      items.ngay_gia_han,
      ${redactMoney ? "NULL::bigint" : "items.amount"} AS amount,
      items.provider,
      items.management_place,
      items.management_url,
      items.login_username,
      items.has_password,
      items.hosting_used_mb,
      items.hosting_limit_mb,
      ${dueStatusExpr} AS due_status
    FROM items
    LEFT JOIN sales_projects sp ON sp.id = items.sales_project_id
    LEFT JOIN renewal_packages rp ON rp.sales_project_id = items.sales_project_id AND rp.kind = items.kind
    ${whereSql}
    ORDER BY ngay_gia_han ASC NULLS LAST, items.ten_khach ASC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countSql = `
    WITH auto AS (
      SELECT
        sp.id AS sales_project_id,
        v.kind,
        v.ngay_gia_han AS base_ngay_gia_han,
        v.amount AS base_amount
      FROM sales_projects sp
      CROSS JOIN LATERAL (
        VALUES
          ('domain',  sp.gia_han_domain,  sp.ngay_hh_domain,  sp.phi_gh_domain),
          ('hosting', sp.gia_han_hosting, sp.ngay_hh_hosting, sp.phi_gh_hosting),
          ('email',   sp.gia_han_email,   sp.ngay_hh_email,   sp.phi_gh_email),
          ('content', sp.gia_han_content, sp.ngay_hh_content, sp.phi_gh_content),
          ('ads',     sp.gia_han_ads,     sp.ngay_hh_ads,     sp.phi_gh_ads)
      ) AS v(kind, enabled, ngay_gia_han, amount)
      WHERE v.enabled = TRUE
    ),
    manual AS (
      SELECT
        rp.sales_project_id,
        rp.kind,
        rp.renewal_date AS base_ngay_gia_han,
        rp.amount AS base_amount
      FROM renewal_packages rp
      WHERE rp.enabled = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM auto a
          WHERE a.sales_project_id = rp.sales_project_id
            AND a.kind = rp.kind
        )
    ),
    base AS (
      SELECT * FROM auto
      UNION ALL
      SELECT * FROM manual
    ),
    items AS (
      SELECT
        b.sales_project_id,
        b.kind,
        COALESCE(rp.renewal_date, b.base_ngay_gia_han) AS ngay_gia_han,
        COALESCE(rp.amount, b.base_amount) AS amount
      FROM base b
      LEFT JOIN renewal_packages rp
        ON rp.sales_project_id = b.sales_project_id
       AND rp.kind = b.kind
    )
    SELECT COUNT(*)::int AS total
    FROM items
    LEFT JOIN sales_projects sp ON sp.id = items.sales_project_id
    LEFT JOIN renewal_packages rp ON rp.sales_project_id = items.sales_project_id AND rp.kind = items.kind
    ${whereSql}
  `;

  const [listResult, countResult] = await Promise.all([
    pool.query(listSql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    items: listResult.rows.map(renewalsModel.mapRenewalItemRow),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function upsertRenewalPackage({
  sales_project_id,
  kind,
  enabled,
  renewal_date,
  amount,
  provider,
  management_place,
  management_url,
  login_username,
  login_password,
  hosting_used_mb,
  hosting_limit_mb,
}) {
  const result = await pool.query(
    `
      INSERT INTO renewal_packages (
        sales_project_id, kind, enabled, renewal_date, amount,
        provider, management_place, management_url,
        login_username, login_password,
        hosting_used_mb, hosting_limit_mb,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,
        $11,$12,
        NOW()
      )
      ON CONFLICT (sales_project_id, kind)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        renewal_date = EXCLUDED.renewal_date,
        amount = EXCLUDED.amount,
        provider = EXCLUDED.provider,
        management_place = EXCLUDED.management_place,
        management_url = EXCLUDED.management_url,
        login_username = EXCLUDED.login_username,
        login_password = COALESCE(EXCLUDED.login_password, renewal_packages.login_password),
        hosting_used_mb = EXCLUDED.hosting_used_mb,
        hosting_limit_mb = EXCLUDED.hosting_limit_mb,
        updated_at = NOW()
      RETURNING id
    `,
    [
      sales_project_id,
      kind,
      enabled,
      renewal_date || null,
      amount === null || amount === undefined ? null : amount,
      provider || null,
      management_place || null,
      management_url || null,
      login_username || null,
      login_password || null,
      hosting_used_mb === null || hosting_used_mb === undefined ? null : hosting_used_mb,
      hosting_limit_mb === null || hosting_limit_mb === undefined ? null : hosting_limit_mb,
    ]
  );

  return Number(result.rows[0]?.id);
}

async function getRenewalPackageByProjectAndKind({ sales_project_id, kind }) {
  const result = await pool.query(
    `
      SELECT
        id,
        sales_project_id,
        kind,
        login_username,
        login_password
      FROM renewal_packages
      WHERE sales_project_id = $1 AND kind = $2
      LIMIT 1
    `,
    [sales_project_id, kind]
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    sales_project_id: Number(row.sales_project_id),
    kind: row.kind,
    login_username: row.login_username ?? "",
    login_password: row.login_password ?? "",
  };
}

async function logCredentialAccess({ renewal_package_id, requested_by_uid, requested_by_username, requested_by_name }) {
  await pool.query(
    `
      INSERT INTO renewal_credential_access_logs (
        renewal_package_id, requested_by_uid, requested_by_username, requested_by_name
      ) VALUES ($1,$2,$3,$4)
    `,
    [renewal_package_id, requested_by_uid, requested_by_username || null, requested_by_name || null]
  );
}

module.exports = {
  clampInt,
  listRenewalItems,
  upsertRenewalPackage,
  getRenewalPackageByProjectAndKind,
  logCredentialAccess,
};
