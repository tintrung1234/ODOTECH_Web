const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  listRenewals,
  upsertRenewalMeta,
  getCredentials,
} = require("../controllers/renewalsController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "renewals" });
});

router.use(authMiddleware);

router.get("/items", listRenewals);
router.put("/packages/:salesProjectId/:kind", upsertRenewalMeta);
router.post("/packages/:salesProjectId/:kind/credentials", getCredentials);

module.exports = router;
