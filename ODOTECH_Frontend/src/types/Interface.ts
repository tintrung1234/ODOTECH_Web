export interface Account {
  id: number;
  hoTen: string;
  chucVu: string;
  email: string;
  bankName: string;
  bankAccountNumber: string;
  soNgayPhep: number;
  nguoiQuanLy: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: number;
  accountId: number;
  tuNgay: string; // ISO date
  denNgay: string; // ISO date
  lyDo: string;
  trangThai: LeaveStatus;
  ngayTao: string; // ISO date
  nguoiDuyet?: string;
  ngayXuLy?: string; // ISO date
  ghiChu?: string;
}

export type CustomerCategory = 'new' | 'potential' | 'loyal';

export interface CustomerPurchase {
  id: number;
  ngayMua: string; // ISO date
  giaTri: number;
  ghiChu?: string;
}

export interface CustomerCareNote {
  id: number;
  ngayTao: string; // ISO date
  noiDung: string;
  ngayNhac?: string; // ISO date (follow-up reminder)
}

export interface Customer {
  id: number;
  tenKhachHang: string;
  soDienThoai?: string;
  email?: string;
  khuVuc: string;
  nhanVienPhuTrach: string;
  phanLoai: CustomerCategory;
  lichSuMuaHang: CustomerPurchase[];
  ghiChuChamSoc: CustomerCareNote[];
  ngayTao: string; // ISO date
  ngayCapNhat?: string; // ISO date
}
