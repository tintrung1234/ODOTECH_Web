export interface CompetencyFramework {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  others?: string[];
}

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin (Quản trị hệ thống)' },
  { value: 'support', label: 'Hỗ trợ tổng' },
  { value: 'sale', label: 'Sale' },
  { value: 'sales_manager', label: 'Quản lý Sale' },
  { value: 'head_sales', label: 'Trưởng phòng Kinh doanh' },
  { value: 'dev', label: 'Lập trình viên (Dev)' },
  { value: 'dev_manager', label: 'Quản lý Dev' },
  { value: 'head_tech', label: 'Trưởng phòng Kỹ thuật' },
  { value: 'customer', label: 'Khách hàng' },
];

export const POSITION_OPTIONS = [
  { value: 'Developer', label: 'Lập trình viên' },
  { value: 'Tester', label: 'Kiểm thử' },
  { value: 'Business Analyst', label: 'BA' },
  { value: 'Project Manager', label: 'PM' },
  { value: 'Designer', label: 'Thiết kế' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'HR', label: 'Nhân sự' },
  { value: 'Accountant', label: 'Kế toán' },
  { value: 'Director', label: 'Giám đốc' },
  { value: 'Intern', label: 'Thực tập sinh' },
  { value: 'Sale', label: 'Sale' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Chính thức' },
  { value: 'probation', label: 'Thử việc' },
  { value: 'inactive', label: 'Nghỉ việc' },
  { value: 'collaborator', label: 'Cộng tác viên' },
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'Intern', label: 'Intern (Thực tập sinh)' },
  { value: 'Thử việc', label: 'Thử việc (Probation)' },
  { value: 'Chính thức', label: 'Chính thức (Permanent)' },
  { value: 'Hợp đồng 1 năm', label: 'Hợp đồng 1 năm' },
  { value: 'Hợp đồng 2 năm', label: 'Hợp đồng 2 năm' },
  { value: 'Hợp đồng 3 năm', label: 'Hợp đồng 3 năm' },
  { value: 'Freelance', label: 'Freelance' },
];

export interface ContractRenewal {
  renewalDate: string; // ISO date
  previousEnd: string; // ISO date
  newEnd: string; // ISO date
  contractType: string;
  notes?: string;
}

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
  competency_framework?: CompetencyFramework;
  contract_start?: string; // ISO date
  contract_end?: string; // ISO date
  contract_type?: string;
  renewal_history?: ContractRenewal[];
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

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: number;
  tieuDe: string;
  nguoiPhuTrach: number | null;
  nguoiChinh?: number | null;
  nguoiHoTro?: number | null;
  batDau?: string; // ISO date
  hanChot: string; // ISO date
  trangThai: TaskStatus;
  tienDo?: number; // 0-100
  gioCong?: number;
  mucUuTien?: TaskPriority | '';
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

export type ProjectMgmtStatus =
  | 'Đợi sắp xếp'
  | 'Đang làm'
  | 'Chờ thêm thông tin'
  | 'Đợi khách duyệt - feedback'
  | 'Hoàn thành đợi tất toán'
  | 'Đã thông báo thanh toán'
  | 'Kết thúc hài lòng'
  | 'Kết thúc thất vọng'
  | 'Nhờ sale réo khách'
  // Backward compatibility with existing data
  | 'not_started'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'late';
export type ProjectMgmtPriority = '' | 'low' | 'medium' | 'high' | 'urgent';

export type ProjectType = '' | 'Khách' | 'Nội bộ' | 'Đào tạo';

export interface ProjectManagementItem {
  id: number;
  project_code: string;
  project_type: ProjectType;
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

  requirements?: string;
  source?: string;
  progress_percent?: number;
  assignee?: string;
  tech_user_id?: number | null;
  customer_sender_id?: number | null;

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Training System Types
export type CourseCategory = 'general' | 'technical' | 'soft-skills' | 'compliance' | 'product';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number | null;
  category: CourseCategory;
  level: CourseLevel;
  duration_hours: number;
  thumbnail_url: string;
  content: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export type QuestionType = 'multiple_choice' | 'true_false';

export interface TestQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options: string[];
  correct_answer: number;
  points: number;
}

export type TestStatus = 'draft' | 'active' | 'archived';

export interface Test {
  id: number;
  course_id: number | null;
  title: string;
  description: string;
  questions: TestQuestion[];
  duration_minutes: number;
  passing_score: number;
  max_attempts: number;
  status: TestStatus;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped';

export interface CourseEnrollment {
  id: number;
  course_id: number;
  account_id: number;
  enrolled_at: string;
  completed_at: string | null;
  progress: number;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
  course_title?: string;
  category?: string;
  level?: string;
}

export interface TestResult {
  id: number;
  test_id: number;
  account_id: number;
  enrollment_id: number | null;
  answers: Record<number, number>;
  score: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  submitted_at: string;
  created_at: string;
  test_title?: string;
  passing_score?: number;
}

