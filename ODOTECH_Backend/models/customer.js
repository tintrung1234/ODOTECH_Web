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

/**
 * Map customer row from database to API response
 */
function mapCustomerRow(row) {
    return {
        id: Number(row.id),
        ma_kh: row.ma_kh ?? "",
        name: row.name ?? row.ten_khach ?? "",
        phone: row.phone ?? row.sdt ?? "",
        email: row.email ?? "",
        zalo_fb: row.zalo_fb ?? "",
        company: row.company ?? row.cong_ty ?? "",
        nguon_khach: row.nguon_khach ?? "",
        nhu_cau: row.nhu_cau ?? "",
        san_pham_dv: row.san_pham_dv ?? "",
        website: row.website ?? "",
        sale_id: row.sale_id ?? null,
        created_at: formatDate(row.created_at ?? row.ngay_tao),
        updated_at: formatDate(row.updated_at),
        total_projects: Number(row.total_projects || 0),
        total_revenue: Number(row.total_revenue || 0),
    };
}

/**
 * Map customer project row
 */
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

/**
 * Validate customer data
 */
function validateCustomerData(data) {
    const errors = [];

    if (!data.ma_kh || typeof data.ma_kh !== 'string' || data.ma_kh.trim() === '') {
        errors.push('ma_kh is required and must be a non-empty string');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('email must be a valid email address');
    }

    if (data.phone && !/^[0-9+\-\s()]+$/.test(data.phone)) {
        errors.push('phone must contain only numbers and valid characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

module.exports = {
    formatDate,
    mapCustomerRow,
    mapCustomerProjectRow,
    validateCustomerData,
};
