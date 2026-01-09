import { Search, Filter } from 'lucide-react';

type ExpenseCategory = 'salary' | 'tax' | 'fixed_costs';
type ExpenseStatus = 'pending' | 'paid' | 'overdue';

type ExpenseFiltersProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterCategory: '' | ExpenseCategory;
    onCategoryChange: (value: '' | ExpenseCategory) => void;
    filterStatus: '' | ExpenseStatus;
    onStatusChange: (value: '' | ExpenseStatus) => void;
};

export default function ExpenseFilters({
    searchTerm,
    onSearchChange,
    filterCategory,
    onCategoryChange,
    filterStatus,
    onStatusChange,
}: ExpenseFiltersProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm (Mô tả, Người phụ trách, Người nhận...)"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    />
                </div>
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200 gap-2">
                    <div className="flex items-center gap-2 px-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={filterCategory}
                            onChange={(e) => onCategoryChange(e.target.value as '' | ExpenseCategory)}
                            className="h-8 bg-transparent border-none text-sm text-gray-700 outline-none focus:ring-0 cursor-pointer"
                        >
                            <option value="">Tất cả danh mục</option>
                            <option value="salary">Lương</option>
                            <option value="tax">Thuế</option>
                            <option value="fixed_costs">Chi phí cố định</option>
                        </select>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <select
                            value={filterStatus}
                            onChange={(e) => onStatusChange(e.target.value as '' | ExpenseStatus)}
                            className="h-8 bg-transparent border-none text-sm text-gray-700 outline-none focus:ring-0 cursor-pointer"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="overdue">Quá hạn</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
