const accountsService = require("../services/accountsService");
const { requireUser } = require("../utils/authz");

function canListAccounts(role) {
  return [
    "admin",
    "support",
    "head_sales",
    "head_tech",
    "sales_manager",
    "dev_manager",
  ].includes(role);
}

function canManageAccounts(role) {
  return ["admin"].includes(role);
}

function toInt(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
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

function normalizeAccountInput(body, { requireBasics }) {
  const rawUsername = toString(body?.username).trim();
  const name = toString(body?.name).trim();
  const email = toString(body?.email).trim();

  if (requireBasics) {
    if (!name) return { error: "name is required" };
    if (!email) return { error: "email is required" };
  }

  const result = {
    username:
      rawUsername || (email.includes("@") ? email.split("@")[0].trim() : ""),
    name,
    email,
    phone: toString(body?.phone).trim(),
    role_system: toString(body?.role_system || "employee").trim(),
    point: toNumber(body?.point, 0),
    position: toString(body?.position).trim(),
    salary: toNumber(body?.salary, 0),
    payable: toNumber(body?.payable, 0),
    join_date: normalizeDate(body?.join_date),
    status: toString(body?.status || "active").trim(),
    last_login_at: toString(body?.last_login_at).trim(),
    competency_framework: body?.competency_framework || {},
  };

  // Only include contract fields if they exist in the request body
  if ('contract_start' in (body || {})) {
    result.contract_start = normalizeDate(body.contract_start);
  }
  if ('contract_end' in (body || {})) {
    result.contract_end = normalizeDate(body.contract_end);
  }
  if ('contract_type' in (body || {})) {
    result.contract_type = toString(body.contract_type).trim();
  }
  if ('renewal_history' in (body || {})) {
    result.renewal_history = Array.isArray(body.renewal_history) ? body.renewal_history : [];
  }

  return { value: result };
}

async function listAccounts(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!canListAccounts(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), 1000);
    const offset = Math.max(toInt(req.query.offset, 0), 0);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const role_system = typeof req.query.role_system === "string" ? req.query.role_system.trim() : "";

    const result = await accountsService.listAccounts({ limit, offset, q, status, role_system });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getAccountById(req, res, next) {
  try {
    const identity = requireUser(req, { requireUid: true });
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });

    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const canViewAny = canListAccounts(identity.role);
    if (!canViewAny && identity.uid !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const account = await accountsService.getAccountById(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function createAccount(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!canManageAccounts(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const normalized = normalizeAccountInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const created = await accountsService.createAccount(normalized.value);
    res.status(201).json(created);
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "email already exists" });
    }
    next(err);
  }
}

async function updateAccount(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!canManageAccounts(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const normalized = normalizeAccountInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const updated = await accountsService.updateAccount(id, normalized.value);
    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(updated);
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "email already exists" });
    }
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!canManageAccounts(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const ok = await accountsService.deleteAccount(id);
    if (!ok) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getAccountStats(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!["admin", "support"].includes(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const stats = await accountsService.getAccountStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function getAccountPasswordStatus(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!canManageAccounts(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const status = await accountsService.getAccountPasswordStatus(id);
    if (!status) return res.status(404).json({ message: "Account not found" });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function setAccountPassword(req, res, next) {
  try {
    const identity = requireUser(req);
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });
    if (!canManageAccounts(identity.role)) return res.status(403).json({ message: "Forbidden" });

    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const password = typeof req.body?.password === "string" ? req.body.password : "";

    const result = await accountsService.setAccountPassword(id, { password });
    if (!result) return res.status(404).json({ message: "Account not found" });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getCurrentUserProfile(req, res, next) {
  try {
    const identity = requireUser(req, { requireUid: true });
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });

    const account = await accountsService.getAccountById(identity.uid);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function updateCurrentUserProfile(req, res, next) {
  try {
    const identity = requireUser(req, { requireUid: true });
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });

    // Only allow updating specific fields
    const allowedFields = {
      name: toString(req.body?.name).trim(),
      email: toString(req.body?.email).trim(),
      phone: toString(req.body?.phone).trim(),
      username: toString(req.body?.username).trim(),
    };

    // Validate required fields
    if (!allowedFields.name) {
      return res.status(400).json({ message: "name is required" });
    }
    if (!allowedFields.email) {
      return res.status(400).json({ message: "email is required" });
    }
    if (!allowedFields.username) {
      return res.status(400).json({ message: "username is required" });
    }

    const updated = await accountsService.updateAccount(identity.uid, allowedFields);
    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(updated);
  } catch (err) {
    if (err && err.code === "23505") {
      // Check which field caused the conflict
      if (err.constraint && err.constraint.includes('username')) {
        return res.status(409).json({ message: "username already exists" });
      }
      return res.status(409).json({ message: "email already exists" });
    }
    next(err);
  }
}

async function changeCurrentUserPassword(req, res, next) {
  try {
    const identity = requireUser(req, { requireUid: true });
    if (identity.error) return res.status(identity.error.status).json({ message: identity.error.message });

    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    // Validate inputs
    if (!newPassword) {
      return res.status(400).json({ message: "new password is required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "new password must be at least 6 characters" });
    }

    // Update password
    const result = await accountsService.setAccountPassword(identity.uid, { password: newPassword });
    if (!result) {
      return res.status(500).json({ message: "Failed to update password" });
    }

    // Send notification
    const notificationService = require("../services/notificationService");
    await notificationService.notifyUser({
      userId: identity.uid,
      type: "security",
      title: "Mật khẩu đã được thay đổi",
      message: "Mật khẩu của bạn vừa được cập nhật thành công. Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ quản trị viên ngay lập tức.",
      data: { account_id: identity.uid },
    });

    res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
