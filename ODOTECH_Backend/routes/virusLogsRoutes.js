const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const virusLogsController = require("../controllers/virusLogsController");

// All routes require authentication
router.use(authMiddleware);

// Virus logs management
router.get("/", virusLogsController.listVirusLogs);
router.get("/:id", virusLogsController.getVirusLogById);
router.post("/", virusLogsController.createVirusLog);
router.put("/:id/status", virusLogsController.updateVirusLogStatus);

module.exports = router;
