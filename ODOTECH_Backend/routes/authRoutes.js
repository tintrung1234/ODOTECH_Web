const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const { login, register, me } = require("../controllers/authController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "auth" });
});

router.post("/login", login);
router.post("/register", register);
router.get("/me", authMiddleware, me);

module.exports = router;
