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

function mapProjectTaskRow(row) {
  return {
    id: Number(row.id),
    project_id: Number(row.project_id),
    tieuDe: row.tieu_de ?? "",
    nguoiPhuTrach: row.nguoi_phu_trach ?? "",
    hanChot: formatDate(row.han_chot),
    trangThai: row.trang_thai ?? "Chưa làm",
    ghiChu: row.ghi_chu ?? "",
    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
  };
}

module.exports = {
  formatDate,
  formatTimestamp,
  toDbDate,
  mapProjectTaskRow,
};
