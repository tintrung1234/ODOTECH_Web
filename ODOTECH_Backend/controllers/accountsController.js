const accountsService = require("../services/accountsService");

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
  const name = toString(body?.name).trim();
  const email = toString(body?.email).trim();

  if (requireBasics) {
    if (!name) return { error: "name is required" };
    if (!email) return { error: "email is required" };
  }

  return {
    value: {
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
      password_hash: toString(body?.password_hash).trim(),
      last_login_at: toString(body?.last_login_at).trim(),
    },
  };
}

async function listAccounts(req, res, next) {
  try {
    const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), 200);
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
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid account id" });
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
    const stats = await accountsService.getAccountStats();
    res.json(stats);
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
};
