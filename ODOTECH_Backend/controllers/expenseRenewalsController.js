const expenseRenewalsService = require("../services/expenseRenewalsService");

class ExpenseRenewalsController {
    async getItems(req, res) {
        try {
            const { limit = 200, offset = 0, category, status, search } = req.query;
            const items = await expenseRenewalsService.getItems({
                limit, offset, category, status, search
            });
            res.json({ items });
        } catch (error) {
            console.error("Error fetching expense renewals:", error);
            res.status(500).json({ message: "Lỗi khi tải dữ liệu chi phí" });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await expenseRenewalsService.getStats();
            res.json(stats);
        } catch (error) {
            console.error("Error fetching expense stats:", error);
            res.status(500).json({ message: "Lỗi khi tải thống kê" });
        }
    }

    async getItemById(req, res) {
        try {
            const { id } = req.params;
            const item = await expenseRenewalsService.getItemById(id);
            if (!item) {
                return res.status(404).json({ message: "Không tìm thấy chi phí" });
            }
            res.json(item);
        } catch (error) {
            console.error("Error fetching expense renewal:", error);
            res.status(500).json({ message: "Lỗi khi tải chi phí" });
        }
    }

    async createItem(req, res) {
        try {
            const newItem = await expenseRenewalsService.createItem(req.body);
            res.status(201).json(newItem);
        } catch (error) {
            console.error("Error creating expense renewal:", error);
            res.status(500).json({ message: "Lỗi khi tạo chi phí" });
        }
    }

    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const updatedItem = await expenseRenewalsService.updateItem(id, req.body);

            if (!updatedItem) {
                return res.status(404).json({ message: "Không tìm thấy chi phí" });
            }
            res.json(updatedItem);
        } catch (error) {
            console.error("Error updating expense renewal:", error);
            res.status(500).json({ message: "Lỗi khi cập nhật chi phí" });
        }
    }

    async deleteItem(req, res) {
        try {
            const { id } = req.params;
            const success = await expenseRenewalsService.deleteItem(id);

            if (!success) {
                return res.status(404).json({ message: "Không tìm thấy chi phí" });
            }
            res.json({ message: "Đã xóa chi phí thành công" });
        } catch (error) {
            console.error("Error deleting expense renewal:", error);
            res.status(500).json({ message: "Lỗi khi xóa chi phí" });
        }
    }

    async markAsPaid(req, res) {
        try {
            const { id } = req.params;
            const { payment_date } = req.body;
            const item = await expenseRenewalsService.markAsPaid(id, payment_date);

            if (!item) {
                return res.status(404).json({ message: "Không tìm thấy chi phí" });
            }
            res.json(item);
        } catch (error) {
            console.error("Error marking expense as paid:", error);
            res.status(500).json({ message: "Lỗi khi đánh dấu đã thanh toán" });
        }
    }
}

module.exports = new ExpenseRenewalsController();
