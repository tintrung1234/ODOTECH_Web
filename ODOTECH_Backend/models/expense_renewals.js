function formatDate(value) {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
}

function mapExpenseRenewalRow(row) {
    return {
        id: Number(row.id),
        category: row.category ?? "",
        description: row.description ?? "",
        amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
        gross_amount: row.gross_amount === null || row.gross_amount === undefined ? null : Number(row.gross_amount),
        tax_amount: row.tax_amount === null || row.tax_amount === undefined ? null : Number(row.tax_amount),
        net_amount: row.net_amount === null || row.net_amount === undefined ? null : Number(row.net_amount),
        tax_breakdown: row.tax_breakdown || null,
        due_date: formatDate(row.due_date),
        payment_date: formatDate(row.payment_date),
        status: row.status ?? "pending",
        recurrence: row.recurrence ?? "monthly",
        manager_id: row.manager_id ?? "",
        manager_name: row.manager_name ?? "",
        recipient_id: row.recipient_id ?? "",
        recipient_name: row.recipient_name ?? "",
        notes: row.notes ?? "",
        created_at: formatDate(row.created_at),
        updated_at: formatDate(row.updated_at),
    };
}

module.exports = {
    mapExpenseRenewalRow,
};
