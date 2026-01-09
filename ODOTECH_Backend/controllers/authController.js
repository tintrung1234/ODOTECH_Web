const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authService = require("../services/authService");

function toString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

async function login(req, res, next) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const username = toString(req.body?.username).trim();
    const email = toString(req.body?.email).trim();
    const password = toString(req.body?.password);

    if (!username && !email) return res.status(400).json({ message: "username is required" });
    if (!password) return res.status(400).json({ message: "password is required" });

    const account = username
      ? await authService.getAccountForAuthByUsername(username)
      : await authService.getAccountForAuthByEmail(email);
    if (!account) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (account.status && account.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    if (!account.password_hash) {
      return res.status(401).json({ message: "Account has no password set" });
    }

    const ok = await bcrypt.compare(password, account.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign(
      {
        uid: account.id,
        role: account.role_system,
        username: account.username,
        email: account.email,
        name: account.name,
      },
      jwtSecret,
      { expiresIn }
    );

    // Set httpOnly cookie
    const maxAge = expiresIn === "7d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAge
    });

    res.json({
      token,
      user: {
        id: account.id,
        name: account.name,
        username: account.username,
        email: account.email,
        role_system: account.role_system,
      },
      expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const username = toString(req.body?.username).trim();
    const password = toString(req.body?.password);

    if (!username) return res.status(400).json({ message: "username is required" });
    if (!password) return res.status(400).json({ message: "password is required" });

    const password_hash = await bcrypt.hash(password, 10);
    const created = await authService.registerAccount({ username, password_hash });

    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign(
      {
        uid: created.id,
        role: created.role_system,
        username: created.username,
        email: created.email,
        name: created.name,
      },
      jwtSecret,
      { expiresIn }
    );

    // Set httpOnly cookie
    const maxAge = expiresIn === "7d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAge
    });

    res.status(201).json({
      token,
      user: {
        id: created.id,
        name: created.name,
        username: created.username,
        email: created.email,
        role_system: created.role_system,
      },
      expiresIn,
    });
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ message: "username already exists" });
    }
    next(err);
  }
}

async function me(req, res) {
  // authMiddleware already sets req.user
  res.json({ user: req.user ?? null });
}

async function logout(req, res) {
  // Clear the httpOnly cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.json({ message: "Logged out successfully" });
}

module.exports = {
  login,
  register,
  me,
  logout,
};
