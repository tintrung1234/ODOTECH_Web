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
  // Parse renewal_history if it's a string, otherwise use as-is
  let renewalHistory = [];
  if (row.renewal_history) {
    if (typeof row.renewal_history === 'string') {
      try {
        renewalHistory = JSON.parse(row.renewal_history);
      } catch (e) {
        renewalHistory = [];
      }
    } else if (Array.isArray(row.renewal_history)) {
      renewalHistory = row.renewal_history;
    }
  }

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
    last_login_at: formatTimestamp(row.last_login_at),
    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
    competency_framework: row.competency_framework || {},
    contract_start: formatDate(row.contract_start),
    contract_end: formatDate(row.contract_end),
    contract_type: row.contract_type ?? "",
    renewal_history: renewalHistory,
  };
}

module.exports = {
  formatDate,
  formatTimestamp,
  toDbDate,
  toDbTimestamp,
  mapAccountRow,
};
