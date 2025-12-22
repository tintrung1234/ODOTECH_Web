import { useEffect } from 'react';

import type { Account } from '../../types/Interface';

interface AccountEditModalProps {
    open: boolean;
    draft: Account | null;
    onChangeDraft: (nextDraft: Account) => void;
    onClose: () => void;
    onSave: () => void;
}

export default function AccountEditModal({
    open,
    draft,
    onChangeDraft,
    onClose,
    onSave,
}: AccountEditModalProps) {
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open || !draft) return null;

    return (
        <div className="fixed inset-0 z-50">
            <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40 cursor-pointer" onClick={onClose} />

            <div className="relative h-full w-full p-4 flex items-center justify-center">
                <div role="dialog" aria-modal="true" className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-800">Chỉnh sửa tài khoản (ID: {draft.id})</h2>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-medium"
                                onClick={onClose}
                            >
                                Hủy
                            </button>
                            <button type="button" className="h-10 px-5 rounded-lg bg-teal-600 text-white cursor-pointer font-medium" onClick={onSave}>
                                Lưu
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 max-h-[85vh] overflow-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                                <input
                                    type="text"
                                    value={draft.hoTen}
                                    onChange={(e) => onChangeDraft({ ...draft, hoTen: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                                <input
                                    type="text"
                                    value={draft.chucVu}
                                    onChange={(e) => onChangeDraft({ ...draft, chucVu: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={draft.email}
                                    onChange={(e) => onChangeDraft({ ...draft, email: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày phép</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={draft.soNgayPhep}
                                    onChange={(e) => {
                                        const nextValue = Number(e.target.value);
                                        onChangeDraft({ ...draft, soNgayPhep: Number.isFinite(nextValue) ? nextValue : 0 });
                                    }}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                                <input
                                    type="text"
                                    value={draft.bankAccountNumber}
                                    onChange={(e) => onChangeDraft({ ...draft, bankAccountNumber: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
                                <input
                                    type="text"
                                    value={draft.bankName}
                                    onChange={(e) => onChangeDraft({ ...draft, bankName: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Người quản lý</label>
                                <input
                                    type="text"
                                    value={draft.nguoiQuanLy}
                                    onChange={(e) => onChangeDraft({ ...draft, nguoiQuanLy: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
