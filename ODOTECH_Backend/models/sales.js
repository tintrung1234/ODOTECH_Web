function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function toDbDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function mapSalesProjectRow(row) {
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
    pm_id: row.pm_id ?? "",

    trang_thai_chot: row.trang_thai_chot ?? "DangCham",
    trang_thai_thu_tien: row.trang_thai_thu_tien ?? "Chua",

    // Derive deployment status from projects.status when matching project_code = ma_du_an
    trang_thai_trien_khai: row.project_status ?? row.trang_thai_trien_khai ?? "",

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

    // Derive handover date from projects.completed_at when matching project_code = ma_du_an
    ngay_ban_giao: formatDate(row.project_completed_at ?? row.ngay_ban_giao),
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

function mapSalesPaymentRow(row) {
  return {
    id: Number(row.id),
    lan_thanh_toan: Number(row.lan_thanh_toan),
    so_tien: Number(row.so_tien),
    ngay_thanh_toan: formatDate(row.ngay_thanh_toan),
    ghi_chu: row.ghi_chu ?? "",
  };
}

module.exports = {
  formatDate,
  toDbDate,
  mapSalesProjectRow,
  mapSalesPaymentRow,
};
