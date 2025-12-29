const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  listLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
} = require("../controllers/leaveController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "leave-requests" });
});

router.use(authMiddleware);

router.get("/", listLeaveRequests);
router.post("/", createLeaveRequest);
router.get("/:id", getLeaveRequestById);
router.put("/:id", updateLeaveRequest);
router.delete("/:id", deleteLeaveRequest);

module.exports = router;
