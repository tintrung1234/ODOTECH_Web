-- Sample seed data for Sales module
-- Safe to re-run: uses UPSERT by ma_du_an and resets payments for each seeded project.

BEGIN;

-- Project 1
WITH p AS (
  INSERT INTO sales_projects (
    ma_kh, ma_du_an, ten_khach, sdt, zalo_fb, nguon_khach, nhu_cau, san_pham_dv, website,
    sale_id, ky_thuat_id,
    trang_thai_chot, trang_thai_thu_tien, trang_thai_trien_khai,
    ngay_tao, lich_hen, ghi_chu, ngay_cham_cuoi, hinh_thuc_cham,
    phi_dich_vu, phat_sinh, ngay_doi_cuoi, so_lan_doi,
    ngay_ban_giao, ngay_tat_toan, ly_do_lau, chi_phi_outsource,
    gia_han_domain, ngay_hh_domain, phi_gh_domain,
    gia_han_hosting, ngay_hh_hosting, phi_gh_hosting,
    gia_han_email, ngay_hh_email, phi_gh_email,
    gia_han_content, gia_han_ads
  ) VALUES (
    'KH001', 'DA2312-01', 'Công ty ABC', '0901234567', 'zalo.me/abc', 'FB', 'Web bán hàng', 'Web Pro', 'https://abc.com',
    'Sale 1', 'KT1',
    'DangCham', 'MotPhan', 'Đang code Frontend',
    DATE '2023-12-01', DATE '2023-12-25', 'Khách muốn giao diện tối giản', DATE '2023-12-20', 'Call',
    10000000, 0, DATE '2023-12-30', 1,
    DATE '2024-01-15', NULL, '', 0,
    TRUE, DATE '2024-12-05', 750000,
    TRUE, DATE '2024-12-05', 1500000,
    FALSE, NULL, 0,
    FALSE, FALSE
  )
  ON CONFLICT (ma_du_an)
  DO UPDATE SET
    ma_kh = EXCLUDED.ma_kh,
    ten_khach = EXCLUDED.ten_khach,
    sdt = EXCLUDED.sdt,
    zalo_fb = EXCLUDED.zalo_fb,
    nguon_khach = EXCLUDED.nguon_khach,
    nhu_cau = EXCLUDED.nhu_cau,
    san_pham_dv = EXCLUDED.san_pham_dv,
    website = EXCLUDED.website,
    sale_id = EXCLUDED.sale_id,
    ky_thuat_id = EXCLUDED.ky_thuat_id,
    trang_thai_chot = EXCLUDED.trang_thai_chot,
    trang_thai_thu_tien = EXCLUDED.trang_thai_thu_tien,
    trang_thai_trien_khai = EXCLUDED.trang_thai_trien_khai,
    ngay_tao = EXCLUDED.ngay_tao,
    lich_hen = EXCLUDED.lich_hen,
    ghi_chu = EXCLUDED.ghi_chu,
    ngay_cham_cuoi = EXCLUDED.ngay_cham_cuoi,
    hinh_thuc_cham = EXCLUDED.hinh_thuc_cham,
    phi_dich_vu = EXCLUDED.phi_dich_vu,
    phat_sinh = EXCLUDED.phat_sinh,
    ngay_doi_cuoi = EXCLUDED.ngay_doi_cuoi,
    so_lan_doi = EXCLUDED.so_lan_doi,
    ngay_ban_giao = EXCLUDED.ngay_ban_giao,
    ngay_tat_toan = EXCLUDED.ngay_tat_toan,
    ly_do_lau = EXCLUDED.ly_do_lau,
    chi_phi_outsource = EXCLUDED.chi_phi_outsource,
    gia_han_domain = EXCLUDED.gia_han_domain,
    ngay_hh_domain = EXCLUDED.ngay_hh_domain,
    phi_gh_domain = EXCLUDED.phi_gh_domain,
    gia_han_hosting = EXCLUDED.gia_han_hosting,
    ngay_hh_hosting = EXCLUDED.ngay_hh_hosting,
    phi_gh_hosting = EXCLUDED.phi_gh_hosting,
    gia_han_email = EXCLUDED.gia_han_email,
    ngay_hh_email = EXCLUDED.ngay_hh_email,
    phi_gh_email = EXCLUDED.phi_gh_email,
    gia_han_content = EXCLUDED.gia_han_content,
    gia_han_ads = EXCLUDED.gia_han_ads
  RETURNING id
), cleared AS (
  DELETE FROM sales_payments sp USING p WHERE sp.project_id = p.id
)
INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
SELECT p.id, x.lan_thanh_toan, x.so_tien, x.ngay_thanh_toan, x.ghi_chu
FROM p
JOIN (VALUES
  (1, 3000000::bigint, DATE '2023-12-05', 'Cọc 30%'),
  (2, 4000000::bigint, DATE '2023-12-20', 'Thanh toán lần 2'),
  (3, 3000000::bigint, DATE '2024-01-10', 'Thanh toán lần 3')
) AS x(lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu) ON TRUE;

-- Project 2
WITH p AS (
  INSERT INTO sales_projects (
    ma_kh, ma_du_an, ten_khach, sdt, zalo_fb, nguon_khach, nhu_cau, san_pham_dv, website,
    sale_id, ky_thuat_id,
    trang_thai_chot, trang_thai_thu_tien, trang_thai_trien_khai,
    ngay_tao, lich_hen, ghi_chu, ngay_cham_cuoi, hinh_thuc_cham,
    phi_dich_vu, phat_sinh, ngay_doi_cuoi, so_lan_doi,
    ngay_ban_giao, ngay_tat_toan, ly_do_lau, chi_phi_outsource,
    gia_han_domain, ngay_hh_domain, phi_gh_domain,
    gia_han_hosting, ngay_hh_hosting, phi_gh_hosting,
    gia_han_email, ngay_hh_email, phi_gh_email,
    gia_han_content, gia_han_ads
  ) VALUES (
    'KH002', 'DA2401-02', 'Nhà hàng Ẩm Thực Việt', '0987654321', 'fb.com/amthucviet', 'Ads', 'Landing giới thiệu nhà hàng + đặt bàn', 'Landing', 'https://amthucviet.vn',
    'Sale 2', 'KT2',
    'DaKy', 'Du', 'Đã bàn giao',
    DATE '2024-01-05', DATE '2024-01-08', 'Ưu tiên tốc độ tải trang', DATE '2024-02-01', 'Meeting',
    6500000, 500000, DATE '2024-01-20', 2,
    DATE '2024-02-05', DATE '2024-02-06', '', 0,
    TRUE, DATE '2025-02-05', 800000,
    TRUE, DATE '2025-02-05', 1200000,
    TRUE, DATE '2025-02-05', 600000,
    FALSE, TRUE
  )
  ON CONFLICT (ma_du_an)
  DO UPDATE SET
    ma_kh = EXCLUDED.ma_kh,
    ten_khach = EXCLUDED.ten_khach,
    sdt = EXCLUDED.sdt,
    zalo_fb = EXCLUDED.zalo_fb,
    nguon_khach = EXCLUDED.nguon_khach,
    nhu_cau = EXCLUDED.nhu_cau,
    san_pham_dv = EXCLUDED.san_pham_dv,
    website = EXCLUDED.website,
    sale_id = EXCLUDED.sale_id,
    ky_thuat_id = EXCLUDED.ky_thuat_id,
    trang_thai_chot = EXCLUDED.trang_thai_chot,
    trang_thai_thu_tien = EXCLUDED.trang_thai_thu_tien,
    trang_thai_trien_khai = EXCLUDED.trang_thai_trien_khai,
    ngay_tao = EXCLUDED.ngay_tao,
    lich_hen = EXCLUDED.lich_hen,
    ghi_chu = EXCLUDED.ghi_chu,
    ngay_cham_cuoi = EXCLUDED.ngay_cham_cuoi,
    hinh_thuc_cham = EXCLUDED.hinh_thuc_cham,
    phi_dich_vu = EXCLUDED.phi_dich_vu,
    phat_sinh = EXCLUDED.phat_sinh,
    ngay_doi_cuoi = EXCLUDED.ngay_doi_cuoi,
    so_lan_doi = EXCLUDED.so_lan_doi,
    ngay_ban_giao = EXCLUDED.ngay_ban_giao,
    ngay_tat_toan = EXCLUDED.ngay_tat_toan,
    ly_do_lau = EXCLUDED.ly_do_lau,
    chi_phi_outsource = EXCLUDED.chi_phi_outsource,
    gia_han_domain = EXCLUDED.gia_han_domain,
    ngay_hh_domain = EXCLUDED.ngay_hh_domain,
    phi_gh_domain = EXCLUDED.phi_gh_domain,
    gia_han_hosting = EXCLUDED.gia_han_hosting,
    ngay_hh_hosting = EXCLUDED.ngay_hh_hosting,
    phi_gh_hosting = EXCLUDED.phi_gh_hosting,
    gia_han_email = EXCLUDED.gia_han_email,
    ngay_hh_email = EXCLUDED.ngay_hh_email,
    phi_gh_email = EXCLUDED.phi_gh_email,
    gia_han_content = EXCLUDED.gia_han_content,
    gia_han_ads = EXCLUDED.gia_han_ads
  RETURNING id
), cleared AS (
  DELETE FROM sales_payments sp USING p WHERE sp.project_id = p.id
)
INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
SELECT p.id, x.lan_thanh_toan, x.so_tien, x.ngay_thanh_toan, x.ghi_chu
FROM p
JOIN (VALUES
  (1, 7000000::bigint, DATE '2024-01-06', 'Thanh toán 100% (gồm phát sinh)')
) AS x(lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu) ON TRUE;

-- Project 3
WITH p AS (
  INSERT INTO sales_projects (
    ma_kh, ma_du_an, ten_khach, sdt, zalo_fb, nguon_khach, nhu_cau, san_pham_dv, website,
    sale_id, ky_thuat_id,
    trang_thai_chot, trang_thai_thu_tien, trang_thai_trien_khai,
    ngay_tao, lich_hen, ghi_chu, ngay_cham_cuoi, hinh_thuc_cham,
    phi_dich_vu, phat_sinh, ngay_doi_cuoi, so_lan_doi,
    ngay_ban_giao, ngay_tat_toan, ly_do_lau, chi_phi_outsource,
    gia_han_domain, ngay_hh_domain, phi_gh_domain,
    gia_han_hosting, ngay_hh_hosting, phi_gh_hosting,
    gia_han_email, ngay_hh_email, phi_gh_email,
    gia_han_content, gia_han_ads
  ) VALUES (
    'KH003', 'DA2403-07', 'Công ty Logistics XYZ', '0911222333', 'zalo.me/xyz', 'GT', 'Website giới thiệu + form báo giá', 'Web Basic', 'https://xyzlogistics.com',
    'Sale 1', 'KT3',
    'DangCham', 'Chua', 'Chưa triển khai',
    DATE '2024-03-10', DATE '2024-03-15', 'Đợi duyệt báo giá', DATE '2024-03-12', 'Zalo',
    8500000, 0, NULL, 0,
    NULL, NULL, 'Chưa chốt kỹ yêu cầu', 0,
    FALSE, NULL, 0,
    FALSE, NULL, 0,
    FALSE, NULL, 0,
    FALSE, FALSE
  )
  ON CONFLICT (ma_du_an)
  DO UPDATE SET
    ma_kh = EXCLUDED.ma_kh,
    ten_khach = EXCLUDED.ten_khach,
    sdt = EXCLUDED.sdt,
    zalo_fb = EXCLUDED.zalo_fb,
    nguon_khach = EXCLUDED.nguon_khach,
    nhu_cau = EXCLUDED.nhu_cau,
    san_pham_dv = EXCLUDED.san_pham_dv,
    website = EXCLUDED.website,
    sale_id = EXCLUDED.sale_id,
    ky_thuat_id = EXCLUDED.ky_thuat_id,
    trang_thai_chot = EXCLUDED.trang_thai_chot,
    trang_thai_thu_tien = EXCLUDED.trang_thai_thu_tien,
    trang_thai_trien_khai = EXCLUDED.trang_thai_trien_khai,
    ngay_tao = EXCLUDED.ngay_tao,
    lich_hen = EXCLUDED.lich_hen,
    ghi_chu = EXCLUDED.ghi_chu,
    ngay_cham_cuoi = EXCLUDED.ngay_cham_cuoi,
    hinh_thuc_cham = EXCLUDED.hinh_thuc_cham,
    phi_dich_vu = EXCLUDED.phi_dich_vu,
    phat_sinh = EXCLUDED.phat_sinh,
    ngay_doi_cuoi = EXCLUDED.ngay_doi_cuoi,
    so_lan_doi = EXCLUDED.so_lan_doi,
    ngay_ban_giao = EXCLUDED.ngay_ban_giao,
    ngay_tat_toan = EXCLUDED.ngay_tat_toan,
    ly_do_lau = EXCLUDED.ly_do_lau,
    chi_phi_outsource = EXCLUDED.chi_phi_outsource,
    gia_han_domain = EXCLUDED.gia_han_domain,
    ngay_hh_domain = EXCLUDED.ngay_hh_domain,
    phi_gh_domain = EXCLUDED.phi_gh_domain,
    gia_han_hosting = EXCLUDED.gia_han_hosting,
    ngay_hh_hosting = EXCLUDED.ngay_hh_hosting,
    phi_gh_hosting = EXCLUDED.phi_gh_hosting,
    gia_han_email = EXCLUDED.gia_han_email,
    ngay_hh_email = EXCLUDED.ngay_hh_email,
    phi_gh_email = EXCLUDED.phi_gh_email,
    gia_han_content = EXCLUDED.gia_han_content,
    gia_han_ads = EXCLUDED.gia_han_ads
  RETURNING id
), cleared AS (
  DELETE FROM sales_payments sp USING p WHERE sp.project_id = p.id
)
INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
SELECT p.id, x.lan_thanh_toan, x.so_tien, x.ngay_thanh_toan, x.ghi_chu
FROM p
JOIN (VALUES
  (1, 0::bigint, NULL::date, 'Chưa phát sinh thanh toán')
) AS x(lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu) ON TRUE;

-- Project 4
WITH p AS (
  INSERT INTO sales_projects (
    ma_kh, ma_du_an, ten_khach, sdt, zalo_fb, nguon_khach, nhu_cau, san_pham_dv, website,
    sale_id, ky_thuat_id,
    trang_thai_chot, trang_thai_thu_tien, trang_thai_trien_khai,
    ngay_tao, lich_hen, ghi_chu, ngay_cham_cuoi, hinh_thuc_cham,
    phi_dich_vu, phat_sinh, ngay_doi_cuoi, so_lan_doi,
    ngay_ban_giao, ngay_tat_toan, ly_do_lau, chi_phi_outsource,
    gia_han_domain, ngay_hh_domain, phi_gh_domain,
    gia_han_hosting, ngay_hh_hosting, phi_gh_hosting,
    gia_han_email, ngay_hh_email, phi_gh_email,
    gia_han_content, gia_han_ads
  ) VALUES (
    'KH004', 'DA2406-12', 'Spa & Beauty Home', '0933444555', 'zalo.me/spahome', 'FB', 'Website giới thiệu + booking', 'Web Pro', 'https://spahome.vn',
    'Sale 3', 'KT1',
    'Huy', 'Chua', 'Dừng triển khai',
    DATE '2024-06-02', DATE '2024-06-05', 'Khách đổi kế hoạch kinh doanh', DATE '2024-06-03', 'Call',
    9000000, 0, DATE '2024-06-10', 1,
    NULL, NULL, 'Khách huỷ', 0,
    FALSE, NULL, 0,
    FALSE, NULL, 0,
    FALSE, NULL, 0,
    FALSE, FALSE
  )
  ON CONFLICT (ma_du_an)
  DO UPDATE SET
    ma_kh = EXCLUDED.ma_kh,
    ten_khach = EXCLUDED.ten_khach,
    sdt = EXCLUDED.sdt,
    zalo_fb = EXCLUDED.zalo_fb,
    nguon_khach = EXCLUDED.nguon_khach,
    nhu_cau = EXCLUDED.nhu_cau,
    san_pham_dv = EXCLUDED.san_pham_dv,
    website = EXCLUDED.website,
    sale_id = EXCLUDED.sale_id,
    ky_thuat_id = EXCLUDED.ky_thuat_id,
    trang_thai_chot = EXCLUDED.trang_thai_chot,
    trang_thai_thu_tien = EXCLUDED.trang_thai_thu_tien,
    trang_thai_trien_khai = EXCLUDED.trang_thai_trien_khai,
    ngay_tao = EXCLUDED.ngay_tao,
    lich_hen = EXCLUDED.lich_hen,
    ghi_chu = EXCLUDED.ghi_chu,
    ngay_cham_cuoi = EXCLUDED.ngay_cham_cuoi,
    hinh_thuc_cham = EXCLUDED.hinh_thuc_cham,
    phi_dich_vu = EXCLUDED.phi_dich_vu,
    phat_sinh = EXCLUDED.phat_sinh,
    ngay_doi_cuoi = EXCLUDED.ngay_doi_cuoi,
    so_lan_doi = EXCLUDED.so_lan_doi,
    ngay_ban_giao = EXCLUDED.ngay_ban_giao,
    ngay_tat_toan = EXCLUDED.ngay_tat_toan,
    ly_do_lau = EXCLUDED.ly_do_lau,
    chi_phi_outsource = EXCLUDED.chi_phi_outsource,
    gia_han_domain = EXCLUDED.gia_han_domain,
    ngay_hh_domain = EXCLUDED.ngay_hh_domain,
    phi_gh_domain = EXCLUDED.phi_gh_domain,
    gia_han_hosting = EXCLUDED.gia_han_hosting,
    ngay_hh_hosting = EXCLUDED.ngay_hh_hosting,
    phi_gh_hosting = EXCLUDED.phi_gh_hosting,
    gia_han_email = EXCLUDED.gia_han_email,
    ngay_hh_email = EXCLUDED.ngay_hh_email,
    phi_gh_email = EXCLUDED.phi_gh_email,
    gia_han_content = EXCLUDED.gia_han_content,
    gia_han_ads = EXCLUDED.gia_han_ads
  RETURNING id
), cleared AS (
  DELETE FROM sales_payments sp USING p WHERE sp.project_id = p.id
)
INSERT INTO sales_payments (project_id, lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu)
SELECT p.id, x.lan_thanh_toan, x.so_tien, x.ngay_thanh_toan, x.ghi_chu
FROM p
JOIN (VALUES
  (1, 0::bigint, NULL::date, 'Huỷ trước khi thanh toán')
) AS x(lan_thanh_toan, so_tien, ngay_thanh_toan, ghi_chu) ON TRUE;

COMMIT;
