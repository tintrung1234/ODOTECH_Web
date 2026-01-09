import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Calendar, AlertTriangle, CheckCircle2, X, Plus } from 'lucide-react';

import StatCard from '../components/accountsDasboard/StatCard';
import { getTokenUser, normalizeRole, type CanonicalRole } from '../utils/auth';
import { calculateVietnameseTax, type TaxBreakdown } from '../utils/taxCalculator';

// Components
import ExpenseFilters from '../components/expenseRenewals/ExpenseFilters';
import ExpenseTable from '../components/expenseRenewals/ExpenseTable';
import ExpenseDetailPanel from '../components/expenseRenewals/ExpenseDetailPanel';
import AddExpenseModal from '../components/expenseRenewals/AddExpenseModal';
import { formatCurrencyVnd } from '../utils/taxCalculator';

type ExpenseCategory = 'salary' | 'tax' | 'fixed_costs';
type ExpenseStatus = 'pending' | 'paid' | 'overdue';
type RecurrenceType = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

type AccountDirectoryItem = {
    id: string | number;
    username: string;
    name: string;
    email?: string;
    role_system?: string;
    status?: string;
};

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
    created_at: string;
    updated_at: string;
};

function safeText(v: unknown): string {
    return String(v ?? '').trim();
}

export default function ExpenseRenewals() {
    const [role, setRole] = useState<CanonicalRole>('unknown');
    const canEdit = role === 'admin' || role === 'head_sales' || role === 'sales_manager';

    useEffect(() => {
        (async () => {
            const user = await getTokenUser();
            setRole(normalizeRole(user?.role));
        })();
    }, []);

    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<ExpenseRenewalItem[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        overdue: 0,
        paid: 0,
        totalPendingAmount: 0,
        totalPaidThisMonth: 0,
    });

    const [employeeNameById, setEmployeeNameById] = useState<Record<string, string>>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<'' | ExpenseCategory>('');
    const [filterStatus, setFilterStatus] = useState<'' | ExpenseStatus>('');

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Edit form states
    const [editCategory, setEditCategory] = useState<ExpenseCategory>('salary');
    const [editDescription, setEditDescription] = useState('');
    const [editGrossAmount, setEditGrossAmount] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [, setEditTaxAmount] = useState<number>(0);
    const [editNetAmount, setEditNetAmount] = useState<number>(0);
    const [editTaxBreakdown, setEditTaxBreakdown] = useState<TaxBreakdown | null>(null);
    const [editDueDate, setEditDueDate] = useState('');
    const [editPaymentDate, setEditPaymentDate] = useState('');
    const [editStatus, setEditStatus] = useState<ExpenseStatus>('pending');
    const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>('monthly');
    const [editManagerId, setEditManagerId] = useState('');
    const [editRecipientId, setEditRecipientId] = useState('');
    const [editNotes, setEditNotes] = useState('');

    const readErrorMessage = async (res: Response) => {
        const contentType = res.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                const json = (await res.json()) as { message?: string };
                return json?.message || `HTTP ${res.status}`;
            }
        } catch {
            // ignore
        }
        return `HTTP ${res.status}`;
    };

    const loadEmployeeDirectory = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000`, { credentials: 'include' });
            if (!res.ok) return;

            const json = (await res.json()) as { items?: AccountDirectoryItem[] } | AccountDirectoryItem[];
            const list = Array.isArray(json) ? json : (json.items || []);

            const map: Record<string, string> = {};
            for (const acc of list) {
                const id = safeText(acc?.id);
                const name = safeText(acc?.name);
                if (id && name) map[id] = name;
            }
            setEmployeeNameById(map);
        } catch {
            // best-effort only
        }
    };

    const loadItems = async () => {
        setLoading(true);
        setError('');
        try {
            const url = new URL(`${apiBaseUrl}/api/expense-renewals/items`);
            url.searchParams.set('limit', '200');
            url.searchParams.set('offset', '0');

            const res = await fetch(url.toString(), { credentials: 'include' });
            if (!res.ok) {
                const msg = await readErrorMessage(res);
                throw new Error(msg);
            }
            const json = (await res.json()) as { items?: ExpenseRenewalItem[] };
            setItems(Array.isArray(json.items) ? json.items : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu chi phí.');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/expense-renewals/stats`, { credentials: 'include' });
            if (!res.ok) return;
            const json = await res.json();
            setStats(json);
        } catch {
            // best-effort only
        }
    };

    useEffect(() => {
        void loadItems();
        void loadStats();
        void loadEmployeeDirectory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBaseUrl]);

    const filteredItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const bySearch = (item: ExpenseRenewalItem) => {
            if (!term) return true;
            const hay = [
                item.description,
                item.manager_name,
                item.recipient_name,
                item.notes,
                formatCurrencyVnd(item.amount || item.net_amount || 0),
            ]
                .map((s) => safeText(s).toLowerCase())
                .join(' | ');
            return hay.includes(term);
        };

        return items
            .filter((i) => (filterCategory ? i.category === filterCategory : true))
            .filter((i) => (filterStatus ? i.status === filterStatus : true))
            .filter(bySearch);
    }, [items, searchTerm, filterCategory, filterStatus]);

    const selectedItem = useMemo(() => {
        if (!selectedId) return null;
        return filteredItems.find((i) => i.id === selectedId) ?? null;
    }, [filteredItems, selectedId]);

    // Auto-calculate tax when gross amount changes
    const handleGrossAmountChange = (value: string) => {
        setEditGrossAmount(value);

        if (editCategory === 'salary' && value.trim() !== '') {
            const grossNum = Number(value);
            if (grossNum > 0) {
                const taxResult = calculateVietnameseTax(grossNum);
                setEditTaxAmount(taxResult.tax_amount);
                setEditNetAmount(taxResult.net_amount);
                setEditTaxBreakdown(taxResult.tax_breakdown);
            } else {
                setEditTaxAmount(0);
                setEditNetAmount(0);
                setEditTaxBreakdown(null);
            }
        } else {
            setEditTaxAmount(0);
            setEditNetAmount(0);
            setEditTaxBreakdown(null);
        }
    };

    const resetForm = () => {
        setEditCategory('salary');
        setEditDescription('');
        setEditGrossAmount('');
        setEditTaxAmount(0);
        setEditNetAmount(0);
        setEditTaxBreakdown(null);
        setEditDueDate('');
        setEditPaymentDate('');
        setEditStatus('pending');
        setEditRecurrence('monthly');
        setEditManagerId('');
        setEditRecipientId('');
        setEditNotes('');
    };

    useEffect(() => {
        if (!selectedItem) {
            resetForm();
            return;
        }

        setEditCategory(selectedItem.category);
        setEditDescription(selectedItem.description);
        setEditGrossAmount(selectedItem.gross_amount === null ? '' : String(selectedItem.gross_amount));
        setEditTaxAmount(selectedItem.tax_amount || 0);
        setEditNetAmount(selectedItem.net_amount || 0);
        setEditTaxBreakdown(selectedItem.tax_breakdown);
        setEditDueDate(selectedItem.due_date);
        setEditPaymentDate(selectedItem.payment_date || '');
        setEditStatus(selectedItem.status);
        setEditRecurrence(selectedItem.recurrence);
        setEditManagerId(selectedItem.manager_id);
        setEditRecipientId(selectedItem.recipient_id);
        setEditNotes(selectedItem.notes);
    }, [selectedItem]);

    const saveItem = async () => {
        if (!selectedItem) return;
        if (!canEdit) return;

        const url = `${apiBaseUrl}/api/expense-renewals/items/${selectedItem.id}`;

        const body = {
            category: editCategory,
            description: editDescription,
            gross_amount: editGrossAmount.trim() === '' ? null : Number(editGrossAmount),
            due_date: editDueDate,
            payment_date: editPaymentDate || null,
            status: editStatus,
            recurrence: editRecurrence,
            manager_id: editManagerId,
            recipient_id: editRecipientId,
            notes: editNotes,
        };

        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const msg = await readErrorMessage(res);
            throw new Error(msg);
        }

        await loadItems();
        await loadStats();
    };

    const deleteItem = async () => {
        if (!selectedItem) return;
        if (!canEdit) return;
        if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;

        const url = `${apiBaseUrl}/api/expense-renewals/items/${selectedItem.id}`;
        const res = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!res.ok) {
            const msg = await readErrorMessage(res);
            throw new Error(msg);
        }

        setSelectedId(null);
        await loadItems();
        await loadStats();
    };

    const markAsPaid = async () => {
        if (!selectedItem) return;
        if (!canEdit) return;

        const url = `${apiBaseUrl}/api/expense-renewals/items/${selectedItem.id}/mark-paid`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ payment_date: new Date().toISOString().slice(0, 10) }),
        });

        if (!res.ok) {
            const msg = await readErrorMessage(res);
            throw new Error(msg);
        }

        await loadItems();
        await loadStats();
    };

    const createNewItem = async () => {
        if (!canEdit) return;

        const body = {
            category: editCategory,
            description: editDescription,
            gross_amount: editGrossAmount.trim() === '' ? null : Number(editGrossAmount),
            due_date: editDueDate,
            payment_date: editPaymentDate || null,
            status: editStatus,
            recurrence: editRecurrence,
            manager_id: editManagerId,
            recipient_id: editRecipientId,
            notes: editNotes,
        };

        const res = await fetch(`${apiBaseUrl}/api/expense-renewals/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const msg = await readErrorMessage(res);
            throw new Error(msg);
        }

        setShowAddModal(false);
        await loadItems();
        await loadStats();
    };

    const handleAddNew = () => {
        setShowAddModal(true);
        setSelectedId(null);
        resetForm();
    };

    return (
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1920px] mx-auto space-y-6">
                {/* Header & Stats */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý gia hạn Chi</h1>
                            <p className="text-sm text-gray-500 mt-1">Theo dõi lương, thuế và chi phí cố định với tính thuế tự động</p>
                        </div>
                        {canEdit && (
                            <button
                                onClick={handleAddNew}
                                className="cursor-pointer px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg font-semibold shadow-md transition-all flex items-center gap-2 hover:shadow-lg"
                            >
                                <Plus size={18} />
                                Thêm chi phí mới
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Tổng chi phí"
                            value={stats.total}
                            color="blue"
                            icon={<DollarSign size={20} />}
                        />
                        <StatCard
                            title="Chờ thanh toán"
                            value={formatCurrencyVnd(stats.totalPendingAmount).replace(' đ', '')}
                            suffix="VND"
                            color="orange"
                            icon={<Calendar size={20} />}
                        />
                        <StatCard
                            title="Quá hạn"
                            value={stats.overdue}
                            color="red"
                            icon={<AlertTriangle size={20} />}
                        />
                        <StatCard
                            title="Đã thanh toán tháng này"
                            value={formatCurrencyVnd(stats.totalPaidThisMonth).replace(' đ', '')}
                            suffix="VND"
                            color="green"
                            icon={<CheckCircle2 size={20} />}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                    </div>
                )}

                {/* Content Area */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    {/* Left Column: List & Filters */}
                    <div className="xl:col-span-2 flex flex-col gap-4">
                        <ExpenseFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filterCategory={filterCategory}
                            onCategoryChange={setFilterCategory}
                            filterStatus={filterStatus}
                            onStatusChange={setFilterStatus}
                        />

                        <ExpenseTable
                            items={filteredItems}
                            loading={loading}
                            selectedId={selectedId}
                            onSelectItem={setSelectedId}
                        />
                    </div>

                    {/* Right Column: Details Panel */}
                    <div className="xl:col-span-1">
                        <ExpenseDetailPanel
                            selectedItem={selectedItem}
                            canEdit={canEdit}
                            editCategory={editCategory}
                            setEditCategory={setEditCategory}
                            editDescription={editDescription}
                            setEditDescription={setEditDescription}
                            editGrossAmount={editGrossAmount}
                            handleGrossAmountChange={handleGrossAmountChange}
                            editTaxBreakdown={editTaxBreakdown}
                            editNetAmount={editNetAmount}
                            editRecurrence={editRecurrence}
                            setEditRecurrence={setEditRecurrence}
                            editDueDate={editDueDate}
                            setEditDueDate={setEditDueDate}
                            editPaymentDate={editPaymentDate}
                            setEditPaymentDate={setEditPaymentDate}
                            editStatus={editStatus}
                            setEditStatus={setEditStatus}
                            editManagerId={editManagerId}
                            setEditManagerId={setEditManagerId}
                            editRecipientId={editRecipientId}
                            setEditRecipientId={setEditRecipientId}
                            editNotes={editNotes}
                            setEditNotes={setEditNotes}
                            employeeNameById={employeeNameById}
                            onSave={async () => {
                                try {
                                    await saveItem();
                                } catch (e) {
                                    setError(e instanceof Error ? e.message : 'Error');
                                }
                            }}
                            onMarkAsPaid={async () => {
                                try {
                                    await markAsPaid();
                                } catch (e) {
                                    setError(e instanceof Error ? e.message : 'Error');
                                }
                            }}
                            onDelete={async () => {
                                try {
                                    await deleteItem();
                                } catch (e) {
                                    setError(e instanceof Error ? e.message : 'Error');
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <AddExpenseModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreate={async () => {
                    try {
                        await createNewItem();
                    } catch (e) {
                        setError(e instanceof Error ? e.message : 'Error');
                    }
                }}
                editCategory={editCategory}
                setEditCategory={setEditCategory}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editGrossAmount={editGrossAmount}
                handleGrossAmountChange={handleGrossAmountChange}
                editTaxBreakdown={editTaxBreakdown}
                editNetAmount={editNetAmount}
                editRecurrence={editRecurrence}
                setEditRecurrence={setEditRecurrence}
                editDueDate={editDueDate}
                setEditDueDate={setEditDueDate}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                editManagerId={editManagerId}
                setEditManagerId={setEditManagerId}
                editRecipientId={editRecipientId}
                setEditRecipientId={setEditRecipientId}
                editNotes={editNotes}
                setEditNotes={setEditNotes}
                employeeNameById={employeeNameById}
            />
        </main>
    );
}
