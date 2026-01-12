import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectData, Payment, StaffId } from './interface/type';
import { formatCurrency, getWeeksDiff, formatDate } from '../../utils/formatDate';
import type { Account } from '../../interface/type';
import { normalizeRole } from '../../utils/auth';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  Layout,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Rocket,
  Save,
  Server,
  User
} from 'lucide-react';
import './style.css';

// Utility Types & Functions
type QldaStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'late';

function toIsoDateYmd(value: unknown): string {
  if (value === undefined || value === null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);
  return raw;
}

function normalizeProjectDatesForSave(data: ProjectData): ProjectData {
  return {
    ...data,
    ngay_tao: toIsoDateYmd(data.ngay_tao),
    lich_hen: toIsoDateYmd(data.lich_hen),
    ngay_cham_cuoi: toIsoDateYmd(data.ngay_cham_cuoi),

    ngay_doi_cuoi: toIsoDateYmd(data.ngay_doi_cuoi),
    ngay_ban_giao: toIsoDateYmd(data.ngay_ban_giao),
    ngay_tat_toan: toIsoDateYmd(data.ngay_tat_toan),

    ngay_hh_domain: toIsoDateYmd(data.ngay_hh_domain),
    ngay_hh_hosting: toIsoDateYmd(data.ngay_hh_hosting),
    ngay_hh_email: toIsoDateYmd(data.ngay_hh_email),
    ngay_hh_content: toIsoDateYmd(data.ngay_hh_content),
    ngay_hh_ads: toIsoDateYmd(data.ngay_hh_ads),

    danh_sach_thanh_toan: (Array.isArray(data.danh_sach_thanh_toan) ? data.danh_sach_thanh_toan : []).map((p) => ({
      ...p,
      ngay_thanh_toan: toIsoDateYmd(p.ngay_thanh_toan),
    })),
  };
}

function normalizeQldaStatus(value: string | undefined | null): QldaStatus | null {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  const compact = raw.replace(/[\s_-]+/g, '');
  if (raw === 'not_started' || compact === 'notstarted') return 'not_started';
  if (raw === 'in_progress' || compact === 'inprogress') return 'in_progress';
  if (raw === 'on_hold' || compact === 'onhold') return 'on_hold';
  if (raw === 'completed' || compact === 'completed') return 'completed';
  if (raw === 'late' || compact === 'late') return 'late';
  return null;
}

function qldaStatusLabel(status: QldaStatus): string {
  if (status === 'not_started') return 'Chưa bắt đầu';
  if (status === 'in_progress') return 'Đang thực hiện';
  if (status === 'on_hold') return 'Tạm dừng';
  if (status === 'completed') return 'Hoàn thành';
  return 'Trễ tiến độ';
}

function qldaStatusStyle(status: QldaStatus) {
  if (status === 'completed') return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
  if (status === 'late') return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  if (status === 'on_hold') return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
  if (status === 'not_started') return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
}

// Helper Components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SectionHeader = ({ icon: Icon, title, colorClass }: { icon: any, title: string, colorClass: string }) => (
  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon size={18} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

const InputGroup = ({ label, children, className = '' }: { label: string, children: React.ReactNode, className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

// Tabs Components
const TabInfo = ({
  data,
  handleChange,
}: {
  data: ProjectData;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
    {/* Customer Info */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <SectionHeader icon={User} title="Thông tin Khách hàng" colorClass="text-blue-600 bg-blue-600" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <InputGroup label="Mã Khách Hàng">
          <input className="input-field font-mono text-blue-600 font-medium" name="ma_kh" value={data.ma_kh} onChange={handleChange} placeholder="VD: KH001" />
        </InputGroup>
        <InputGroup label="Tên Khách Hàng">
          <input className="input-field font-semibold" name="ten_khach" value={data.ten_khach} onChange={handleChange} placeholder="Họ và tên..." />
        </InputGroup>
        <InputGroup label="Số Điện Thoại">
          <input className="input-field" name="sdt" value={data.sdt} onChange={handleChange} placeholder="SĐT liên hệ" />
        </InputGroup>
        <InputGroup label="Zalo / Facebook">
          <input className="input-field" name="zalo_fb" value={data.zalo_fb} onChange={handleChange} placeholder="https://..." />
        </InputGroup>
        <div className="md:col-span-2">
          <InputGroup label="Nguồn Khách">
            <div className="relative">
              <select className="input-field appearance-none cursor-pointer" name="nguon_khach" value={data.nguon_khach} onChange={handleChange}>
                <option value="FB">Facebook</option>
                <option value="Ads">Quảng cáo (Ads)</option>
                <option value="GT">Giới thiệu (Ref)</option>
              </select>
              <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </InputGroup>
        </div>
      </div>
    </div>

    {/* Project Info */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <SectionHeader icon={Rocket} title="Thông tin Dự án" colorClass="text-purple-600 bg-purple-600" />

      <div className="space-y-6">
        <InputGroup label="Sản phẩm / Dịch vụ">
          <input className="input-field font-medium text-lg" name="san_pham_dv" value={data.san_pham_dv} onChange={handleChange} placeholder="Tên sản phẩm..." />
        </InputGroup>

        <InputGroup label="Nhu cầu cụ thể">
          <textarea className="input-field min-h-[120px] resize-y leading-relaxed" name="nhu_cau" value={data.nhu_cau} onChange={handleChange} placeholder="Mô tả chi tiết nhu cầu..." />
        </InputGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Website Dự án (Domain)">
            <div className="relative">
              <input className="input-field pl-9" name="website" value={data.website} onChange={handleChange} placeholder="example.com" />
            </div>
          </InputGroup>
          <InputGroup label="Lịch hẹn tiếp theo">
            <input className="input-field" type="date" name="lich_hen" value={data.lich_hen} onChange={handleChange} />
          </InputGroup>
        </div>
      </div>
    </div>

    {/* Notes */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <SectionHeader icon={MessageSquare} title="Ghi chú & CSKH" colorClass="text-orange-600 bg-orange-600" />
      <div className="space-y-6">
        <InputGroup label="Ghi chú nội bộ">
          <textarea className="input-field min-h-[80px]" name="ghi_chu" value={data.ghi_chu} onChange={handleChange} placeholder="Lưu ý nội bộ..." />
        </InputGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Hình thức chăm sóc">
            <input className="input-field" name="hinh_thuc_cham" value={data.hinh_thuc_cham} onChange={handleChange} placeholder="Call / Meeting / Chat" />
          </InputGroup>
          <InputGroup label="Ngày chăm sóc gần nhất">
            <input className="input-field" type="date" name="ngay_cham_cuoi" value={data.ngay_cham_cuoi} onChange={handleChange} />
          </InputGroup>
        </div>
      </div>
    </div>
  </div>
);

const TabFinance = ({ data, handleChange, handlePaymentChange }: {
  data: ProjectData;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  handlePaymentChange: (index: number, field: keyof Payment, value: string | number) => void;
}) => {
  const tongPhi = Number(data.phi_dich_vu) + Number(data.phat_sinh);
  const daThanhToan = data.danh_sach_thanh_toan.reduce((acc: number, cur: Payment) => acc + Number(cur.so_tien), 0);
  const congNo = tongPhi - daThanhToan;
  const processPercent = tongPhi > 0 ? Math.min(100, Math.round((daThanhToan / tongPhi) * 100)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign size={120} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Tổng giá trị</div>
            <div className="text-4xl font-bold tracking-tight">{formatCurrency(tongPhi)}</div>
            <div className="mt-2 text-slate-400 text-sm">Bao gồm phát sinh</div>
          </div>
          <div>
            <div className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest mb-2">Đã thanh toán</div>
            <div className="text-4xl font-bold tracking-tight text-emerald-400">{formatCurrency(daThanhToan)}</div>
            <div className="mt-2 text-emerald-400/60 text-sm">{processPercent}% hoàn thành</div>
          </div>
          <div>
            <div className="text-rose-400/80 text-xs font-bold uppercase tracking-widest mb-2">Công nợ</div>
            <div className={`text-4xl font-bold tracking-tight ${congNo > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{formatCurrency(congNo)}</div>
          </div>
        </div>

        <div className="mt-8 relative z-10">
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${processPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <SectionHeader icon={DollarSign} title="Chi tiết phí" colorClass="text-emerald-600 bg-emerald-600" />

          <div className="space-y-5">
            <InputGroup label="Phí Dịch Vụ (Gốc)">
              <input className="input-field bg-gray-50/50 font-medium" disabled readOnly value={formatCurrency(data.phi_dich_vu)} />
              <div className="text-[10px] text-gray-400 mt-1 pl-1 italic">* Đồng bộ tự động từ Project Management</div>
            </InputGroup>

            <InputGroup label="Chi phí phát sinh">
              <input className="input-field font-medium text-gray-800" type="number" name="phat_sinh" value={data.phat_sinh} onChange={handleChange} />
            </InputGroup>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Outsource Cost">
                <input className="input-field" type="number" name="chi_phi_outsource" value={data.chi_phi_outsource} onChange={handleChange} />
              </InputGroup>
              <InputGroup label="Ngày cam kết (Deadline)">
                <input className="input-field" type="date" name="ngay_doi_cuoi" value={toIsoDateYmd(data.ngay_doi_cuoi)} onChange={handleChange} />
              </InputGroup>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <SectionHeader icon={CreditCard} title="Lịch sử thanh toán" colorClass="text-sky-600 bg-sky-600" />

          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => {
              const pay = data.danh_sach_thanh_toan[index] ?? { id: 0, lan_thanh_toan: index + 1, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' };
              const isActive = Number(pay.so_tien) > 0;
              return (
                <div key={index} className={`p-4 rounded-xl border transition-all ${isActive ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-transparent'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>Đợt {index + 1}</span>
                    {isActive && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        className={`w-full bg-transparent border-b ${isActive ? 'border-gray-300' : 'border-gray-200'} pb-1 text-sm focus:outline-none focus:border-blue-500 transition-colors`}
                        placeholder="Nhập số tiền..."
                        value={pay.so_tien || ''}
                        onChange={(e) => handlePaymentChange(index, 'so_tien', e.target.value)}
                      />
                      <div className="text-[10px] text-gray-400 mt-1">{formatCurrency(pay.so_tien)}</div>
                    </div>
                    <div>
                      <input
                        type="date"
                        className={`w-full bg-transparent border-b ${isActive ? 'border-gray-300' : 'border-gray-200'} pb-1 text-sm focus:outline-none focus:border-blue-500 transition-colors text-right`}
                        value={pay.ngay_thanh_toan}
                        onChange={(e) => handlePaymentChange(index, 'ngay_thanh_toan', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabDeploy = ({ data, handleChange, handleCheckboxChange }: {
  data: ProjectData;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  handleCheckboxChange: (name: keyof ProjectData, checked: boolean) => void;
}) => {
  const firstPayDate = data.danh_sach_thanh_toan.find((p: Payment) => p.lan_thanh_toan === 1)?.ngay_thanh_toan;
  const normalizedStatus = normalizeQldaStatus(data.trang_thai_trien_khai);
  const statusInfo = normalizedStatus ? qldaStatusStyle(normalizedStatus) : { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  const statusText = normalizedStatus ? qldaStatusLabel(normalizedStatus) : (String(data.trang_thai_trien_khai || '').trim() || 'Wait');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <SectionHeader icon={Server} title="Tiến độ triển khai" colorClass="text-teal-600 bg-teal-600" />

        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl mb-8">
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl shadow-sm ${statusInfo.bg}`}>
            <Layout size={32} className={`${statusInfo.text} opacity-80`} />
            <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 bg-white border rounded text-[10px] font-bold uppercase shadow-sm ${statusInfo.border} ${statusInfo.text}`}>
              {statusText}
            </div>
          </div>

          <div className="flex-1 w-full md:w-auto text-center md:text-left">
            <div className="text-sm font-medium text-slate-500 mb-1">Thời gian triển khai</div>
            <div className="text-3xl font-bold text-slate-800">{getWeeksDiff(firstPayDate)} <span className="text-lg font-medium text-slate-400">tuần</span></div>
          </div>

          <div className="h-px md:h-12 w-full md:w-px bg-slate-200"></div>

          <div className="flex-1 w-full md:w-auto grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Ngày Bàn Giao</div>
              <div className="font-mono font-medium text-slate-700">{formatDate(data.ngay_ban_giao)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Hạn Hợp Đồng</div>
              <div className="font-mono font-medium text-slate-700">{formatDate(data.ngay_tat_toan)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Ngày tất toán (Dự kiến)">
            <input className="input-field" type="date" name="ngay_tat_toan" value={toIsoDateYmd(data.ngay_tat_toan)} onChange={handleChange} />
          </InputGroup>
          <InputGroup label="Giải trình chậm trễ (Nếu có)">
            <textarea className="input-field h-10 resize-none overflow-hidden" name="ly_do_lau" value={data.ly_do_lau} onChange={handleChange} placeholder="..." />
          </InputGroup>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <SectionHeader icon={Calendar} title="Dịch vụ gia hạn" colorClass="text-indigo-600 bg-indigo-600" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'gia_han_domain', label: 'Domain', dateKey: 'ngay_hh_domain', feeKey: 'phi_gh_domain', icon: Globe },
            { key: 'gia_han_hosting', label: 'Hosting/VPS', dateKey: 'ngay_hh_hosting', feeKey: 'phi_gh_hosting', icon: Server },
            { key: 'gia_han_email', label: 'Email Corp', dateKey: 'ngay_hh_email', feeKey: 'phi_gh_email', icon: Mail },
            { key: 'gia_han_content', label: 'Content Care', dateKey: 'ngay_hh_content', feeKey: 'phi_gh_content', icon: FileText },
            { key: 'gia_han_ads', label: 'Ads Campaign', dateKey: 'ngay_hh_ads', feeKey: 'phi_gh_ads', icon: CheckCircle2 },
          ].map((item) => {
            const isChecked = !!data[item.key as keyof ProjectData];
            return (
              <div key={item.key} className={`group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${isChecked ? 'bg-indigo-50/50 border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <item.icon size={16} className={isChecked ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className={`font-bold text-sm ${isChecked ? 'text-indigo-900' : 'text-gray-500'}`}>{item.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(item.key as keyof ProjectData, e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className={`space-y-2 transition-all ${isChecked ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-indigo-400 mb-0.5 block">Hết hạn</label>
                    <input
                      type="date"
                      className="w-full bg-white border border-indigo-100 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      name={item.dateKey}
                      value={toIsoDateYmd(data[item.dateKey as keyof ProjectData])}
                      onChange={handleChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-indigo-400 mb-0.5 block">Phí gia hạn</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-indigo-100 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      placeholder="0 đ"
                      name={item.feeKey}
                      value={String(data[item.feeKey as keyof ProjectData] ?? '')}
                      onChange={handleChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Main Component
type StaffOptions = {
  pmManagers: Account[];
  sales: Account[];
  devs: Account[];
};
function sortAccountsByName(list: Account[]): Account[] {
  return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
}
function toNullableId(value: StaffId): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
function ensureCurrentIdOption(list: Account[], currentValue: StaffId): Account[] {
  const id = toNullableId(currentValue);
  if (!id) return list;
  const exists = list.some((a) => Number(a.id) === id);
  if (exists) return list;
  return [{ id, name: `#${id} (Merged)` } as Account, ...list];
}

interface Props {
  project: ProjectData;
  onBack: () => void;
  onSave: (data: ProjectData) => void | Promise<void>;
  readOnly?: boolean;
}

export default function ProjectDetail({ project, onBack, onSave, readOnly = false }: Props) {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState<ProjectData>(project);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [, setAccountsLoading] = useState<boolean>(false);

  // Sync formData when project prop updates (e.g. after save)
  useEffect(() => {
    setFormData(project);
  }, [project]);

  // Synchronization Refs
  const prevPhatSinhRef = useRef<number | null>(null);
  const prevDepositReceivedRef = useRef<number | null>(null);

  const numericFieldNames = useMemo(() => new Set<string>([
    'phi_dich_vu', 'phat_sinh', 'so_lan_doi', 'chi_phi_outsource',
    'phi_gh_domain', 'phi_gh_hosting', 'phi_gh_email', 'phi_gh_content', 'phi_gh_ads',
  ]), []);
  const idFieldNames = useMemo(() => new Set<string>(['pm_id', 'sale_id', 'ky_thuat_id']), []);

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && String(envUrl).trim()) ? String(envUrl).trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  // UseEffects for Sync (Keep original logic)
  useEffect(() => {
    if (readOnly) return;
    const projectCode = String(formData.ma_du_an || '').trim();
    if (!projectCode) return;
    const current = Number(formData.phi_dich_vu ?? 0) + Number(formData.phat_sinh ?? 0);
    if (!Number.isFinite(current) || current < 0) return;
    if (prevPhatSinhRef.current === null) { prevPhatSinhRef.current = current; return; }
    if (prevPhatSinhRef.current === current) return;
    prevPhatSinhRef.current = current;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await fetch(`${apiBaseUrl}/api/projects/actual-cost`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ project_code: projectCode, actual_cost: current }),
          });
        } catch { /* empty */ }
      })();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [apiBaseUrl, formData.ma_du_an, formData.phi_dich_vu, formData.phat_sinh, readOnly]);

  const daThu = useMemo(() => formData.danh_sach_thanh_toan.reduce((sum, p) => sum + Number(p.so_tien || 0), 0), [formData.danh_sach_thanh_toan]);
  useEffect(() => {
    if (readOnly) return;
    const projectCode = String(formData.ma_du_an || '').trim();
    if (!projectCode) return;
    const current = Number(daThu ?? 0);
    if (!Number.isFinite(current) || current < 0) return;
    if (prevDepositReceivedRef.current === null) { prevDepositReceivedRef.current = current; return; }
    if (prevDepositReceivedRef.current === current) return;
    prevDepositReceivedRef.current = current;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await fetch(`${apiBaseUrl}/api/projects/deposit-received`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ project_code: projectCode, deposit_received: current }),
          });
        } catch { /* empty */ }
      })();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [apiBaseUrl, daThu, formData.ma_du_an, readOnly]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAccountsLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/accounts?limit=500&offset=0`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items ?? []);
        if (!cancelled) setAccounts(items);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiBaseUrl]);

  useEffect(() => {
    let cancelled = false;
    const projectCode = String(formData.ma_du_an || '').trim();
    if (!projectCode) return;

    (async () => {
      try {
        const q = encodeURIComponent(projectCode);
        const res = await fetch(`${apiBaseUrl}/api/projects?limit=20&offset=0&q=${q}`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.items || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const match = items.find((p: any) => String(p.project_code || '').trim().toLowerCase() === projectCode.toLowerCase());
        const nextFee = Number(match?.contract_value ?? 0);
        if (Number.isFinite(nextFee) && !cancelled) {
          setFormData(prev => Number(prev.phi_dich_vu) === nextFee ? prev : { ...prev, phi_dich_vu: nextFee });
        }
      } catch { /* empty */ }
    })();
    return () => { cancelled = true; };
  }, [apiBaseUrl, formData.ma_du_an]);


  const staffOptions = useMemo<StaffOptions>(() => {
    const pmManagers = sortAccountsByName(accounts.filter((a) => normalizeRole(a.role_system) === 'sales_manager'));
    const sales = sortAccountsByName(accounts.filter((a) => normalizeRole(a.role_system) === 'sale'));
    const devs = sortAccountsByName(accounts.filter((a) => normalizeRole(a.role_system) === 'dev'));
    return { pmManagers, sales, devs };
  }, [accounts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (idFieldNames.has(name)) {
        const raw = String(value ?? '').trim();
        if (!raw) return { ...prev, [name]: null };
        const parsed = Number.parseInt(raw, 10);
        return { ...prev, [name]: Number.isFinite(parsed) ? parsed : null };
      }
      if (numericFieldNames.has(name)) {
        const next = value === '' ? 0 : Number(value);
        return { ...prev, [name]: Number.isFinite(next) ? next : 0 };
      }
      return { ...prev, [name]: value };
    });
  };

  const handlePaymentChange = (index: number, field: keyof Payment, value: string | number) => {
    const newPayments = [...formData.danh_sach_thanh_toan];
    const base = newPayments[index] ?? { id: Date.now() + index, lan_thanh_toan: index + 1, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' };
    const normalizedValue = field === 'so_tien' ? (value === '' ? 0 : Number(value)) : value;
    newPayments[index] = { ...base, lan_thanh_toan: index + 1, [field]: field === 'so_tien' && !Number.isFinite(Number(normalizedValue)) ? 0 : normalizedValue };
    setFormData(prev => ({ ...prev, danh_sach_thanh_toan: newPayments }));
  };

  const handleCheckboxChange = (name: keyof ProjectData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked } as ProjectData));
  };


  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-3 flex items-center justify-between shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200"></div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              {formData.ma_du_an}
              <span className="text-gray-400 font-light">|</span>
              <span className="truncate max-w-[200px]">{formData.ten_khach || '...'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${formData.trang_thai_chot === 'DaKy' ? 'bg-green-500' : formData.trang_thai_chot === 'Huy' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
            <select
              name="trang_thai_chot"
              value={formData.trang_thai_chot}
              onChange={handleChange}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:ring-0 cursor-pointer py-1 pl-1 pr-7 outline-none"
              disabled={readOnly}
            >
              <option value="DangCham">Đang chăm sóc</option>
              <option value="DaKy">Đã ký Hợp Đồng</option>
              <option value="Huy">Đã Hủy</option>
            </select>
          </div>
          {!readOnly && (
            <button
              onClick={() => onSave(normalizeProjectDatesForSave(formData))}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm shadow-indigo-200 transition-all active:scale-95 text-sm"
            >
              <Save size={16} />
              <span>Lưu</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 lg:p-10 pb-20">

            {/* Tab Switcher */}
            <div className="flex justify-center mb-8">
              <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                {[
                  { id: 1, label: 'Thông Tin', icon: FileText },
                  { id: 2, label: 'Tài Chính', icon: DollarSign },
                  { id: 3, label: 'Triển Khai', icon: Rocket }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 1 && <TabInfo data={formData} handleChange={handleChange} />}
              {activeTab === 2 && <TabFinance data={formData} handleChange={handleChange} handlePaymentChange={handlePaymentChange} />}
              {activeTab === 3 && <TabDeploy data={formData} handleChange={handleChange} handleCheckboxChange={handleCheckboxChange} />}
            </div>
          </div>
        </div>

        {/* Sidebar (Desktop) */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden xl:block z-10">
          <div className="p-6 sticky top-0 bg-white z-10 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Phụ trách dự án</h3>
          </div>

          <div className="p-6 space-y-6">
            {[
              { label: 'Project Manager', key: 'pm_id', options: staffOptions.pmManagers, color: 'text-indigo-600' },
              { label: 'Sales Executive', key: 'sale_id', options: staffOptions.sales, color: 'text-sky-600' },
              { label: 'Lead Developer', key: 'ky_thuat_id', options: staffOptions.devs, color: 'text-emerald-600' },
            ].map(role => (
              <div key={role.key}>
                <label className={`text-xs font-bold ${role.color} mb-2 block flex items-center gap-1`}>
                  {role.label}
                </label>
                <select
                  className="w-full text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 py-2.5 transition-shadow"
                  name={role.key}
                  value={String(formData[role.key as keyof ProjectData] ?? '')}
                  onChange={handleChange}
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {ensureCurrentIdOption(role.options, formData[role.key as keyof ProjectData] as number).map((a) => (
                    <option key={a.id} value={String(a.id)}>{a.name}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-col gap-4 mb-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Ngày tạo</div>
                  <input
                    className="input-field py-1.5 text-sm"
                    type="date"
                    name="ngay_tao"
                    value={toIsoDateYmd(formData.ngay_tao)}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Ngày Bàn giao</div>
                  <input
                    className="input-field py-1.5 text-sm"
                    type="date"
                    name="ngay_ban_giao"
                    value={toIsoDateYmd(formData.ngay_ban_giao)}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1e293b;
          transition: all 0.2s;
          outline: none;
        }
        .input-field:focus {
          background-color: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .input-field:disabled {
          background-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        
        /* Custom Scrollbar for better aesthetics */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}