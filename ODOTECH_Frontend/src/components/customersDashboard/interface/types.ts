export type Customer = {
    id: number;
    ma_kh: string;
    ten_khach: string;
    sdt: string;
    zalo_fb: string;
    nguon_khach: string;
    nhu_cau: string;
    san_pham_dv: string;
    website: string;
    sale_id: string | number | null;
    pm_id: string | number | null;
    ngay_tao: string;
    total_projects?: number;
    total_revenue?: number;
};

export type CustomerProject = {
    id: number;
    ma_du_an: string;
    ten_khach: string;
    website: string;
    trang_thai_chot: string;
    trang_thai_thu_tien: string;
    trang_thai_trien_khai: string;
    ngay_tao: string;
    phi_dich_vu: number;
    phat_sinh: number;
    ngay_ban_giao: string;
    sale_id: string | number | null;
    pm_id: string | number | null;
    nhu_cau: string;
    san_pham_dv: string;
};
