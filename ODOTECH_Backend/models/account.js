function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function formatTimestamp(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toDbDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function toDbTimestamp(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function mapAccountRow(row) {
  return {
    id: Number(row.id),
    username: row.username ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role_system: row.role_system ?? "",
    point: Number(row.point ?? 0),
    position: row.position ?? "",
    salary: Number(row.salary ?? 0),
    payable: Number(row.payable ?? 0),
    join_date: formatDate(row.join_date),
    status: row.status ?? "",
    password_hash: row.password_hash ?? "",
    last_login_at: formatTimestamp(row.last_login_at),
    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
    competency_framework: row.competency_framework || {},
  };
}

module.exports = {
  formatDate,
  formatTimestamp,
  toDbDate,
  toDbTimestamp,
  mapAccountRow,
};
