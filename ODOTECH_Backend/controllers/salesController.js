const salesService = require("../services/salesService");

const VALID_TRANG_THAI_CHOT = new Set(["DangCham", "DaKy", "Huy"]);
const VALID_TRANG_THAI_THU_TIEN = new Set(["Chua", "MotPhan", "Du"]);

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function toString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalizeDate(value) {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  return str;
}

function normalizeProjectInput(body, { requireBasics }) {
  const ma_kh = toString(body?.ma_kh).trim();
  const ma_du_an = toString(body?.ma_du_an).trim();
  const ten_khach = toString(body?.ten_khach).trim();

  if (requireBasics) {
    if (!ma_kh) return { error: "ma_kh is required" };
    if (!ma_du_an) return { error: "ma_du_an is required" };
    if (!ten_khach) return { error: "ten_khach is required" };
  }

  const trang_thai_chot = toString(body?.trang_thai_chot || "DangCham");
  if (trang_thai_chot && !VALID_TRANG_THAI_CHOT.has(trang_thai_chot)) {
    return { error: "Invalid trang_thai_chot" };
  }
  const trang_thai_thu_tien = toString(body?.trang_thai_thu_tien || "Chua");
  if (trang_thai_thu_tien && !VALID_TRANG_THAI_THU_TIEN.has(trang_thai_thu_tien)) {
    return { error: "Invalid trang_thai_thu_tien" };
  }

  const payments = Array.isArray(body?.danh_sach_thanh_toan) ? body.danh_sach_thanh_toan : [];

  return {
    value: {
      ma_kh,
      ma_du_an,
      ten_khach,
      sdt: toString(body?.sdt),
      zalo_fb: toString(body?.zalo_fb),
      nguon_khach: toString(body?.nguon_khach),
      nhu_cau: toString(body?.nhu_cau),
      san_pham_dv: toString(body?.san_pham_dv),
      website: toString(body?.website),

      sale_id: toString(body?.sale_id),
      ky_thuat_id: toString(body?.ky_thuat_id),

      trang_thai_chot,
      trang_thai_thu_tien,
      trang_thai_trien_khai: toString(body?.trang_thai_trien_khai),
      ngay_tao: normalizeDate(body?.ngay_tao),
      lich_hen: normalizeDate(body?.lich_hen),
      ghi_chu: toString(body?.ghi_chu),
      ngay_cham_cuoi: normalizeDate(body?.ngay_cham_cuoi),
      hinh_thuc_cham: toString(body?.hinh_thuc_cham),

      phi_dich_vu: toNumber(body?.phi_dich_vu, 0),
      phat_sinh: toNumber(body?.phat_sinh, 0),
      ngay_doi_cuoi: normalizeDate(body?.ngay_doi_cuoi),
      so_lan_doi: toInt(body?.so_lan_doi, 0),

      ngay_ban_giao: normalizeDate(body?.ngay_ban_giao),
      ngay_tat_toan: normalizeDate(body?.ngay_tat_toan),
      ly_do_lau: toString(body?.ly_do_lau),
      chi_phi_outsource: toNumber(body?.chi_phi_outsource, 0),

      gia_han_domain: toBool(body?.gia_han_domain, false),
      ngay_hh_domain: normalizeDate(body?.ngay_hh_domain),
      phi_gh_domain: toNumber(body?.phi_gh_domain, 0),

      gia_han_hosting: toBool(body?.gia_han_hosting, false),
      ngay_hh_hosting: normalizeDate(body?.ngay_hh_hosting),
      phi_gh_hosting: toNumber(body?.phi_gh_hosting, 0),

      gia_han_email: toBool(body?.gia_han_email, false),
      ngay_hh_email: normalizeDate(body?.ngay_hh_email),
      phi_gh_email: toNumber(body?.phi_gh_email, 0),

      gia_han_content: toBool(body?.gia_han_content, false),
      gia_han_ads: toBool(body?.gia_han_ads, false),

      danh_sach_thanh_toan: payments.map((p, index) => ({
        lan_thanh_toan: toInt(p?.lan_thanh_toan, index + 1),
        so_tien: toNumber(p?.so_tien, 0),
        ngay_thanh_toan: normalizeDate(p?.ngay_thanh_toan),
        ghi_chu: toString(p?.ghi_chu),
      })),
    },
  };
}

async function listProjects(req, res, next) {
  try {
    const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), 200);
    const offset = Math.max(toInt(req.query.offset, 0), 0);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const trang_thai_chot = typeof req.query.trang_thai_chot === "string" ? req.query.trang_thai_chot.trim() : "";
    const trang_thai_thu_tien = typeof req.query.trang_thai_thu_tien === "string" ? req.query.trang_thai_thu_tien.trim() : "";

    const result = await salesService.listProjects({ limit, offset, q, trang_thai_chot, trang_thai_thu_tien });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const project = await salesService.getProjectById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const normalized = normalizeProjectInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const created = await salesService.createProject(normalized.value);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const id = toInt(req.params.id, NaN);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const normalized = normalizeProjectInput(req.body, { requireBasics: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const updated = await salesService.updateProject(id, normalized.value);
    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
};
