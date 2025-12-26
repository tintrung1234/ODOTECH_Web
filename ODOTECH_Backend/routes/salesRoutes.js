const express = require("express");

const {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
} = require("../controllers/salesController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "sales" });
});

router.get("/projects", listProjects);
router.post("/projects", createProject);
router.get("/projects/:id", getProjectById);
router.put("/projects/:id", updateProject);

module.exports = router;
