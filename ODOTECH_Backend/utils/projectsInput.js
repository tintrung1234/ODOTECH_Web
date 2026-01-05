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

function normalizeNullableId(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProjectInput(body, { requireBasics }) {
  const project_code = toString(body?.project_code).trim();
  const name = toString(body?.name).trim();

  if (requireBasics) {
    if (!project_code) return { error: "project_code is required" };
    if (!name) return { error: "name is required" };
  }

  return {
    value: {
      project_code,
      project_type: toString(body?.project_type).trim(),
      name,

      client_id: normalizeNullableId(body?.client_id),
      sale_id: normalizeNullableId(body?.sale_id),
      pm_id: normalizeNullableId(body?.pm_id),

      status: toString(body?.status).trim(),
      priority: toString(body?.priority).trim(),

      budget: toNumber(body?.budget, 0),
      contract_value: toNumber(body?.contract_value, 0),
      actual_cost: toNumber(body?.actual_cost, 0),
      deposit_received: toNumber(body?.deposit_received, 0),

      payment_status: toString(body?.payment_status).trim(),
      total_hours: toNumber(body?.total_hours, 0),

      technology_stack: toString(body?.technology_stack).trim(),
      domain_url: toString(body?.domain_url).trim(),
      production_url: toString(body?.production_url).trim(),

      start_date: normalizeDate(body?.start_date),
      deadline: normalizeDate(body?.deadline),
      completed_at: toString(body?.completed_at).trim(),

      description: toString(body?.description),

      requirements: toString(body?.requirements),
      source: toString(body?.source).trim(),
      progress_percent: toNumber(body?.progress_percent, 0),
      assignee: toString(body?.assignee).trim(),
      tech_user: toString(body?.tech_user).trim(),
      customer_sender: toString(body?.customer_sender).trim(),

      // created_at / updated_at are managed by DB
      created_at: undefined,
      updated_at: undefined,
    },
  };
}

const ALLOWED_TASK_STATUSES = new Set(["Chưa làm", "Đang làm", "Đã xong"]);

function normalizeTaskInput(body, { requireTitle }) {
  const tieuDe = toString(body?.tieuDe).trim();
  const nguoiPhuTrach = toString(body?.nguoiPhuTrach).trim();
  const nguoiChinh = toString(body?.nguoiChinh).trim();
  const nguoiHoTro = toString(body?.nguoiHoTro).trim();
  const batDau = normalizeDate(body?.batDau);
  const hanChot = normalizeDate(body?.hanChot);
  const trangThai = toString(body?.trangThai, "Chưa làm").trim() || "Chưa làm";
  const tienDo = toNumber(body?.tienDo, 0);
  const gioCong = toNumber(body?.gioCong, 0);
  const mucUuTien = toString(body?.mucUuTien).trim();
  const ghiChu = toString(body?.ghiChu).trim();

  if (requireTitle && !tieuDe) return { error: "tieuDe is required" };
  if (trangThai && !ALLOWED_TASK_STATUSES.has(trangThai)) return { error: "Invalid trangThai" };

  return {
    value: {
      tieuDe,
      nguoiPhuTrach,
      nguoiChinh,
      nguoiHoTro,
      batDau,
      hanChot,
      trangThai,
      tienDo: Math.max(0, Math.min(100, tienDo)),
      gioCong: Math.max(0, gioCong),
      mucUuTien,
      ghiChu,
    },
  };
}

module.exports = {
  toInt,
  normalizeProjectInput,
  normalizeTaskInput,
  ALLOWED_TASK_STATUSES,
};
