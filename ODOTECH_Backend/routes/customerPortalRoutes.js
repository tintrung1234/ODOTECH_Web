const express = require("express");
const router = express.Router();
const customerPortalController = require("../controllers/customerPortalController");
const authMiddleware = require("../middlewares/authMiddleware");

// Middleware to ensure user is logged in
router.use(authMiddleware);

router.get("/profile", customerPortalController.getProfile);
router.get("/services", customerPortalController.getServices);
router.put("/profile", customerPortalController.updateProfile);

module.exports = router;
