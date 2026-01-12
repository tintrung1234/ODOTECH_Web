function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
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

function mapProjectRow(row) {
  return {
    id: Number(row.id),
    project_code: row.project_code ?? "",
    project_type: row.project_type ?? "",
    name: row.name ?? "",

    client_id: row.client_id === null || row.client_id === undefined ? null : Number(row.client_id),
    sale_id: row.sale_id === null || row.sale_id === undefined ? null : Number(row.sale_id),
    pm_id: row.pm_id === null || row.pm_id === undefined ? null : Number(row.pm_id),

    status: row.status ?? "",
    priority: row.priority ?? "",

    budget: Number(row.budget ?? 0),
    contract_value: Number(row.contract_value ?? 0),
    actual_cost: Number(row.actual_cost ?? 0),
    deposit_received: Number(row.deposit_received ?? 0),

    payment_status: row.payment_status ?? "",
    total_hours: Number(row.total_hours ?? 0),

    technology_stack: row.technology_stack ?? "",
    domain_url: row.domain_url ?? "",
    production_url: row.production_url ?? "",

    start_date: formatDate(row.start_date),
    deadline: formatDate(row.deadline),
    completed_at: formatTimestamp(row.completed_at),

    description: row.description ?? "",

    requirements: row.requirements ?? "",
    source: row.source ?? "",
    progress_percent: Number(row.progress_percent ?? 0),
    assignee: row.assignee ?? "",
    tech_user_id: row.tech_user_id === null || row.tech_user_id === undefined ? null : Number(row.tech_user_id),
    customer_sender_id: row.customer_sender_id === null || row.customer_sender_id === undefined ? null : Number(row.customer_sender_id),

    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
  };
}

module.exports = {
  formatDate,
  formatTimestamp,
  toDbDate,
  toDbTimestamp,
  mapProjectRow,
};
