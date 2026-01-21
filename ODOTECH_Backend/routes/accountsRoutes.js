const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStats,
  getAccountPasswordStatus,
  setAccountPassword,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
} = require("../controllers/accountsController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "accounts", features: ["accounts.username"], ts: new Date().toISOString() });
});

router.use(authMiddleware);

router.get("/stats", getAccountStats);

router.get("/profile/me", getCurrentUserProfile);
router.put("/profile/me", updateCurrentUserProfile);
router.put("/profile/me/password", changeCurrentUserPassword);

router.get("/:id/password-status", getAccountPasswordStatus);
router.put("/:id/password", setAccountPassword);

router.get("/", listAccounts);
router.post("/", createAccount);
router.get("/:id", getAccountById);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

module.exports = router;
