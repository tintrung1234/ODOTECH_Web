const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const authMiddleware = require("../middlewares/authMiddleware");

// These routes require a logged-in user. The controllers call requireUser(), which expects req.user
// to be set by authMiddleware.

router.use(authMiddleware);

router.get("/", notificationsController.listNotifications);
router.get("/unread-count", notificationsController.getUnreadCount);
router.patch("/read-all", notificationsController.markAllAsRead);
router.patch("/:id/read", notificationsController.markAsRead);

// Create notifications (requires appropriate roles; controller enforces)
router.post("/company", notificationsController.createCompanyNotification);
router.post("/roles", notificationsController.createRoleNotification);
router.post("/users", notificationsController.createUserNotification);

module.exports = router;
