const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const expenseRenewalsController = require("../controllers/expenseRenewalsController");

// Get all expense renewals with filters
router.get("/items", authMiddleware, expenseRenewalsController.getItems);

// Get statistics
router.get("/stats", authMiddleware, expenseRenewalsController.getStats);

// Get single expense renewal
router.get("/items/:id", authMiddleware, expenseRenewalsController.getItemById);

// Create new expense renewal
router.post("/items", authMiddleware, expenseRenewalsController.createItem);

// Update expense renewal
router.put("/items/:id", authMiddleware, expenseRenewalsController.updateItem);

// Delete expense renewal
router.delete("/items/:id", authMiddleware, expenseRenewalsController.deleteItem);

// Mark as paid
router.post("/items/:id/mark-paid", authMiddleware, expenseRenewalsController.markAsPaid);

module.exports = router;
