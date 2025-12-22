import { useEffect } from 'react';

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open,
  title = 'Xác nhận xóa',
  description = 'Bạn có chắc chắn muốn xóa mục này không?',
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>

          <div className="px-6 py-5 text-gray-700">{description}</div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button type="button" className="h-10 px-5 rounded-lg bg-red-600 text-white font-medium" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
