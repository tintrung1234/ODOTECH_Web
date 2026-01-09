const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const devAssignmentsController = require("../controllers/devAssignmentsController");

// All routes require authentication
router.use(authMiddleware);

// Dev assignments
router.get("/", devAssignmentsController.listAssignments);
router.get("/:id", devAssignmentsController.getAssignmentById);
router.post("/:id/accept", devAssignmentsController.acceptAssignment);
router.post("/:id/delegate", devAssignmentsController.delegateAssignment);
router.post("/:id/accept-delegation", devAssignmentsController.acceptDelegation);
router.post("/:id/complete", devAssignmentsController.completeAssignment);

// Dev rotation management
router.get("/rotation/list", devAssignmentsController.listDevRotation);
router.post("/rotation/add", devAssignmentsController.addDevToRotation);
router.delete("/rotation/:dev_id", devAssignmentsController.removeDevFromRotation);

module.exports = router;
