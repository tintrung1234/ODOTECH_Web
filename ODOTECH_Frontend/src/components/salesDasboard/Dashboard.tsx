import { useState } from 'react';
import type { ProjectData } from './interface/type';
import { formatCurrency, calculateDaysDiff } from '../../utils/formatDate';
import './style.css'

interface Props {
  projects: ProjectData[];
  onSelect: (p: ProjectData) => void;
  onFilter: (filters: { q: string; trang_thai_chot: '' | 'DangCham' | 'DaKy' | 'Huy' }) => void;
  onCreate: () => void;
}

export default function Dashboard({ projects, onSelect, onFilter, onCreate }: Props) {
  const [q, setQ] = useState('');
  const [trangThaiChot, setTrangThaiChot] = useState<'' | 'DangCham' | 'DaKy' | 'Huy'>('');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sale & Dự án</h1>
        <button
          onClick={onCreate}
          className="button-color text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Tạo Sale
        </button>
      </div>
      <div className="flex gap-4 mb-6">
        <input
          className="border border-gray-300 p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tìm tên khách, mã DA..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border border-gray-300 cursor-pointer p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={trangThaiChot}
          onChange={(e) => setTrangThaiChot(e.target.value as '' | 'DangCham' | 'DaKy' | 'Huy')}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DangCham">Đang chăm</option>
          <option value="DaKy">Đã ký</option>
          <option value="Huy">Huỷ</option>
        </select>
        <button
          onClick={() => onFilter({ q, trang_thai_chot: trangThaiChot })}
          className="text-white px-4 button-color py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Lọc
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-600">Mã DA</th>
              <th className="p-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th className="p-3 text-left font-semibold text-gray-600">TT Chốt</th>
              <th className="p-3 text-left font-semibold text-gray-600">Tổng phí</th>
              <th className="p-3 text-left font-semibold text-gray-600">Chăm cuối</th>
              <th className="p-3 text-left font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">{p.ma_du_an}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-800">{p.ten_khach}</div>
                  <small className="text-gray-500">{p.sdt}</small>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    p.trang_thai_chot === 'DaKy' ? 'bg-green-100 text-green-800' :
                    p.trang_thai_chot === 'Huy' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {p.trang_thai_chot}
                  </span>
                </td>
                <td className="p-3 font-medium">{formatCurrency(p.phi_dich_vu + p.phat_sinh)}</td>
                <td className="p-3">
                  {p.ngay_cham_cuoi} 
                  {calculateDaysDiff(p.ngay_cham_cuoi) > 7 && <span className="text-red-500 font-bold ml-2" title="Quá hạn chăm sóc"> ( ! )</span>}
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => onSelect(p)}
                    className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}