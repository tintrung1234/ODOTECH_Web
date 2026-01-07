function formatDate(value) {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return String(value);
}

function mapCustomerRow(row) {
    return {
        id: Number(row.id),
        ma_kh: row.ma_kh ?? "",
        ten_khach: row.ten_khach ?? "",
        sdt: row.sdt ?? "",
        zalo_fb: row.zalo_fb ?? "",
        nguon_khach: row.nguon_khach ?? "",
        nhu_cau: row.nhu_cau ?? "",
        san_pham_dv: row.san_pham_dv ?? "",
        website: row.website ?? "",
        sale_id: row.sale_id ?? null,
        pm_id: row.pm_id ?? null,
        ngay_tao: formatDate(row.ngay_tao),
        total_projects: Number(row.total_projects || 0),
        total_revenue: Number(row.total_revenue || 0),
    };
}

function mapCustomerProjectRow(row) {
    return {
        id: Number(row.id),
        ma_du_an: row.ma_du_an ?? "",
        ten_khach: row.ten_khach ?? "",
        website: row.website ?? "",
        trang_thai_chot: row.trang_thai_chot ?? "",
        trang_thai_thu_tien: row.trang_thai_thu_tien ?? "",
        trang_thai_trien_khai: row.trang_thai_trien_khai ?? "",
        ngay_tao: formatDate(row.ngay_tao),
        phi_dich_vu: Number(row.phi_dich_vu ?? 0),
        phat_sinh: Number(row.phat_sinh ?? 0),
        ngay_ban_giao: formatDate(row.ngay_ban_giao),
        sale_id: row.sale_id ?? null,
        pm_id: row.pm_id ?? null,
        nhu_cau: row.nhu_cau ?? "",
        san_pham_dv: row.san_pham_dv ?? "",
    };
}

module.exports = {
    formatDate,
    mapCustomerRow,
    mapCustomerProjectRow,
};
