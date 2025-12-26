import React, { useState } from 'react';
import type { ProjectData, Payment } from './interface/type';
import { formatCurrency, calculateDaysDiff, getWeeksDiff } from '../../utils/formatDate';

const getMonthFromDate = (dateStr: string) => {
  if (!dateStr) return '';
  const s = String(dateStr);
  return s.length >= 7 ? s.slice(0, 7) : s;
};

// -- Sub-Components cho từng Tab để code gọn hơn --
const TabInfo = ({ data, handleChange }: { data: ProjectData, handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Thông tin Khách hàng</h3>
      <label className="block mb-3 text-sm font-medium text-gray-600">Mã KH <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="ma_kh" value={data.ma_kh} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">Tên Khách <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="ten_khach" value={data.ten_khach} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">SĐT <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="sdt" value={data.sdt} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">Zalo/FB <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="zalo_fb" value={data.zalo_fb} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">Nguồn 
        <select className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="nguon_khach" value={data.nguon_khach} onChange={handleChange}>
          <option value="FB">Facebook</option>
          <option value="Ads">Quảng cáo</option>
          <option value="GT">Giới thiệu</option>
        </select>
      </label>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Dự án & Chăm sóc</h3>
      <label className="block mb-3 text-sm font-medium text-gray-600">Mã Dự Án <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="ma_du_an" value={data.ma_du_an} onChange={handleChange} /></label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block mb-3 text-sm font-medium text-gray-600">Trạng thái chốt
          <select className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="trang_thai_chot" value={data.trang_thai_chot} onChange={handleChange}>
            <option value="DangCham">Đang chăm</option>
            <option value="DaKy">Đã ký</option>
            <option value="Huy">Huỷ</option>
          </select>
        </label>
        <label className="block mb-3 text-sm font-medium text-gray-600">Trạng thái thu tiền
          <select className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="trang_thai_thu_tien" value={data.trang_thai_thu_tien} onChange={handleChange}>
            <option value="Chua">Chưa</option>
            <option value="MotPhan">Một phần</option>
            <option value="Du">Đủ</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block mb-3 text-sm font-medium text-gray-600">Ngày tạo
          <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_tao" value={data.ngay_tao} onChange={handleChange} />
        </label>
        <label className="block mb-3 text-sm font-medium text-gray-600">Tháng
          <input className="w-full mt-1 p-2 border border-gray-300 rounded bg-gray-100" value={getMonthFromDate(data.ngay_tao)} disabled />
        </label>
      </div>

      <label className="block mb-3 text-sm font-medium text-gray-600">Nhu cầu <textarea className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="nhu_cau" value={data.nhu_cau} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">SP/DV <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="san_pham_dv" value={data.san_pham_dv} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">Website <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="website" value={data.website} onChange={handleChange} /></label>
      
      <div className="grid grid-cols-2 gap-4">
        <label className="block mb-3 text-sm font-medium text-gray-600">Sale Chăm <input className="w-full mt-1 p-2 border border-gray-300 rounded bg-gray-100" name="sale_id" value={data.sale_id} disabled /></label>
        <label className="block mb-3 text-sm font-medium text-gray-600">Kỹ thuật 
          <select className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="ky_thuat_id" value={data.ky_thuat_id} onChange={handleChange}>
            <option value="">-- Chọn KT --</option>
            <option value="KT1">Nguyễn Văn Code</option>
          </select>
        </label>
      </div>

      <hr className="my-4 border-gray-200"/>
      
      <div className="grid grid-cols-2 gap-4">
        <label className="block mb-3 text-sm font-medium text-gray-600">Lịch hẹn <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="lich_hen" value={data.lich_hen} onChange={handleChange} /></label>
        <label className="block mb-3 text-sm font-medium text-gray-600">Chăm cuối <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_cham_cuoi" value={data.ngay_cham_cuoi} onChange={handleChange} /></label>
      </div>
      
      <label className="block mb-3 text-sm font-medium text-gray-600">Hình thức chăm <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="hinh_thuc_cham" value={data.hinh_thuc_cham} onChange={handleChange} /></label>
      <label className="block mb-3 text-sm font-medium text-gray-600">Ghi chú <textarea className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="ghi_chu" value={data.ghi_chu} onChange={handleChange} /></label>

      <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
        Bao lâu chưa chăm: <strong>{calculateDaysDiff(data.ngay_cham_cuoi)} ngày</strong>
      </div>
    </div>
  </div>
);

const TabFinance = ({ data, handleChange, handlePaymentChange }: {
  data: ProjectData;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
  handlePaymentChange: (index: number, field: keyof Payment, value: string | number) => void;
}) => {
  // Tính toán tự động
  const tongPhi = Number(data.phi_dich_vu) + Number(data.phat_sinh);
  const daThanhToan = data.danh_sach_thanh_toan.reduce((acc: number, cur: Payment) => acc + Number(cur.so_tien), 0);
  const congNo = tongPhi - daThanhToan;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>Tổng phí: <b>{formatCurrency(tongPhi)}</b></div>
        <div>Đã thu: <b>{formatCurrency(daThanhToan)}</b></div>
        <div className={congNo > 0 ? 'text-red-600' : 'text-green-600'}>Công nợ: <b>{formatCurrency(congNo)}</b></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
           <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Cấu thành phí</h3>
           <label className="block mb-3 text-sm font-medium text-gray-600">Phí DV <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="phi_dich_vu" value={data.phi_dich_vu} onChange={handleChange}/></label>
           <label className="block mb-3 text-sm font-medium text-gray-600">Phát sinh <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="phat_sinh" value={data.phat_sinh} onChange={handleChange}/></label>
           <label className="block mb-3 text-sm font-medium text-gray-600">Ngày đòi cuối <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_doi_cuoi" value={data.ngay_doi_cuoi} onChange={handleChange}/></label>
           <label className="block mb-3 text-sm font-medium text-gray-600">Số lần đòi <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="so_lan_doi" value={data.so_lan_doi} onChange={handleChange}/></label>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
           <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Lịch sử thanh toán</h3>
           {Array.from({ length: 5 }).map((_, index) => {
             const pay = data.danh_sach_thanh_toan[index] ?? { id: 0, lan_thanh_toan: index + 1, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' };
             return (
               <div key={`${pay.id}-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 items-center">
                 <div className="text-sm text-gray-600 font-medium">Thanh toán {index + 1}</div>
                 <input className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" placeholder="Số tiền" value={pay.so_tien} onChange={(e) => handlePaymentChange(index, 'so_tien', e.target.value)} />
                 <input className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" value={pay.ngay_thanh_toan} onChange={(e) => handlePaymentChange(index, 'ngay_thanh_toan', e.target.value)} />
               </div>
             );
           })}
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
  // Tự động tính thời gian triển khai từ lần thanh toán đầu tiên
  const firstPayDate = data.danh_sach_thanh_toan.find((p: Payment) => p.lan_thanh_toan === 1)?.ngay_thanh_toan;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Tiến độ & Bàn giao</h3>
        <label className="block mb-3 text-sm font-medium text-gray-600">Trạng thái (QLDA): <input className="w-full mt-1 p-2 border border-gray-300 rounded bg-gray-100" disabled value={data.trang_thai_trien_khai} /></label>
        <label className="block mb-3 text-sm font-medium text-gray-600">Ngày bàn giao (QLDA): <input className="w-full mt-1 p-2 border border-gray-300 rounded bg-gray-100" disabled value={data.ngay_ban_giao} /></label>
        
        <div className="grid grid-cols-1 gap-4">
           <label className="block mb-3 text-sm font-medium text-gray-600">Ngày tất toán <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_tat_toan" value={data.ngay_tat_toan} onChange={handleChange}/></label>
        </div>

        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200">
           Thời gian triển khai: <strong>{getWeeksDiff(firstPayDate)} Tuần</strong>
        </div>
        <label className="block mb-3 text-sm font-medium text-gray-600 mt-4">Lý do lâu <textarea className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" name="ly_do_lau" value={data.ly_do_lau} onChange={handleChange}/></label>
        <label className="block mb-3 text-sm font-medium text-gray-600">Chi phí Outsource <input className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="chi_phi_outsource" value={data.chi_phi_outsource} onChange={handleChange}/></label>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Gia hạn dịch vụ</h3>
        
        {/* Domain */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={data.gia_han_domain}
            onChange={(e) => handleCheckboxChange('gia_han_domain', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          Gia hạn Tên miền
          {data.gia_han_domain && (
             <div className="ml-6 flex gap-2 flex-1">
               <input className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_hh_domain" value={data.ngay_hh_domain} onChange={handleChange}/>
               <input className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="phi_gh_domain" value={data.phi_gh_domain} onChange={handleChange} placeholder="Phí gia hạn"/>
             </div>
          )}
        </div>

        {/* Hosting */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={data.gia_han_hosting}
            onChange={(e) => handleCheckboxChange('gia_han_hosting', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          Gia hạn Hosting
          {data.gia_han_hosting && (
             <div className="ml-6 flex gap-2 flex-1">
               <input className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_hh_hosting" value={data.ngay_hh_hosting} onChange={handleChange}/>
               <input className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="phi_gh_hosting" value={data.phi_gh_hosting} onChange={handleChange} placeholder="Phí gia hạn"/>
             </div>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={data.gia_han_email}
            onChange={(e) => handleCheckboxChange('gia_han_email', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          Gia hạn Email
          {data.gia_han_email && (
             <div className="ml-6 flex gap-2 flex-1">
               <input className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="date" name="ngay_hh_email" value={data.ngay_hh_email} onChange={handleChange}/>
               <input className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" name="phi_gh_email" value={data.phi_gh_email} onChange={handleChange} placeholder="Phí gia hạn"/>
             </div>
          )}
        </div>

        {/* Content & Ads */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={data.gia_han_content}
            onChange={(e) => handleCheckboxChange('gia_han_content', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          Content
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={data.gia_han_ads}
            onChange={(e) => handleCheckboxChange('gia_han_ads', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          Quảng cáo
        </div>
      </div>
    </div>
  )
};

// -- Main Component --
interface Props {
  project: ProjectData;
  onBack: () => void;
  onSave: (data: ProjectData) => void | Promise<void>;
}

export default function ProjectDetail({ project, onBack, onSave }: Props) {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState<ProjectData>(project);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (index: number, field: keyof Payment, value: string | number) => {
    const newPayments = [...formData.danh_sach_thanh_toan];
    const base = newPayments[index] ?? { id: Date.now() + index, lan_thanh_toan: index + 1, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' };
    newPayments[index] = { ...base, lan_thanh_toan: index + 1, [field]: value };
    setFormData(prev => ({ ...prev, danh_sach_thanh_toan: newPayments }));
  };

  const handleCheckboxChange = (name: keyof ProjectData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked } as ProjectData));
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium cursor-pointer">← Quay lại danh sách</button>
      
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{formData.ma_du_an} - {formData.ten_khach}</h2>
        <div className="flex gap-2">
           <span className={`px-3 py-1 rounded-full text-sm font-medium ${
             formData.trang_thai_chot === 'DaKy' ? 'bg-green-100 text-green-800' :
             formData.trang_thai_chot === 'Huy' ? 'bg-red-100 text-red-800' :
             'bg-yellow-100 text-yellow-800'
           }`}>{formData.trang_thai_chot}</span>
           <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Công nợ: {formatCurrency((formData.phi_dich_vu + formData.phat_sinh) - formData.danh_sach_thanh_toan.reduce((a,b)=>a+Number(b.so_tien),0))}</span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 1 ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600 cursor-pointer'}`} onClick={() => setActiveTab(1)}>1. Thông tin & Chăm sóc</button>
        <button className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 2 ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600 cursor-pointer'}`} onClick={() => setActiveTab(2)}>2. Tài chính & Thanh toán</button>
        <button className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 3 ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600 cursor-pointer'}`} onClick={() => setActiveTab(3)}>3. Triển khai & Gia hạn</button>
      </div>

      <div className="space-y-6">
        {activeTab === 1 && <TabInfo data={formData} handleChange={handleChange} />}
        {activeTab === 2 && (
          <TabFinance
            data={formData}
            handleChange={handleChange}
            handlePaymentChange={handlePaymentChange}
          />
        )}
        {activeTab === 3 && (
          <TabDeploy
            data={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
          />
        )}
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => {
            const normalizedPayments = Array.from({ length: 5 }).map((_, i) => {
              const p = formData.danh_sach_thanh_toan[i] ?? { id: Date.now() + i, lan_thanh_toan: i + 1, so_tien: 0, ngay_thanh_toan: '', ghi_chu: '' };
              return { ...p, lan_thanh_toan: i + 1 };
            });
            onSave({ ...formData, danh_sach_thanh_toan: normalizedPayments });
          }}
          className="button-color text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium"
        >
          Lưu Dữ Liệu
        </button>
      </div>
    </div>
  );
}