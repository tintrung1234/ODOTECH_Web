const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const websitesController = require("../controllers/websitesController");

// All routes require authentication
router.use(authMiddleware);

// Website management
router.get("/", websitesController.listWebsites);
router.get("/stats", websitesController.getWebsiteStats);
router.get("/storage-alerts", websitesController.getStorageAlerts);
router.get("/:id", websitesController.getWebsiteById);
router.post("/", websitesController.createWebsite);
router.put("/:id", websitesController.updateWebsite);
router.delete("/:id", websitesController.deleteWebsite);

// Password reveal (with logging)
router.post("/:id/reveal-password", websitesController.revealPassword);

// Access history
router.get("/access-history/list", websitesController.getAccessHistory);

module.exports = router;
