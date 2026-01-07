const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const { validate, paramInt, queryIntOptional, queryStringOptional, bodyRequiredString } = require("../middlewares/validate");

const { toInt, normalizeSalesProjectInput } = require("../utils/salesInput");

const {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  listSalePeople,
} = require("../controllers/salesController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "sales" });
});

router.use(authMiddleware);

router.get("/people", listSalePeople);

function parseSalesListQuery(req, res, next) {
  req.listQuery = {
    limit: Math.min(Math.max(toInt(req.query.limit, 50), 1), 200),
    offset: Math.max(toInt(req.query.offset, 0), 0),
    q: typeof req.query.q === "string" ? req.query.q.trim() : "",
    trang_thai_chot: typeof req.query.trang_thai_chot === "string" ? req.query.trang_thai_chot.trim() : "",
    trang_thai_thu_tien: typeof req.query.trang_thai_thu_tien === "string" ? req.query.trang_thai_thu_tien.trim() : "",
  };
  next();
}

function parseSalesProjectInput(req, res, next) {
  const normalized = normalizeSalesProjectInput(req.body, { requireBasics: true });
  if (normalized.error) return res.status(400).json({ message: normalized.error });
  req.salesInput = normalized.value;
  next();
}

router.get(
  "/projects",
  validate([
    queryIntOptional("limit", { min: 1, max: 200, message: "Invalid limit" }),
    queryIntOptional("offset", { min: 0, message: "Invalid offset" }),
    queryStringOptional("q", { maxLen: 500, message: "Invalid q" }),
    queryStringOptional("trang_thai_chot", { maxLen: 50, message: "Invalid trang_thai_chot" }),
    queryStringOptional("trang_thai_thu_tien", { maxLen: 50, message: "Invalid trang_thai_thu_tien" }),
  ]),
  parseSalesListQuery,
  listProjects
);

router.post(
  "/projects",
  validate([
    bodyRequiredString("ma_kh"),
    bodyRequiredString("ma_du_an"),
    bodyRequiredString("ten_khach"),
  ]),
  parseSalesProjectInput,
  createProject
);

router.get("/projects/:id", validate([paramInt("id", "Invalid project id")]), getProjectById);

router.put(
  "/projects/:id",
  validate([
    paramInt("id", "Invalid project id"),
    bodyRequiredString("ma_kh"),
    bodyRequiredString("ma_du_an"),
    bodyRequiredString("ten_khach"),
  ]),
  parseSalesProjectInput,
  updateProject
);

module.exports = router;
