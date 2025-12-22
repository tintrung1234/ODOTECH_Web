import { useEffect, useMemo, useState } from 'react';

import type { Customer, CustomerCareNote, CustomerCategory, CustomerPurchase } from '../../types/Interface';
import ReminderMonthCalendar from './ReminderMonthCalendar';

interface CustomerEditModalProps {
  open: boolean;
  draft: Customer | null;
  onChangeDraft: (nextDraft: Customer) => void;
  onClose: () => void;
  onSave: () => void;
}

function categoryLabel(category: CustomerCategory) {
  if (category === 'new') return 'Khách mới';
  if (category === 'potential') return 'Khách tiềm năng';
  return 'Khách thân thiết';
}

function formatCurrencyVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

export default function CustomerEditModal({ open, draft, onChangeDraft, onClose, onSave }: CustomerEditModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseValue, setPurchaseValue] = useState<string>('');
  const [purchaseNote, setPurchaseNote] = useState('');

  const [careContent, setCareContent] = useState('');
  const [careReminderDate, setCareReminderDate] = useState('');
  const [selectedReminderIsoDate, setSelectedReminderIsoDate] = useState<string | null>(null);

  // Removed internal state reset effect to satisfy lint rule about setState in effects

  const revenue = useMemo(() => {
    if (!draft) return 0;
    return (draft.lichSuMuaHang ?? []).reduce((sum, p) => sum + (Number.isFinite(p.giaTri) ? p.giaTri : 0), 0);
  }, [draft]);

  const reminderMarkedIsoDates = useMemo(() => {
    const marked = new Set<string>();
    if (!draft) return marked;
    for (const note of draft.ghiChuChamSoc ?? []) {
      if (typeof note.ngayNhac === 'string' && note.ngayNhac.trim()) marked.add(note.ngayNhac);
    }
    return marked;
  }, [draft]);

  const reminderNotesForSelectedDay = useMemo(() => {
    if (!draft || !selectedReminderIsoDate) return [];
    return (draft.ghiChuChamSoc ?? []).filter((n) => n.ngayNhac === selectedReminderIsoDate);
  }, [draft, selectedReminderIsoDate]);

  if (!open || !draft) return null;

  const canSave = draft.tenKhachHang.trim().length > 0 && draft.khuVuc.trim().length > 0 && draft.nhanVienPhuTrach.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40 cursor-pointer" onClick={onClose} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{draft.ngayTao ? `Chỉnh sửa khách hàng (ID: ${draft.id})` : 'Khách hàng'}</h2>
              <div className="text-sm text-gray-500 mt-1">Tổng doanh số: {formatCurrencyVnd(revenue)}</div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-medium"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!canSave}
                className="h-10 px-5 rounded-lg bg-teal-600 text-white cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onSave}
              >
                Lưu
              </button>
            </div>
          </div>

          <div className="px-6 py-5 max-h-[85vh] overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  value={draft.tenKhachHang}
                  onChange={(e) => onChangeDraft({ ...draft, tenKhachHang: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={draft.soDienThoai ?? ''}
                  onChange={(e) => onChangeDraft({ ...draft, soDienThoai: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={draft.email ?? ''}
                  onChange={(e) => onChangeDraft({ ...draft, email: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                <input
                  type="text"
                  value={draft.khuVuc}
                  onChange={(e) => onChangeDraft({ ...draft, khuVuc: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên phụ trách</label>
                <input
                  type="text"
                  value={draft.nhanVienPhuTrach}
                  onChange={(e) => onChangeDraft({ ...draft, nhanVienPhuTrach: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại khách hàng</label>
                <select
                  value={draft.phanLoai}
                  onChange={(e) => onChangeDraft({ ...draft, phanLoai: e.target.value as CustomerCategory })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                >
                  <option value="new">{categoryLabel('new')}</option>
                  <option value="potential">{categoryLabel('potential')}</option>
                  <option value="loyal">{categoryLabel('loyal')}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-gray-900">Lịch sử mua hàng</h3>
                <div className="text-sm text-gray-600">Số lần mua: {draft.lichSuMuaHang.length}</div>
              </div>

              <div className="mt-3 overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-40">Ngày mua</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-44">Giá trị</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Ghi chú</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-20">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.lichSuMuaHang.length === 0 ? (
                      <tr className="h-12">
                        <td className="py-3 px-4 border-b border-gray-300" colSpan={4}>
                          <div className="text-gray-600">Chưa có lịch sử mua hàng.</div>
                        </td>
                      </tr>
                    ) : (
                      draft.lichSuMuaHang.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{p.ngayMua}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{formatCurrencyVnd(p.giaTri)}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{p.ghiChu ?? '-'}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300">
                            <button
                              type="button"
                              className="h-9 px-3 border border-red-300 rounded-lg bg-white text-red-500 font-medium"
                              onClick={() => {
                                onChangeDraft({ ...draft, lichSuMuaHang: draft.lichSuMuaHang.filter((x) => x.id !== p.id) });
                              }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mua</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={purchaseValue}
                    onChange={(e) => setPurchaseValue(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={purchaseNote}
                      onChange={(e) => setPurchaseNote(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                    />
                    <button
                      type="button"
                      className="h-10 px-5 rounded-lg bg-teal-600 text-white cursor-pointer font-medium"
                      onClick={() => {
                        const valueNumber = Number(purchaseValue);
                        if (!purchaseDate || !Number.isFinite(valueNumber) || valueNumber <= 0) return;

                        const nextPurchase: CustomerPurchase = {
                          id: Date.now(),
                          ngayMua: purchaseDate,
                          giaTri: valueNumber,
                          ghiChu: purchaseNote.trim() ? purchaseNote.trim() : undefined,
                        };

                        onChangeDraft({ ...draft, lichSuMuaHang: [nextPurchase, ...draft.lichSuMuaHang] });
                        setPurchaseDate('');
                        setPurchaseValue('');
                        setPurchaseNote('');
                      }}
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Cần nhập ngày mua và giá trị &gt; 0.</div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-gray-900">Ghi chú & nhắc lịch chăm sóc</h3>
                <div className="text-sm text-gray-600">Số ghi chú: {draft.ghiChuChamSoc.length}</div>
              </div>

              <div className="mt-3">
                <ReminderMonthCalendar
                  month={new Date()}
                  markedIsoDates={reminderMarkedIsoDates}
                  selectedIsoDate={selectedReminderIsoDate}
                  onSelectIsoDate={(iso) => {
                    setSelectedReminderIsoDate(iso);
                  }}
                  onlyMarkedSelectable
                />
              </div>

              {selectedReminderIsoDate ? (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
                    Nhắc hẹn trong ngày ({selectedReminderIsoDate}) ({reminderNotesForSelectedDay.length})
                  </div>
                  <div className="divide-y divide-gray-200">
                    {reminderNotesForSelectedDay.length === 0 ? (
                      <div className="px-4 py-4 text-gray-600">Không có ghi chú nhắc hẹn trong ngày này.</div>
                    ) : (
                      reminderNotesForSelectedDay.map((note) => (
                        <div key={`rem-${note.id}`} className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium">{note.noiDung}</div>
                          <div className="text-xs text-gray-500 mt-1">Tạo: {note.ngayTao}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 overflow-x-auto border border-gray-300 rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-32">Ngày tạo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300">Nội dung</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-36">Nhắc lịch</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-300 w-20">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.ghiChuChamSoc.length === 0 ? (
                      <tr className="h-12">
                        <td className="py-3 px-4 border-b border-gray-300" colSpan={4}>
                          <div className="text-gray-600">Chưa có ghi chú chăm sóc.</div>
                        </td>
                      </tr>
                    ) : (
                      draft.ghiChuChamSoc.map((n) => (
                        <tr key={n.id} className={`hover:bg-gray-50 ${selectedReminderIsoDate && n.ngayNhac === selectedReminderIsoDate ? 'bg-teal-50' : ''}`}>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{n.ngayTao}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{n.noiDung}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300 border-r border-gray-300">{n.ngayNhac ?? '-'}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-300">
                            <button
                              type="button"
                              className="h-9 px-3 border border-red-300 rounded-lg bg-white text-red-500 font-medium"
                              onClick={() => {
                                onChangeDraft({ ...draft, ghiChuChamSoc: draft.ghiChuChamSoc.filter((x) => x.id !== n.id) });
                              }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung ghi chú</label>
                  <input
                    type="text"
                    value={careContent}
                    onChange={(e) => setCareContent(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                    placeholder="Ví dụ: Gọi chăm sóc, gửi báo giá, hẹn demo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhắc lịch (tuỳ chọn)</label>
                  <input
                    type="date"
                    value={careReminderDate}
                    onChange={(e) => setCareReminderDate(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    className="h-10 px-5 rounded-lg bg-teal-600 text-white cursor-pointer font-medium"
                    onClick={() => {
                      const content = careContent.trim();
                      if (!content) return;

                      const todayIso = new Date().toISOString().slice(0, 10);
                      const nextNote: CustomerCareNote = {
                        id: Date.now(),
                        ngayTao: todayIso,
                        noiDung: content,
                        ngayNhac: careReminderDate ? careReminderDate : undefined,
                      };

                      onChangeDraft({ ...draft, ghiChuChamSoc: [nextNote, ...draft.ghiChuChamSoc] });
                      setCareContent('');
                      setCareReminderDate('');
                    }}
                  >
                    Thêm ghi chú
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
