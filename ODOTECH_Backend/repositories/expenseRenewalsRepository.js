const { pool } = require("../config/postgres");
const { mapExpenseRenewalRow } = require("../models/expense_renewals");

class ExpenseRenewalsRepository {
    async findItems({ limit, offset, category, status, search }) {
        let query = `
      SELECT 
        er.*,
        m.name as manager_name,
        r.name as recipient_name
      FROM expense_renewals er
      LEFT JOIN accounts m ON er.manager_id = m.id
      LEFT JOIN accounts r ON er.recipient_id = r.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND er.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (status) {
            query += ` AND er.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            query += ` AND (
        er.description ILIKE $${paramIndex} OR
        er.notes ILIKE $${paramIndex} OR
        m.name ILIKE $${paramIndex} OR
        r.name ILIKE $${paramIndex}
      )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY er.due_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows.map(mapExpenseRenewalRow);
    }

    async findById(id) {
        const query = `
      SELECT 
        er.*,
        m.name as manager_name,
        r.name as recipient_name
      FROM expense_renewals er
      LEFT JOIN accounts m ON er.manager_id = m.id
      LEFT JOIN accounts r ON er.recipient_id = r.id
      WHERE er.id = $1
    `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        return mapExpenseRenewalRow(result.rows[0]);
    }

    async getStats() {
        const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN amount ELSE 0 END) as total_pending_amount,
        SUM(CASE WHEN status = 'paid' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) THEN COALESCE(net_amount, amount) ELSE 0 END) as total_paid_this_month
      FROM expense_renewals
    `;
        const result = await pool.query(statsQuery);
        return result.rows[0];
    }

    async create(client, data) {
        const query = `
      INSERT INTO expense_renewals (
        category, description, amount, gross_amount, tax_amount, net_amount, tax_breakdown,
        due_date, payment_date, status, recurrence, manager_id, recipient_id, notes, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;

        const dbClient = client || pool;
        const result = await dbClient.query(query, [
            data.category,
            data.description,
            data.amount,
            data.gross_amount,
            data.tax_amount,
            data.net_amount,
            data.tax_breakdown ? JSON.stringify(data.tax_breakdown) : null,
            data.due_date,
            data.payment_date || null,
            data.status || "pending",
            data.recurrence || "monthly",
            data.manager_id || null,
            data.recipient_id || null,
            data.notes || ""
        ]);
        return mapExpenseRenewalRow(result.rows[0]);
    }

    async update(client, id, data) {
        const query = `
      UPDATE expense_renewals 
      SET 
        category = $1,
        description = $2,
        amount = $3,
        gross_amount = $4,
        tax_amount = $5,
        net_amount = $6,
        tax_breakdown = $7,
        due_date = $8,
        payment_date = $9,
        status = $10,
        recurrence = $11,
        manager_id = $12,
        recipient_id = $13,
        notes = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `;

        const dbClient = client || pool;
        const result = await dbClient.query(query, [
            data.category,
            data.description,
            data.amount,
            data.gross_amount,
            data.tax_amount,
            data.net_amount,
            data.tax_breakdown ? JSON.stringify(data.tax_breakdown) : null,
            data.due_date,
            data.payment_date || null,
            data.status,
            data.recurrence,
            data.manager_id || null,
            data.recipient_id || null,
            data.notes || "",
            id
        ]);

        if (result.rows.length === 0) return null;
        return mapExpenseRenewalRow(result.rows[0]);
    }

    async delete(id) {
        const result = await pool.query(
            "DELETE FROM expense_renewals WHERE id = $1 RETURNING id",
            [id]
        );
        return result.rows.length > 0;
    }

    async markAsPaid(id, payment_date) {
        const query = `
      UPDATE expense_renewals 
      SET 
        status = 'paid',
        payment_date = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
        const result = await pool.query(query, [
            payment_date || new Date().toISOString().slice(0, 10),
            id
        ]);
        if (result.rows.length === 0) return null;
        return mapExpenseRenewalRow(result.rows[0]);
    }
}

module.exports = new ExpenseRenewalsRepository();
