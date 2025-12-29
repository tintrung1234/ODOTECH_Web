import { useEffect } from 'react';

import type { ProjectItem, ProjectPriority, ProjectStatus } from '../../types/Interface';
import { clampNumber, normalizeMembers, priorityLabel, statusLabel } from './projectUtils';

export default function ProjectEditModal({
  open,
  draft,
  onChangeDraft,
  onClose,
  onSave,
}: {
  open: boolean;
  draft: ProjectItem | null;
  onChangeDraft: (nextDraft: ProjectItem) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !draft) return null;

  const canSave =
    draft.tenDuAn.trim().length > 0 &&
    draft.khachHang.trim().length > 0 &&
    draft.pm.trim().length > 0 &&
    draft.ngayBatDau.trim().length > 0 &&
    draft.ngayKetThuc.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40 cursor-pointer" onClick={onClose} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{`Dự án (${draft.id})`}</h2>
              <div className="text-sm text-gray-500 mt-1">Tạo / sửa thông tin dự án</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                <input
                  type="text"
                  value={draft.tenDuAn}
                  onChange={(e) => onChangeDraft({ ...draft, tenDuAn: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={draft.moTa}
                  onChange={(e) => onChangeDraft({ ...draft, moTa: e.target.value })}
                  className="w-full min-h-[92px] px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                <input
                  type="text"
                  value={draft.khachHang}
                  onChange={(e) => onChangeDraft({ ...draft, khachHang: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng dự án (PM)</label>
                <input
                  type="text"
                  value={draft.pm}
                  onChange={(e) => onChangeDraft({ ...draft, pm: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={draft.ngayBatDau}
                  onChange={(e) => onChangeDraft({ ...draft, ngayBatDau: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={draft.ngayKetThuc}
                  onChange={(e) => onChangeDraft({ ...draft, ngayKetThuc: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                <select
                  value={draft.mucDoUuTien}
                  onChange={(e) => onChangeDraft({ ...draft, mucDoUuTien: e.target.value as ProjectPriority })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                >
                  <option value="low">{priorityLabel('low')}</option>
                  <option value="medium">{priorityLabel('medium')}</option>
                  <option value="high">{priorityLabel('high')}</option>
                  <option value="urgent">{priorityLabel('urgent')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={draft.trangThai}
                  onChange={(e) => onChangeDraft({ ...draft, trangThai: e.target.value as ProjectStatus })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                >
                  <option value="not_started">{statusLabel('not_started')}</option>
                  <option value="in_progress">{statusLabel('in_progress')}</option>
                  <option value="on_hold">{statusLabel('on_hold')}</option>
                  <option value="completed">{statusLabel('completed')}</option>
                  <option value="late">{statusLabel('late')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiến độ (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.tienDo}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    onChangeDraft({ ...draft, tienDo: Number.isFinite(nextValue) ? clampNumber(nextValue, 0, 100) : 0 });
                  }}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số task</label>
                <input
                  type="number"
                  min={0}
                  value={draft.soTask}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    onChangeDraft({ ...draft, soTask: Number.isFinite(nextValue) ? Math.max(0, Math.floor(nextValue)) : 0 });
                  }}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task quá hạn</label>
                <input
                  type="number"
                  min={0}
                  value={draft.taskQuaHan}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    onChangeDraft({ ...draft, taskQuaHan: Number.isFinite(nextValue) ? Math.max(0, Math.floor(nextValue)) : 0 });
                  }}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành viên tham gia (phân tách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={draft.thanhVien.join(', ')}
                  onChange={(e) => onChangeDraft({ ...draft, thanhVien: normalizeMembers(e.target.value) })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-gray-500">Tài liệu dự án</div>
                <div className="text-gray-900">(Đã bỏ)</div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú dự án</label>
                <textarea
                  value={draft.ghiChu}
                  onChange={(e) => onChangeDraft({ ...draft, ghiChu: e.target.value })}
                  className="w-full min-h-[92px] px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
