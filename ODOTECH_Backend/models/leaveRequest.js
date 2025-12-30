function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function toDbDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function mapLeaveRow(row) {
  return {
    id: Number(row.id),
    accountId: Number(row.account_id),
    tuNgay: formatDate(row.tu_ngay),
    denNgay: formatDate(row.den_ngay),
    lyDo: row.ly_do ?? "",
    trangThai: row.trang_thai ?? "pending",
    ngayTao: formatDate(row.ngay_tao),
    nguoiDuyet: row.nguoi_duyet ?? undefined,
    ngayXuLy: formatDate(row.ngay_xu_ly),
    ghiChu: row.ghi_chu ?? undefined,
  };
}

module.exports = {
  formatDate,
  toDbDate,
  mapLeaveRow,
};
