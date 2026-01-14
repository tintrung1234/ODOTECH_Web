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

module.exports = router;
