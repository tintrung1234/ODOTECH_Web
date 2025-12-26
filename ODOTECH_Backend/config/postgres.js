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

// If DATABASE_URL is not provided, fall back to discrete vars.
// We validate only the essentials to avoid confusing pg auth errors.
const host = connectionString ? undefined : requireEnv("DATABASE_HOST");
const database = connectionString ? undefined : requireEnv("DATABASE_NAME");
const user = connectionString
  ? undefined
  : requireEnv(process.env.DATABASE_USERNAME ? "DATABASE_USERNAME" : "DATABASE_USER");
const password = optionalString(process.env.DATABASE_PASSWORD);

const pool = new Pool({
  connectionString,
  host,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
  database,
  user,
  // pg SCRAM requires password to be a string when provided.
  password: password ? String(password) : undefined,
  ssl: parseBool(process.env.DATABASE_SSL, false) ? { rejectUnauthorized: false } : false,
});

async function connectPostgres() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

async function disconnectPostgres() {
  await pool.end();
}

module.exports = {
  pool,
  connectPostgres,
  disconnectPostgres,
};
