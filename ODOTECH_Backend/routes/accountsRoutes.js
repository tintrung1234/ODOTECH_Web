const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStats,
} = require("../controllers/accountsController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "accounts" });
});

router.use(authMiddleware);

router.get("/stats", getAccountStats);

router.get("/", listAccounts);
router.post("/", createAccount);
router.get("/:id", getAccountById);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

module.exports = router;
