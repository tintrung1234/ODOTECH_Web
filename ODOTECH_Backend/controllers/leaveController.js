const leaveService = require("../services/leaveService");

const VALID_STATUS = new Set(["pending", "approved", "rejected"]);

function toInt(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalizeDate(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeLeaveInput(body, { requireBasics }) {
  const accountId = toInt(body?.accountId, NaN);
  const tuNgay = normalizeDate(body?.tuNgay);
  const denNgay = normalizeDate(body?.denNgay);

  if (requireBasics) {
    if (!Number.isFinite(accountId)) return { error: "accountId is required" };
    if (!tuNgay) return { error: "tuNgay is required" };
    if (!denNgay) return { error: "denNgay is required" };
  }

  const trangThai = toString(body?.trangThai || "pending").trim();
  if (trangThai && !VALID_STATUS.has(trangThai)) {
    return { error: "Invalid trangThai" };
  }

  return {
    value: {
      accountId,
      tuNgay,
      denNgay,
      lyDo: toString(body?.lyDo),
      trangThai,
      ngayTao: normalizeDate(body?.ngayTao),
      nguoiDuyet: toString(body?.nguoiDuyet).trim(),
      ngayXuLy: normalizeDate(body?.ngayXuLy),
      ghiChu: toString(body?.ghiChu),
    },
  };
}

async function listLeaveRequests(req, res, next) {
  try {
    const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), 200);
    const offset = Math.max(toInt(req.query.offset, 0), 0);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const trangThai = typeof req.query.trangThai === "string" ? req.query.trangThai.trim() : "";
    const accountId = req.query.accountId ? toInt(req.query.accountId, NaN) : NaN;

    const result = await leaveService.listLeaveRequests({
      limit,
      offset,
      q,
      trangThai,
      accountId: Number.isFinite(accountId) ? accountId : null,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getLeaveRequestById(req, res, next) {
  try {
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid leave id" });
    }

    const leave = await leaveService.getLeaveRequestById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(leave);
  } catch (err) {
    next(err);
  }
}

async function createLeaveRequest(req, res, next) {
  try {
    const normalized = normalizeLeaveInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const created = await leaveService.createLeaveRequest(normalized.value);
    res.status(201).json(created);
  } catch (err) {
    // Foreign key violation (account_id not found)
    if (err && err.code === "23503") {
      return res.status(400).json({ message: "Invalid accountId" });
    }
    next(err);
  }
}

async function updateLeaveRequest(req, res, next) {
  try {
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid leave id" });
    }

    const normalized = normalizeLeaveInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const updated = await leaveService.updateLeaveRequest(id, normalized.value);
    if (!updated) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(updated);
  } catch (err) {
    if (err && err.code === "23503") {
      return res.status(400).json({ message: "Invalid accountId" });
    }
    next(err);
  }
}

async function deleteLeaveRequest(req, res, next) {
  try {
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid leave id" });
    }

    const ok = await leaveService.deleteLeaveRequest(id);
    if (!ok) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
};
