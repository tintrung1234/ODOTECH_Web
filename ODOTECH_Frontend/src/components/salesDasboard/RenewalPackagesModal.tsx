import { useEffect, useMemo } from 'react';

import type { ProjectData } from './interface/type';
import { formatCurrency } from '../../utils/formatDate';

type RenewalKind = 'domain' | 'hosting' | 'email' | 'content' | 'ads';

type RenewalRow = {
  projectId: number;
  maDuAn: string;
  tenKhach: string;
  saleId: string;
  kind: RenewalKind;
  ngayHetHan: string;
  phi: number | null;
};

function kindLabel(kind: RenewalKind): string {
  if (kind === 'domain') return 'Domain';
  if (kind === 'hosting') return 'Hosting';
  if (kind === 'email') return 'Email';
  if (kind === 'content') return 'Content';
  return 'Ads';
}

function safeText(v: unknown): string {
  const s = String(v ?? '').trim();
  return s;
}

function buildRenewalRows(projects: ProjectData[]): RenewalRow[] {
  const rows: RenewalRow[] = [];

  for (const p of projects) {
    const maDuAn = safeText(p.ma_du_an);
    const tenKhach = safeText(p.ten_khach);
    const saleId = safeText(p.sale_id);

    if (p.gia_han_domain) {
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        kind: 'domain',
        ngayHetHan: safeText(p.ngay_hh_domain),
        phi: Number.isFinite(Number(p.phi_gh_domain)) ? Number(p.phi_gh_domain) : 0,
      });
    }

    if (p.gia_han_hosting) {
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        kind: 'hosting',
        ngayHetHan: safeText(p.ngay_hh_hosting),
        phi: Number.isFinite(Number(p.phi_gh_hosting)) ? Number(p.phi_gh_hosting) : 0,
      });
    }

    if (p.gia_han_email) {
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        kind: 'email',
        ngayHetHan: safeText(p.ngay_hh_email),
        phi: Number.isFinite(Number(p.phi_gh_email)) ? Number(p.phi_gh_email) : 0,
      });
    }

    if (p.gia_han_content) {
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        kind: 'content',
        ngayHetHan: safeText(p.ngay_hh_content),
        phi: Number.isFinite(Number(p.phi_gh_content)) ? Number(p.phi_gh_content) : 0,
      });
    }

    if (p.gia_han_ads) {
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        kind: 'ads',
        ngayHetHan: safeText(p.ngay_hh_ads),
        phi: Number.isFinite(Number(p.phi_gh_ads)) ? Number(p.phi_gh_ads) : 0,
      });
    }
  }

  const toSortKey = (d: string) => {
    const s = safeText(d);
    if (!s) return Number.POSITIVE_INFINITY;
    const t = new Date(s).getTime();
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  };

  return rows.sort((a, b) => {
    const ta = toSortKey(a.ngayHetHan);
    const tb = toSortKey(b.ngayHetHan);
    if (ta !== tb) return ta - tb;
    return a.tenKhach.localeCompare(b.tenKhach, 'vi');
  });
}

interface RenewalPackagesModalProps {
  open: boolean;
  projects: ProjectData[];
  onClose: () => void;
}

export default function RenewalPackagesModal({ open, projects, onClose }: RenewalPackagesModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const rows = useMemo(() => buildRenewalRows(projects), [projects]);

  const stats = useMemo(() => {
    const projectIds = new Set(rows.map((r) => r.projectId));
    const totalFee = rows.reduce((sum, r) => sum + (typeof r.phi === 'number' ? r.phi : 0), 0);
    return { totalPackages: rows.length, totalProjects: projectIds.size, totalFee };
  }, [rows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Các gói gia hạn</h2>
            <button
              type="button"
              className="h-9 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>

          <div className="px-6 py-4 text-sm text-gray-700 flex flex-wrap gap-x-6 gap-y-2">
            <div>
              Dự án có gia hạn: <span className="font-semibold">{stats.totalProjects}</span>
            </div>
            <div>
              Tổng gói: <span className="font-semibold">{stats.totalPackages}</span>
            </div>
            <div>
              Tổng phí: <span className="font-semibold">{formatCurrency(stats.totalFee)}</span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Mã DA</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Khách hàng</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sale</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Gói</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Hết hạn</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Phí</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="py-4 px-4 text-gray-600" colSpan={6}>
                        Không có dự án nào có đánh dấu gia hạn trong danh sách hiện tại.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={`${r.projectId}-${r.kind}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100">{r.maDuAn || '-'}</td>
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100">{r.tenKhach || '-'}</td>
                        <td className="py-3 px-4 text-gray-700 border-b border-gray-100">{r.saleId || '-'}</td>
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100">
                          <span className="text-xs px-2 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                            {kindLabel(r.kind)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 border-b border-gray-100">{r.ngayHetHan || '-'}</td>
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100 text-right">
                          {typeof r.phi === 'number' ? formatCurrency(r.phi) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
