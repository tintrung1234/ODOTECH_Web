const { pool } = require("../config/postgres");
const expenseRenewalsRepository = require("../repositories/expenseRenewalsRepository");
const { calculateVietnameseTax } = require("../utils/taxCalculator");
const notificationService = require("./notificationService");

class ExpenseRenewalsService {
    async getItems(filters) {
        return await expenseRenewalsRepository.findItems(filters);
    }

    async getStats() {
        const stats = await expenseRenewalsRepository.getStats();
        return {
            total: parseInt(stats.total) || 0,
            pending: parseInt(stats.pending) || 0,
            overdue: parseInt(stats.overdue) || 0,
            paid: parseInt(stats.paid) || 0,
            totalPendingAmount: parseFloat(stats.total_pending_amount) || 0,
            totalPaidThisMonth: parseFloat(stats.total_paid_this_month) || 0,
        };
    }

    async getItemById(id) {
        return await expenseRenewalsRepository.findById(id);
    }

    async maybeSyncAccountSalary(client, { category, recipient_id, salaryValue }) {
        if (category !== "salary") return;
        if (!recipient_id) return;
        const nextSalary = Number(salaryValue);
        if (!Number.isFinite(nextSalary) || nextSalary <= 0) return;

        await client.query(
            `UPDATE accounts
       SET salary = $1, updated_at = NOW()
       WHERE id = $2`,
            [nextSalary, recipient_id]
        );
    }

    prepareTaxData(category, gross_amount, amount) {
        let taxData = {
            gross_amount: gross_amount || amount,
            tax_amount: null,
            net_amount: gross_amount || amount,
            tax_breakdown: null
        };

        if (category === 'salary' && gross_amount) {
            taxData = calculateVietnameseTax(gross_amount);
        }
        return taxData;
    }

    async createItem(data) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const taxData = this.prepareTaxData(data.category, data.gross_amount, data.amount);

            const createData = {
                ...data,
                amount: data.amount || taxData.gross_amount,
                gross_amount: taxData.gross_amount,
                tax_amount: taxData.tax_amount,
                net_amount: taxData.net_amount,
                tax_breakdown: taxData.tax_breakdown
            };

            const result = await expenseRenewalsRepository.create(client, createData);

            await this.maybeSyncAccountSalary(client, {
                category: data.category,
                recipient_id: data.recipient_id || null,
                salaryValue: taxData.gross_amount ?? data.amount,
            });

            await client.query("COMMIT");

            // Notify recipient when they are assigned a new item (salary/expense/renewal).
            const recipientId = notificationService.toNullableInt(result?.recipient_id || data?.recipient_id);
            const category = String(result?.category || data?.category || "").trim();
            if (recipientId) {
                const label = String(result?.description || data?.description || "").trim() || `#${result?.id ?? ""}`;
                const title = category === "salary" ? "Bạn có bản ghi lương mới" : "Bạn có khoản chi phí mới";
                await notificationService.notifyUser({
                    userId: recipientId,
                    type: category === "salary" ? "salary" : "expense",
                    title,
                    message: `Bạn vừa được thêm vào: ${label}.`,
                    data: { expense_renewal_id: result?.id, category },
                });
            }

            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async updateItem(id, data) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const before = await expenseRenewalsRepository.findById(id);

            const taxData = this.prepareTaxData(data.category, data.gross_amount, data.amount);

            const updateData = {
                ...data,
                amount: data.amount || taxData.gross_amount,
                gross_amount: taxData.gross_amount,
                tax_amount: taxData.tax_amount,
                net_amount: taxData.net_amount,
                tax_breakdown: taxData.tax_breakdown
            };

            const result = await expenseRenewalsRepository.update(client, id, updateData);

            if (result) {
                await this.maybeSyncAccountSalary(client, {
                    category: data.category,
                    recipient_id: data.recipient_id || null,
                    salaryValue: taxData.gross_amount ?? data.amount,
                });
            }

            await client.query("COMMIT");

            // Notify recipient when assignment changes or salary changes.
            if (result) {
                const beforeRecipient = notificationService.toNullableInt(before?.recipient_id);
                const afterRecipient = notificationService.toNullableInt(result?.recipient_id || data?.recipient_id);
                const category = String(result?.category || data?.category || "").trim();

                const label = String(result?.description || data?.description || "").trim() || `#${result?.id ?? ""}`;
                if (afterRecipient && afterRecipient !== beforeRecipient) {
                    const title = category === "salary" ? "Bạn được thêm vào bản ghi lương" : "Bạn được thêm vào khoản chi phí";
                    await notificationService.notifyUser({
                        userId: afterRecipient,
                        type: category === "salary" ? "salary" : "expense",
                        title,
                        message: `Bạn vừa được gán vào: ${label}.`,
                        data: { expense_renewal_id: result?.id, category },
                    });
                } else if (afterRecipient && category === "salary") {
                    const beforeGross = before?.gross_amount === null || before?.gross_amount === undefined ? null : Number(before.gross_amount);
                    const afterGross = result?.gross_amount === null || result?.gross_amount === undefined ? null : Number(result.gross_amount);
                    const beforeNet = before?.net_amount === null || before?.net_amount === undefined ? null : Number(before.net_amount);
                    const afterNet = result?.net_amount === null || result?.net_amount === undefined ? null : Number(result.net_amount);
                    if (beforeGross !== afterGross || beforeNet !== afterNet) {
                        await notificationService.notifyUser({
                            userId: afterRecipient,
                            type: "salary",
                            title: "Lương của bạn vừa được cập nhật",
                            message: `Bản ghi lương "${label}" vừa được cập nhật.`,
                            data: { expense_renewal_id: result?.id, category },
                        });
                    }
                }
            }

            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteItem(id) {
        return await expenseRenewalsRepository.delete(id);
    }

    async markAsPaid(id, payment_date) {
        const updated = await expenseRenewalsRepository.markAsPaid(id, payment_date);
        const recipientId = notificationService.toNullableInt(updated?.recipient_id);
        if (recipientId) {
            const category = String(updated?.category || "").trim();
            const label = String(updated?.description || "").trim() || `#${updated?.id ?? ""}`;
            await notificationService.notifyUser({
                userId: recipientId,
                type: category === "salary" ? "salary" : "expense",
                title: category === "salary" ? "Lương đã được thanh toán" : "Khoản chi phí đã được thanh toán",
                message: `"${label}" đã được đánh dấu đã thanh toán.`,
                data: { expense_renewal_id: updated?.id, category },
            });
        }
        return updated;
    }
}

module.exports = new ExpenseRenewalsService();
