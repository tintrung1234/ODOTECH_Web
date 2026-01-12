const { pool } = require("../config/postgres");
const expenseRenewalsRepository = require("../repositories/expenseRenewalsRepository");
const { calculateVietnameseTax } = require("../utils/taxCalculator");

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
        return await expenseRenewalsRepository.markAsPaid(id, payment_date);
    }
}

module.exports = new ExpenseRenewalsService();
