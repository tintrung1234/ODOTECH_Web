const { Pool } = require("pg");

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function optionalString(value) {
  if (value === undefined || value === null) return undefined;
  const str = String(value);
  return str === "" ? undefined : str;
}

function requireEnv(name) {
  const value = optionalString(process.env[name]);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const connectionString = optionalString(process.env.DATABASE_URL);
const rawHost = optionalString(process.env.DATABASE_HOST);
const isNeon =
  (connectionString ? /neon\.tech/i.test(connectionString) : false) ||
  (rawHost ? /neon\.tech/i.test(rawHost) : false);

// If DATABASE_URL is not provided, fall back to discrete vars.
const host = connectionString ? undefined : requireEnv("DATABASE_HOST");
const database = connectionString ? undefined : requireEnv("DATABASE_NAME");
const user = connectionString
  ? undefined
  : requireEnv(
    process.env.DATABASE_USERNAME ? "DATABASE_USERNAME" : "DATABASE_USER"
  );
const password = optionalString(process.env.DATABASE_PASSWORD);

// =======================
// POOL CONFIG
// =======================
const pool = new Pool({
  connectionString,
  host,
  port: process.env.DATABASE_PORT
    ? Number(process.env.DATABASE_PORT)
    : 5432,
  database,
  user,
  password: password ? String(password) : undefined,

  // Neon bắt buộc SSL
  ssl: (() => {
    const enabled = parseBool(
      process.env.DATABASE_SSL,
      Boolean(connectionString) || isNeon
    );
    if (!enabled) return false;
    return {
      rejectUnauthorized: false, // Neon cần false
    };
  })(),

  // Timeout chống treo / rớt kết nối
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// =======================
// BẮT ERROR
// =======================
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err.message);
  // Không throw để tránh crash Node
});

// =======================
// SAFE CONNECT
// =======================
async function connectPostgres() {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      console.log("✅ PostgreSQL connected successfully");
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    // Không throw để server vẫn chạy
  }
}

async function disconnectPostgres() {
  try {
    await pool.end();
    console.log("🛑 PostgreSQL pool closed");
  } catch (err) {
    console.error("❌ Error closing PostgreSQL pool:", err.message);
  }
}

module.exports = {
  pool,
  connectPostgres,
  disconnectPostgres,
};
