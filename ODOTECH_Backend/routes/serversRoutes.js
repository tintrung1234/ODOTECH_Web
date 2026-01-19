const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const serversController = require("../controllers/serversController");

// All routes require authentication
router.use(authMiddleware);

// Server management
router.get("/", serversController.listServers);
router.get("/stats", serversController.getServerStats);
router.get("/:id", serversController.getServerById);
router.post("/", serversController.createServer);
router.put("/:id", serversController.updateServer);
router.delete("/:id", serversController.deleteServer);

// Password reveal (with logging)
router.post("/:id/reveal-password", serversController.revealPassword);

module.exports = router;
