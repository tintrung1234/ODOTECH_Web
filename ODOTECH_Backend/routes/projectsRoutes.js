const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectsController");

const {
  listProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
} = require("../controllers/projectTasksController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "projects" });
});

router.use(authMiddleware);

router.get("/", listProjects);
router.post("/", createProject);

router.get("/:id/tasks", listProjectTasks);
router.post("/:id/tasks", createProjectTask);
router.patch("/:id/tasks/:taskId", updateProjectTask);
router.delete("/:id/tasks/:taskId", deleteProjectTask);

router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;
