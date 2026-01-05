function isBlank(value) {
  if (value === undefined || value === null) return true;
  return String(value).trim() === "";
}

function isIntLike(value) {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "number") return Number.isInteger(value);
  const str = String(value).trim();
  return /^\d+$/.test(str);
}

function toInt(value) {
  if (typeof value === "number") return value;
  return Number.parseInt(String(value), 10);
}

function isFiniteNumber(value) {
  if (value === undefined || value === null || value === "") return false;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n);
}

function validate(rules) {
  return (req, res, next) => {
    try {
      for (const rule of rules) {
        const message = rule(req);
        if (message) return res.status(400).json({ message });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function paramInt(name, message) {
  const msg = message || `Invalid ${name}`;
  return (req) => {
    if (!isIntLike(req.params?.[name])) return msg;
    return null;
  };
}

function queryIntOptional(name, { min, max, message } = {}) {
  const msg = message || `Invalid ${name}`;
  return (req) => {
    const value = req.query?.[name];
    if (value === undefined) return null;
    if (!isIntLike(value)) return msg;
    const parsed = toInt(value);
    if (!Number.isFinite(parsed)) return msg;
    if (min !== undefined && parsed < min) return msg;
    if (max !== undefined && parsed > max) return msg;
    return null;
  };
}

function queryStringOptional(name, { maxLen, message } = {}) {
  const msg = message || `Invalid ${name}`;
  return (req) => {
    const value = req.query?.[name];
    if (value === undefined) return null;
    const str = String(value);
    if (maxLen !== undefined && str.length > maxLen) return msg;
    return null;
  };
}

function bodyRequiredString(name, message) {
  const msg = message || `${name} is required`;
  return (req) => {
    if (isBlank(req.body?.[name])) return msg;
    return null;
  };
}

function bodyStringOptional(name, { maxLen, message } = {}) {
  const msg = message || `Invalid ${name}`;
  return (req) => {
    const value = req.body?.[name];
    if (value === undefined) return null;
    const str = String(value);
    if (maxLen !== undefined && str.length > maxLen) return msg;
    return null;
  };
}

function bodyNumberOptional(name, { min, max, message } = {}) {
  const msg = message || `Invalid ${name}`;
  return (req) => {
    const value = req.body?.[name];
    if (value === undefined) return null;
    if (!isFiniteNumber(value)) return msg;
    const num = typeof value === "number" ? value : Number(value);
    if (min !== undefined && num < min) return msg;
    if (max !== undefined && num > max) return msg;
    return null;
  };
}

function bodyIntOrNullOptional(name, { message } = {}) {
  const msg = message || `Invalid ${name}`;
  return (req) => {
    const value = req.body?.[name];
    if (value === undefined || value === null || value === "") return null;
    if (!isIntLike(value)) return msg;
    return null;
  };
}

function bodyInOptional(name, allowed, { message } = {}) {
  const msg = message || `Invalid ${name}`;
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return (req) => {
    const value = req.body?.[name];
    if (value === undefined) return null;
    if (!set.has(String(value))) return msg;
    return null;
  };
}

module.exports = {
  validate,
  paramInt,
  queryIntOptional,
  queryStringOptional,
  bodyRequiredString,
  bodyStringOptional,
  bodyNumberOptional,
  bodyIntOrNullOptional,
  bodyInOptional,
};
