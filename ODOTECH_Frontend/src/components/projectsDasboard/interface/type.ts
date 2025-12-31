export interface Account {
  id: number; // ID nhân sự
  username: string; // Tên đăng nhập
  name: string; // Họ tên
  email: string; // Email đăng nhập (duy nhất)
  phone: string; // SĐT
  role_system: string; // Quyền toàn hệ thống
  point: number; // Điểm đánh giá cá nhân
  position: string; // Chức danh
  salary: number; // Lương
  payable: number; // công nợ
  join_date: string; // ISO date
  status: string; // Trạng thái làm việc
  password_hash: string; // Mật khẩu mã hoá
  last_login_at: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
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

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'late';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'Chưa làm' | 'Đang làm' | 'Đã xong';

export interface ProjectTask {
  id: number;
  tieuDe: string;
  nguoiPhuTrach: string;
  hanChot: string; // ISO date
  trangThai: TaskStatus;
  ghiChu?: string;
}

export interface ProjectItem {
  id: number;
  tenDuAn: string;
  moTa: string;
  khachHang: string;
  ngayBatDau: string; // ISO date
  ngayKetThuc: string; // ISO date
  mucDoUuTien: ProjectPriority;
  pm: string;
  trangThai: ProjectStatus;
  tienDo: number; // 0-100
  soTask: number;
  taskQuaHan: number;
  thanhVien: string[];
  taiLieu: string[]; // file names
  tasks?: ProjectTask[];
  ghiChu: string;
}

export type ProjectMgmtStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'late';
export type ProjectMgmtPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectManagementItem {
  id: number;
  project_code: string;
  project_type: string;
  name: string;
  client_id: number | null;
  sale_id: number | null;
  pm_id: number | null;
  status: ProjectMgmtStatus;
  priority: ProjectMgmtPriority;
  budget: number;
  contract_value: number;
  actual_cost: number;
  deposit_received: number;
  payment_status: string;
  total_hours: number;
  technology_stack: string;
  domain_url: string;
  production_url: string;
  start_date: string; // ISO date
  deadline: string; // ISO date
  completed_at: string; // ISO timestamp
  description: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
