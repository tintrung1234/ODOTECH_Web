import { Calendar, Banknote, Users, CheckCircle2, Save, Trash2, Receipt } from 'lucide-react';
import { type TaxBreakdown } from '../../utils/taxCalculator';
import { formatCurrencyVnd } from '../../utils/taxCalculator';
import TaxBreakdownCard from './TaxBreakdownCard';

type ExpenseCategory = 'salary' | 'tax' | 'fixed_costs';
type ExpenseStatus = 'pending' | 'paid' | 'overdue';
type RecurrenceType = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

type ExpenseRenewalItem = {
    id: number;
    category: ExpenseCategory;
    description: string;
    amount: number | null;
    gross_amount: number | null;
    tax_amount: number | null;
    net_amount: number | null;
    tax_breakdown: TaxBreakdown | null;
    due_date: string;
    payment_date: string;
    status: ExpenseStatus;
    recurrence: RecurrenceType;
    manager_id: string;
    manager_name: string;
    recipient_id: string;
    recipient_name: string;
    notes: string;
};

type ExpenseDetailPanelProps = {
    selectedItem: ExpenseRenewalItem | null;
    canEdit: boolean;
    editCategory: ExpenseCategory;
    setEditCategory: (value: ExpenseCategory) => void;
    editDescription: string;
    setEditDescription: (value: string) => void;
    editGrossAmount: string;
    handleGrossAmountChange: (value: string) => void;
    editTaxBreakdown: TaxBreakdown | null;
    editNetAmount: number;
    editRecurrence: RecurrenceType;
    setEditRecurrence: (value: RecurrenceType) => void;
    editDueDate: string;
    setEditDueDate: (value: string) => void;
    editPaymentDate: string;
    setEditPaymentDate: (value: string) => void;
    editStatus: ExpenseStatus;
    setEditStatus: (value: ExpenseStatus) => void;
    editManagerId: string;
    setEditManagerId: (value: string) => void;
    editRecipientId: string;
    setEditRecipientId: (value: string) => void;
    editNotes: string;
    setEditNotes: (value: string) => void;
    employeeNameById: Record<string, string>;
    onSave: () => Promise<void>;
    onMarkAsPaid: () => Promise<void>;
    onDelete: () => Promise<void>;
};

function categoryLabel(category: ExpenseCategory) {
    if (category === 'salary') return 'Lương';
    if (category === 'tax') return 'Thuế';
    return 'Chi phí cố định';
}

function statusLabel(status: ExpenseStatus) {
    if (status === 'paid') return 'Đã thanh toán';
    if (status === 'pending') return 'Chờ thanh toán';
    return 'Quá hạn';
}

function statusClassName(status: ExpenseStatus) {
    if (status === 'paid') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
}

function recurrenceLabel(recurrence: RecurrenceType) {
    if (recurrence === 'monthly') return 'Hàng tháng';
    if (recurrence === 'quarterly') return 'Hàng quý';
    if (recurrence === 'yearly') return 'Hàng năm';
    return 'Một lần';
}

export default function ExpenseDetailPanel({
    selectedItem,
    canEdit,
    editCategory,
    setEditCategory,
    editDescription,
    setEditDescription,
    editGrossAmount,
    handleGrossAmountChange,
    editTaxBreakdown,
    editNetAmount,
    editRecurrence,
    setEditRecurrence,
    editDueDate,
    setEditDueDate,
    editPaymentDate,
    setEditPaymentDate,
    editStatus,
    setEditStatus,
    editManagerId,
    setEditManagerId,
    editRecipientId,
    setEditRecipientId,
    editNotes,
    setEditNotes,
    employeeNameById,
    onSave,
    onMarkAsPaid,
    onDelete,
}: ExpenseDetailPanelProps) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-xl lg:shadow-sm sticky top-6 overflow-hidden transition-all duration-300 ${selectedItem ? 'opacity-100' : 'opacity-75 grayscale'}`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Chi tiết chi phí</h3>
                    {selectedItem ? (
                        <p className="text-sm text-teal-600 font-medium mt-0.5 flex items-center gap-1">
                            <CheckCircle2 size={14} /> {categoryLabel(selectedItem.category)}
                        </p>
                    ) : <p className="text-sm text-gray-500 mt-0.5">Chọn một dòng để xem</p>}
                </div>
                {selectedItem && (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${statusClassName(selectedItem.status)}`}>
                        {statusLabel(selectedItem.status)}
                    </span>
                )}
            </div>

            {/* Body */}
            {selectedItem ? (
                <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    {/* Expense Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Banknote size={12} /> Thông tin chi phí
                        </h4>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Danh mục</label>
                            {canEdit ? (
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
                                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                >
                                    <option value="salary">Lương</option>
                                    <option value="tax">Thuế</option>
                                    <option value="fixed_costs">Chi phí cố định</option>
                                </select>
                            ) : (
                                <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                    {categoryLabel(selectedItem.category)}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Mô tả</label>
                            {canEdit ? (
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                    placeholder="VD: Lương tháng 1/2026"
                                />
                            ) : (
                                <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                    {selectedItem.description}
                                </div>
                            )}
                        </div>

                        {editCategory === 'salary' ? (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Lương Gross (trước thuế)</label>
                                    {canEdit ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={editGrossAmount}
                                                onChange={(e) => handleGrossAmountChange(e.target.value)}
                                                className="w-full h-9 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">VND</span>
                                        </div>
                                    ) : (
                                        <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 font-medium">
                                            {formatCurrencyVnd(selectedItem.gross_amount || 0)}
                                        </div>
                                    )}
                                </div>

                                {editTaxBreakdown && (
                                    <TaxBreakdownCard taxBreakdown={editTaxBreakdown} netAmount={editNetAmount} />
                                )}
                            </>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Số tiền</label>
                                {canEdit ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editGrossAmount}
                                            onChange={(e) => handleGrossAmountChange(e.target.value)}
                                            className="w-full h-9 pl-3 pr-10 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">VND</span>
                                    </div>
                                ) : (
                                    <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 font-medium">
                                        {formatCurrencyVnd(selectedItem.amount || 0)}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Chu kỳ</label>
                            {canEdit ? (
                                <select
                                    value={editRecurrence}
                                    onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
                                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                >
                                    <option value="monthly">Hàng tháng</option>
                                    <option value="quarterly">Hàng quý</option>
                                    <option value="yearly">Hàng năm</option>
                                    <option value="one-time">Một lần</option>
                                </select>
                            ) : (
                                <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                    {recurrenceLabel(selectedItem.recurrence)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={12} /> Thông tin thanh toán
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Hạn thanh toán</label>
                                {canEdit ? (
                                    <input
                                        type="date"
                                        value={editDueDate}
                                        onChange={(e) => setEditDueDate(e.target.value)}
                                        className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                    />
                                ) : (
                                    <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                        {selectedItem.due_date}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Ngày thanh toán</label>
                                {canEdit ? (
                                    <input
                                        type="date"
                                        value={editPaymentDate}
                                        onChange={(e) => setEditPaymentDate(e.target.value)}
                                        className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                    />
                                ) : (
                                    <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                        {selectedItem.payment_date || '-'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Trạng thái</label>
                            {canEdit ? (
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as ExpenseStatus)}
                                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                >
                                    <option value="pending">Chờ thanh toán</option>
                                    <option value="paid">Đã thanh toán</option>
                                    <option value="overdue">Quá hạn</option>
                                </select>
                            ) : (
                                <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                    {statusLabel(selectedItem.status)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Users size={12} /> Phân công
                        </h4>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Người phụ trách</label>
                            {canEdit ? (
                                <select
                                    value={editManagerId}
                                    onChange={(e) => setEditManagerId(e.target.value)}
                                    className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                >
                                    <option value="">-- Chọn người --</option>
                                    {Object.entries(employeeNameById).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                    {selectedItem.manager_name || '-'}
                                </div>
                            )}
                        </div>

                        {editCategory === 'salary' && (
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Người nhận lương *</label>
                                {canEdit ? (
                                    <select
                                        value={editRecipientId}
                                        onChange={(e) => setEditRecipientId(e.target.value)}
                                        className="w-full h-9 px-3 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="">-- Chọn nhân viên --</option>
                                        {Object.entries(employeeNameById).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                        {selectedItem.recipient_name || '-'}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Ghi chú</label>
                            {canEdit ? (
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                                    placeholder="Ghi chú thêm..."
                                />
                            ) : (
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 min-h-[60px]">
                                    {selectedItem.notes || '-'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center text-gray-400 h-64">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <Receipt size={24} />
                    </div>
                    <p className="text-sm">Chọn một mục từ danh sách<br />để xem và chỉnh sửa thông tin.</p>
                </div>
            )}

            {/* Footer Actions */}
            {selectedItem && canEdit && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 space-y-2">
                    <button
                        onClick={() => { void onSave(); }}
                        className="cursor-pointer w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Lưu thay đổi
                    </button>
                    {selectedItem.status !== 'paid' && (
                        <button
                            onClick={() => { void onMarkAsPaid(); }}
                            className="cursor-pointer w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={16} /> Đánh dấu đã thanh toán
                        </button>
                    )}
                    <button
                        onClick={() => { void onDelete(); }}
                        className="cursor-pointer w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Xóa chi phí
                    </button>
                </div>
            )}
        </div>
    );
}
