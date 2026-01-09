import { X } from 'lucide-react';
import { type TaxBreakdown } from '../../utils/taxCalculator';
import TaxBreakdownCard from './TaxBreakdownCard';

type ExpenseCategory = 'salary' | 'tax' | 'fixed_costs';
type ExpenseStatus = 'pending' | 'paid' | 'overdue';
type RecurrenceType = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

type AddExpenseModalProps = {
    show: boolean;
    onClose: () => void;
    onCreate: () => Promise<void>;
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
    editStatus: ExpenseStatus;
    setEditStatus: (value: ExpenseStatus) => void;
    editManagerId: string;
    setEditManagerId: (value: string) => void;
    editRecipientId: string;
    setEditRecipientId: (value: string) => void;
    editNotes: string;
    setEditNotes: (value: string) => void;
    employeeNameById: Record<string, string>;
};

export default function AddExpenseModal({
    show,
    onClose,
    onCreate,
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
    editStatus,
    setEditStatus,
    editManagerId,
    setEditManagerId,
    editRecipientId,
    setEditRecipientId,
    editNotes,
    setEditNotes,
    employeeNameById,
}: AddExpenseModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Thêm chi phí mới</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Danh mục *</label>
                            <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
                                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                            >
                                <option value="salary">Lương</option>
                                <option value="tax">Thuế</option>
                                <option value="fixed_costs">Chi phí cố định</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Chu kỳ *</label>
                            <select
                                value={editRecurrence}
                                onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
                                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                            >
                                <option value="monthly">Hàng tháng</option>
                                <option value="quarterly">Hàng quý</option>
                                <option value="yearly">Hàng năm</option>
                                <option value="one-time">Một lần</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Mô tả *</label>
                        <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                            placeholder="VD: Lương tháng 1/2026"
                        />
                    </div>

                    {editCategory === 'salary' ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Lương Gross (trước thuế) *</label>
                                <input
                                    type="number"
                                    value={editGrossAmount}
                                    onChange={(e) => handleGrossAmountChange(e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                                    placeholder="20000000"
                                />
                            </div>

                            {editTaxBreakdown && (
                                <TaxBreakdownCard taxBreakdown={editTaxBreakdown} netAmount={editNetAmount} />
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Người nhận lương *</label>
                                <select
                                    value={editRecipientId}
                                    onChange={(e) => setEditRecipientId(e.target.value)}
                                    className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {Object.entries(employeeNameById).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Số tiền *</label>
                            <input
                                type="number"
                                value={editGrossAmount}
                                onChange={(e) => handleGrossAmountChange(e.target.value)}
                                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                                placeholder="0"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Người phụ trách</label>
                        <select
                            value={editManagerId}
                            onChange={(e) => setEditManagerId(e.target.value)}
                            className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                        >
                            <option value="">-- Chọn người --</option>
                            {Object.entries(employeeNameById).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Hạn thanh toán *</label>
                            <input
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Trạng thái</label>
                            <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as ExpenseStatus)}
                                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                            >
                                <option value="pending">Chờ thanh toán</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="overdue">Quá hạn</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Ghi chú</label>
                        <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none"
                            placeholder="Ghi chú thêm..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => { void onCreate(); }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Tạo chi phí
                    </button>
                </div>
            </div>
        </div>
    );
}
