function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function mapRenewalItemRow(row) {
  return {
    sales_project_id: Number(row.sales_project_id),
    ma_kh: row.ma_kh ?? "",
    ma_du_an: row.ma_du_an ?? "",
    ten_khach: row.ten_khach ?? "",
    website: row.website ?? "",

    sale_id: row.sale_id ?? "",
    pm_id: row.pm_id ?? "",

    kind: row.kind ?? "",

    ngay_dang_ky: formatDate(row.ngay_dang_ky),
    ngay_gia_han: formatDate(row.ngay_gia_han),

    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),

    provider: row.provider ?? "",
    management_place: row.management_place ?? "",
    management_url: row.management_url ?? "",

    login_username: row.login_username ?? "",
    has_password: Boolean(row.has_password),

    hosting_used_mb: row.hosting_used_mb === null || row.hosting_used_mb === undefined ? null : Number(row.hosting_used_mb),
    hosting_limit_mb: row.hosting_limit_mb === null || row.hosting_limit_mb === undefined ? null : Number(row.hosting_limit_mb),

    due_status: row.due_status ?? "",
  };
}

module.exports = {
  mapRenewalItemRow,
};
