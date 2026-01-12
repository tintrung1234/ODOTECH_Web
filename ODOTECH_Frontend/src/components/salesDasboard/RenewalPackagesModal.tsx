import { useEffect, useMemo, useState } from 'react';

import type { ProjectData } from './interface/type';
import type { Account } from '../../interface/type';
import { formatCurrency } from '../../utils/formatDate';

type RenewalKind = 'domain' | 'hosting' | 'email' | 'content' | 'ads';

type RenewalRow = {
  projectId: number;
  maDuAn: string;
  tenKhach: string;
  saleId: string;
  saleName: string;
  kind: RenewalKind;
  ngayHetHan: string;
  phi: number | null;
  daysToDue: number | null;
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

function parseDaysToDue(ngayHetHan: string): number | null {
  const raw = safeText(ngayHetHan);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(t);
  const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function buildRenewalRows(projects: ProjectData[], accounts: Account[]): RenewalRow[] {
  const rows: RenewalRow[] = [];

  const saleNameById = new Map<string, string>();
  for (const a of accounts) {
    const id = safeText(a.id);
    const name = safeText(a.name);
    if (!id || !name) continue;
    saleNameById.set(id, name);
  }

  for (const p of projects) {
    const maDuAn = safeText(p.ma_du_an);
    const tenKhach = safeText(p.ten_khach);
    const saleId = safeText(p.sale_id);
    const saleName = saleId ? (saleNameById.get(saleId) || `#${saleId}`) : 'Chưa gán';

    if (p.gia_han_domain) {
      const ngayHetHan = safeText(p.ngay_hh_domain);
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        saleName,
        kind: 'domain',
        ngayHetHan,
        phi: Number.isFinite(Number(p.phi_gh_domain)) ? Number(p.phi_gh_domain) : 0,
        daysToDue: parseDaysToDue(ngayHetHan),
      });
    }

    if (p.gia_han_hosting) {
      const ngayHetHan = safeText(p.ngay_hh_hosting);
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        saleName,
        kind: 'hosting',
        ngayHetHan,
        phi: Number.isFinite(Number(p.phi_gh_hosting)) ? Number(p.phi_gh_hosting) : 0,
        daysToDue: parseDaysToDue(ngayHetHan),
      });
    }

    if (p.gia_han_email) {
      const ngayHetHan = safeText(p.ngay_hh_email);
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        saleName,
        kind: 'email',
        ngayHetHan,
        phi: Number.isFinite(Number(p.phi_gh_email)) ? Number(p.phi_gh_email) : 0,
        daysToDue: parseDaysToDue(ngayHetHan),
      });
    }

    if (p.gia_han_content) {
      const ngayHetHan = safeText(p.ngay_hh_content);
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        saleName,
        kind: 'content',
        ngayHetHan,
        phi: Number.isFinite(Number(p.phi_gh_content)) ? Number(p.phi_gh_content) : 0,
        daysToDue: parseDaysToDue(ngayHetHan),
      });
    }

    if (p.gia_han_ads) {
      const ngayHetHan = safeText(p.ngay_hh_ads);
      rows.push({
        projectId: p.id,
        maDuAn,
        tenKhach,
        saleId,
        saleName,
        kind: 'ads',
        ngayHetHan,
        phi: Number.isFinite(Number(p.phi_gh_ads)) ? Number(p.phi_gh_ads) : 0,
        daysToDue: parseDaysToDue(ngayHetHan),
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
  accounts?: Account[];
  onClose: () => void;
}

export default function RenewalPackagesModal({ open, projects, accounts = [], onClose }: RenewalPackagesModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const [q, setQ] = useState('');
  const [kind, setKind] = useState<RenewalKind | 'all'>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'next30'>('all');

  const rows = useMemo(() => buildRenewalRows(projects, accounts), [accounts, projects]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== 'all' && r.kind !== kind) return false;
      if (dueFilter === 'overdue' && !(typeof r.daysToDue === 'number' && r.daysToDue < 0)) return false;
      if (dueFilter === 'next30' && !(typeof r.daysToDue === 'number' && r.daysToDue >= 0 && r.daysToDue <= 30)) return false;

      if (!needle) return true;
      const blob = `${r.maDuAn} ${r.tenKhach} ${r.saleName} ${r.saleId} ${kindLabel(r.kind)}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [dueFilter, kind, q, rows]);

  const stats = useMemo(() => {
    const projectIds = new Set(filteredRows.map((r) => r.projectId));
    const totalFee = filteredRows.reduce((sum, r) => sum + (typeof r.phi === 'number' ? r.phi : 0), 0);
    const overdue = filteredRows.filter((r) => typeof r.daysToDue === 'number' && r.daysToDue < 0).length;
    const next30 = filteredRows.filter((r) => typeof r.daysToDue === 'number' && r.daysToDue >= 0 && r.daysToDue <= 30).length;
    return { totalPackages: filteredRows.length, totalProjects: projectIds.size, totalFee, overdue, next30 };
  }, [filteredRows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gói gia hạn</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tổng hợp các dịch vụ gia hạn theo dự án (lọc theo danh sách hiện tại)</p>
            </div>
            <button
              type="button"
              className="h-10 px-4 border border-gray-200 rounded-xl bg-white text-gray-700 font-medium hover:bg-gray-50"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>

          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-xs text-gray-500">Dự án có gia hạn</div>
              <div className="text-lg font-semibold text-gray-900">{stats.totalProjects}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-xs text-gray-500">Tổng gói</div>
              <div className="text-lg font-semibold text-gray-900">{stats.totalPackages}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-xs text-gray-500">Quá hạn</div>
              <div className="text-lg font-semibold text-red-600">{stats.overdue}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-xs text-gray-500">Sắp hết hạn (≤30 ngày)</div>
              <div className="text-lg font-semibold text-amber-600">{stats.next30}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-xs text-gray-500">Tổng phí</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(stats.totalFee)}</div>
            </div>
          </div>

          <div className="px-6 pb-4 flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo mã DA / khách hàng / sale..."
                className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as RenewalKind | 'all')}
                className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả gói</option>
                <option value="domain">Domain</option>
                <option value="hosting">Hosting</option>
                <option value="email">Email</option>
                <option value="content">Content</option>
                <option value="ads">Ads</option>
              </select>

              <select
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value as 'all' | 'overdue' | 'next30')}
                className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả hạn</option>
                <option value="overdue">Quá hạn</option>
                <option value="next30">Sắp hết hạn (≤30 ngày)</option>
              </select>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Mã DA</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Khách hàng</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sale</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Gói</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Hết hạn</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Trạng thái</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Phí</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td className="py-6 px-4 text-gray-600" colSpan={7}>
                        Không có dự án nào có đánh dấu gia hạn trong danh sách hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, idx) => {
                      const due = r.daysToDue;
                      const status =
                        typeof due === 'number'
                          ? (due < 0 ? { label: `Quá ${Math.abs(due)} ngày`, cls: 'bg-red-50 text-red-700 border-red-200' }
                            : due <= 30 ? { label: `Còn ${due} ngày`, cls: 'bg-amber-50 text-amber-800 border-amber-200' }
                              : { label: `Còn ${due} ngày`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
                          : { label: 'Chưa có hạn', cls: 'bg-gray-50 text-gray-700 border-gray-200' };

                      return (
                      <tr key={`${r.projectId}-${r.kind}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100">{r.maDuAn || '-'}</td>
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100">{r.tenKhach || '-'}</td>
                        <td className="py-3 px-4 text-gray-700 border-b border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">{r.saleName || '-'}</span>
                            {r.saleId && <span className="text-xs text-gray-500">#{r.saleId}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100">
                          <span className="text-xs px-2 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                            {kindLabel(r.kind)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 border-b border-gray-100">{r.ngayHetHan || '-'}</td>
                        <td className="py-3 px-4 text-gray-700 border-b border-gray-100">
                          <span className={`text-xs px-2 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-800 border-b border-gray-100 text-right">
                          {typeof r.phi === 'number' ? formatCurrency(r.phi) : '-'}
                        </td>
                      </tr>
                      );
                    })
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
