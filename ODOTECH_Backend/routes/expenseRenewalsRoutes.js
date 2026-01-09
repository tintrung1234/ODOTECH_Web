const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { mapExpenseRenewalRow } = require("../models/expense_renewals");
const { pool } = require("../config/postgres");

async function maybeSyncAccountSalary(client, { category, recipient_id, salaryValue }) {
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

// Get all expense renewals with filters
router.get("/items", authMiddleware, async (req, res) => {
    try {
        const { limit = 200, offset = 0, category, status, search } = req.query;

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
        const items = result.rows.map(mapExpenseRenewalRow);

        res.json({ items });
    } catch (error) {
        console.error("Error fetching expense renewals:", error);
        res.status(500).json({ message: "Lỗi khi tải dữ liệu chi phí" });
    }
});

// Get statistics
router.get("/stats", authMiddleware, async (req, res) => {
    try {
        const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN amount ELSE 0 END) as total_pending_amount,
        SUM(CASE WHEN status = 'paid' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) THEN amount ELSE 0 END) as total_paid_this_month
      FROM expense_renewals
    `;

        const result = await pool.query(statsQuery);
        const stats = result.rows[0];

        res.json({
            total: parseInt(stats.total) || 0,
            pending: parseInt(stats.pending) || 0,
            overdue: parseInt(stats.overdue) || 0,
            paid: parseInt(stats.paid) || 0,
            totalPendingAmount: parseFloat(stats.total_pending_amount) || 0,
            totalPaidThisMonth: parseFloat(stats.total_paid_this_month) || 0,
        });
    } catch (error) {
        console.error("Error fetching expense stats:", error);
        res.status(500).json({ message: "Lỗi khi tải thống kê" });
    }
});

// Get single expense renewal
router.get("/items/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
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

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy chi phí" });
        }

        res.json(mapExpenseRenewalRow(result.rows[0]));
    } catch (error) {
        console.error("Error fetching expense renewal:", error);
        res.status(500).json({ message: "Lỗi khi tải chi phí" });
    }
});

// Create new expense renewal
router.post("/items", authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            category,
            description,
            amount,
            gross_amount,
            due_date,
            payment_date,
            status,
            recurrence,
            manager_id,
            recipient_id,
            notes,
        } = req.body;

        // Calculate tax for salary category
        let taxData = {
            gross_amount: gross_amount || amount,
            tax_amount: null,
            net_amount: gross_amount || amount,
            tax_breakdown: null
        };

        if (category === 'salary' && gross_amount) {
            const { calculateVietnameseTax } = require("../utils/taxCalculator");
            taxData = calculateVietnameseTax(gross_amount);
        }

        const query = `
      INSERT INTO expense_renewals (
        category, description, amount, gross_amount, tax_amount, net_amount, tax_breakdown,
        due_date, payment_date, status, recurrence, manager_id, recipient_id, notes, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;

        await client.query("BEGIN");
        const result = await client.query(query, [
            category,
            description,
            amount || taxData.gross_amount,
            taxData.gross_amount,
            taxData.tax_amount,
            taxData.net_amount,
            taxData.tax_breakdown ? JSON.stringify(taxData.tax_breakdown) : null,
            due_date,
            payment_date || null,
            status || "pending",
            recurrence || "monthly",
            manager_id || null,
            recipient_id || null,
            notes || "",
        ]);

        await maybeSyncAccountSalary(client, {
            category,
            recipient_id: recipient_id || null,
            salaryValue: taxData.gross_amount ?? amount,
        });

        await client.query("COMMIT");

        res.status(201).json(mapExpenseRenewalRow(result.rows[0]));
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore
        }
        console.error("Error creating expense renewal:", error);
        res.status(500).json({ message: "Lỗi khi tạo chi phí" });
    } finally {
        client.release();
    }
});

// Update expense renewal
router.put("/items/:id", authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            category,
            description,
            amount,
            gross_amount,
            due_date,
            payment_date,
            status,
            recurrence,
            manager_id,
            recipient_id,
            notes,
        } = req.body;

        // Calculate tax for salary category
        let taxData = {
            gross_amount: gross_amount || amount,
            tax_amount: null,
            net_amount: gross_amount || amount,
            tax_breakdown: null
        };

        if (category === 'salary' && gross_amount) {
            const { calculateVietnameseTax } = require("../utils/taxCalculator");
            taxData = calculateVietnameseTax(gross_amount);
        }

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

        await client.query("BEGIN");
        const result = await client.query(query, [
            category,
            description,
            amount || taxData.gross_amount,
            taxData.gross_amount,
            taxData.tax_amount,
            taxData.net_amount,
            taxData.tax_breakdown ? JSON.stringify(taxData.tax_breakdown) : null,
            due_date,
            payment_date || null,
            status,
            recurrence,
            manager_id || null,
            recipient_id || null,
            notes || "",
            id,
        ]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Không tìm thấy chi phí" });
        }

        await maybeSyncAccountSalary(client, {
            category,
            recipient_id: recipient_id || null,
            salaryValue: taxData.gross_amount ?? amount,
        });

        await client.query("COMMIT");

        res.json(mapExpenseRenewalRow(result.rows[0]));
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore
        }
        console.error("Error updating expense renewal:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật chi phí" });
    } finally {
        client.release();
    }
});

// Delete expense renewal
router.delete("/items/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "DELETE FROM expense_renewals WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy chi phí" });
        }

        res.json({ message: "Đã xóa chi phí thành công" });
    } catch (error) {
        console.error("Error deleting expense renewal:", error);
        res.status(500).json({ message: "Lỗi khi xóa chi phí" });
    }
});

// Mark as paid
router.post("/items/:id/mark-paid", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_date } = req.body;

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
            id,
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy chi phí" });
        }

        res.json(mapExpenseRenewalRow(result.rows[0]));
    } catch (error) {
        console.error("Error marking expense as paid:", error);
        res.status(500).json({ message: "Lỗi khi đánh dấu đã thanh toán" });
    }
});

module.exports = router;
