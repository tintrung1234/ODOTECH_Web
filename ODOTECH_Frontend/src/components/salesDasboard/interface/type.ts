export interface Payment {
  id: number;
  lan_thanh_toan: number;
  so_tien: number;
  ngay_thanh_toan: string; // YYYY-MM-DD
  ghi_chu: string;
}

export interface ProjectData {
  id: number;
  // Thông tin chung
  ma_kh: string;
  ma_du_an: string;
  ten_khach: string;
  sdt: string;
  zalo_fb: string;
  nguon_khach: string;
  nhu_cau: string;
  san_pham_dv: string;
  website: string;
  
  // Nhân sự
  sale_id: string; // Tên hoặc ID sale
  ky_thuat_id: string;

  // Trạng thái & Chăm sóc
  trang_thai_chot: 'DangCham' | 'DaKy' | 'Huy';
  trang_thai_thu_tien: 'Chua' | 'MotPhan' | 'Du';
  trang_thai_trien_khai: string; // Read-only từ PM
  ngay_tao: string;
  lich_hen: string;
  ghi_chu: string;
  ngay_cham_cuoi: string;
  hinh_thuc_cham: string;

  // Tài chính
  phi_dich_vu: number;
  phat_sinh: number;
  ngay_doi_cuoi: string;
  so_lan_doi: number;
  danh_sach_thanh_toan: Payment[];

  // Triển khai & Tất toán
  ngay_ban_giao: string; // Read-only
  ngay_tat_toan: string;
  ly_do_lau: string;
  chi_phi_outsource: number;

  // Gia hạn (Demo 2 trường đại diện)
  gia_han_domain: boolean;
  ngay_hh_domain: string;
  phi_gh_domain: number;
  
  gia_han_hosting: boolean;
  ngay_hh_hosting: string;
  phi_gh_hosting: number;

  gia_han_email: boolean;
  ngay_hh_email: string;
  phi_gh_email: number;

  gia_han_content: boolean;
  gia_han_ads: boolean;
}