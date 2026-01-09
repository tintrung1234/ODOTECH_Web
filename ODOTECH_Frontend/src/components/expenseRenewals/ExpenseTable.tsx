import { formatCurrencyVnd } from '../../utils/taxCalculator';

type ExpenseCategory = 'salary' | 'tax' | 'fixed_costs';
type ExpenseStatus = 'pending' | 'paid' | 'overdue';
type RecurrenceType = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

type ExpenseRenewalItem = {
    id: number;
    category: ExpenseCategory;
    description: string;
    amount: number | null;
    gross_amount: number | null;
    net_amount: number | null;
    due_date: string;
    status: ExpenseStatus;
    recurrence: RecurrenceType;
    manager_name: string;
    recipient_name: string;
};

type ExpenseTableProps = {
    items: ExpenseRenewalItem[];
    loading: boolean;
    selectedId: number | null;
    onSelectItem: (id: number) => void;
};

function categoryLabel(category: ExpenseCategory) {
    if (category === 'salary') return 'Lương';
    if (category === 'tax') return 'Thuế';
    return 'Chi phí cố định';
}

function categoryIcon(category: ExpenseCategory) {
    const icons = {
        salary: '👤',
        tax: '📄',
        fixed_costs: '🏢',
    };
    return icons[category];
}

function categoryClassName(category: ExpenseCategory) {
    if (category === 'salary') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (category === 'tax') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
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

export default function ExpenseTable({ items, loading, selectedId, onSelectItem }: ExpenseTableProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-[500px]">
            <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Danh mục</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Mô tả</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Người nhận</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Hạn thanh toán</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Số tiền</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-500">Không tìm thấy dữ liệu phù hợp.</td></tr>
                        ) : (
                            items.map((item) => {
                                const isSelected = selectedId === item.id;
                                const displayAmount = item.category === 'salary' ? (item.net_amount || item.amount) : item.amount;
                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => onSelectItem(item.id)}
                                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-teal-50 hover:bg-teal-100/50' : ''}`}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryClassName(item.category)} text-lg`}>
                                                    {categoryIcon(item.category)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{categoryLabel(item.category)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={item.description}>{item.description}</div>
                                            <div className="text-xs text-gray-500">{recurrenceLabel(item.recurrence)}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm text-gray-900">{item.recipient_name || item.manager_name || '-'}</div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                                            {item.due_date}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="text-sm font-bold text-gray-900">{formatCurrencyVnd(displayAmount || 0)}</div>
                                            {item.category === 'salary' && item.gross_amount && (
                                                <div className="text-xs text-gray-500">Gross: {formatCurrencyVnd(item.gross_amount)}</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClassName(item.status)}`}>
                                                {statusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
