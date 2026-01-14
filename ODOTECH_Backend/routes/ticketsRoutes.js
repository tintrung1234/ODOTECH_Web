const express = require("express");
const router = express.Router();
const ticketsController = require("../controllers/ticketsController");
const authMiddleware = require("../middlewares/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Ticket routes
router.get("/", ticketsController.getAllTickets);
router.get("/stats", ticketsController.getTicketStats);
router.get("/my-tickets", ticketsController.getMyTickets);
router.get("/:id", ticketsController.getTicketById);
router.post("/", ticketsController.createTicket);
router.put("/:id", ticketsController.updateTicket);
router.delete("/:id", ticketsController.deleteTicket);

// Ticket actions
router.post("/:id/assign", ticketsController.assignTicket);
router.post("/:id/status", ticketsController.updateTicketStatus);

// Ticket comments
router.get("/:id/comments", ticketsController.getTicketComments);
router.post("/:id/comments", ticketsController.addTicketComment);
router.put("/:id/comments/:commentId", ticketsController.updateTicketComment);
router.delete("/:id/comments/:commentId", ticketsController.deleteTicketComment);

// Ticket history
router.get("/:id/history", ticketsController.getTicketHistory);

module.exports = router;
