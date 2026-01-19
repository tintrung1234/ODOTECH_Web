/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getTokenUser, normalizeRole, type CanonicalRole } from '../utils/auth';
import { createCompanyNotification, createRoleNotification, createUserNotification } from '../services/notificationService';

type AccountLite = { id: number; name?: string; username?: string; email?: string; role_system?: string; status?: string };

type Mode = 'company' | 'roles' | 'users';

const ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Hỗ trợ tổng' },
  { value: 'sale', label: 'Sale' },
  { value: 'sales_manager', label: 'Quản lý Sale' },
  { value: 'head_sales', label: 'Trưởng phòng Kinh doanh' },
  { value: 'dev', label: 'Dev' },
  { value: 'dev_manager', label: 'Quản lý Dev' },
  { value: 'head_tech', label: 'Trưởng phòng Kỹ thuật' },
];

function canAccess(role: CanonicalRole): boolean {
  return ['admin', 'head_sales', 'head_tech', 'sales_manager', 'dev_manager'].includes(role);
}

export default function SendNotification() {
  const navigate = useNavigate();

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  const [role, setRole] = useState<CanonicalRole>('unknown');
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountLite[]>([]);

  const [mode, setMode] = useState<Mode>('company');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [selectedRoleSystems, setSelectedRoleSystems] = useState<string[]>(['head_sales', 'head_tech', 'sales_manager', 'dev_manager']);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getTokenUser();
      const r = normalizeRole(user?.role);
      setRole(r);
      setLoading(false);

      if (!canAccess(r)) {
        // Keep UI simple: redirect to home
        navigate('/');
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!canAccess(role)) return;

    // Load accounts for "users" mode picker.
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/accounts?limit=1000&offset=0`, { credentials: 'include' });
        if (!res.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await res.json();
        const items: any[] = Array.isArray(json) ? json : (json.items ?? []);
        setAccounts(items.map((x) => ({
          id: Number(x.id),
          name: x.name,
          username: x.username,
          email: x.email,
          role_system: x.role_system,
          status: x.status,
        })));
      } catch {
        // ignore
      }
    })();
  }, [apiBaseUrl, role]);

  const visibleAccounts = useMemo(() => {
    return accounts
      .filter((a) => (a.status ?? '').toLowerCase() !== 'inactive')
      .filter((a) => (a.role_system ?? '').toLowerCase() !== 'customer')
      .sort((a, b) => String(a.name ?? a.username ?? '').localeCompare(String(b.name ?? b.username ?? ''), 'vi'));
  }, [accounts]);

  const toggleUser = (id: number) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleRole = (roleSystem: string) => {
    setSelectedRoleSystems((prev) => prev.includes(roleSystem) ? prev.filter((x) => x !== roleSystem) : [...prev, roleSystem]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) return setError('Vui lòng nhập tiêu đề');
    if (!message.trim()) return setError('Vui lòng nhập nội dung');

    setSubmitting(true);
    try {
      if (mode === 'company') {
        const res = await createCompanyNotification({ title, message });
        setSuccess(`Đã gửi thông báo toàn công ty: ${res.inserted} người nhận.`);
      } else if (mode === 'roles') {
        if (selectedRoleSystems.length === 0) {
          setError('Vui lòng chọn ít nhất 1 nhóm (role)');
          return;
        }
        const res = await createRoleNotification({ roleSystems: selectedRoleSystems, title, message });
        setSuccess(`Đã gửi theo cấp quản lý/nhóm: ${res.inserted} người nhận.`);
      } else {
        if (selectedUsers.length === 0) {
          setError('Vui lòng chọn ít nhất 1 người nhận');
          return;
        }
        const res = await createUserNotification({ userIds: selectedUsers, title, message });
        setSuccess(`Đã gửi cho người chỉ định: ${res.inserted} thông báo.`);
      }

      setTitle('');
      setMessage('');
      if (mode === 'users') setSelectedUsers([]);
    } catch (err: any) {
      setError(err?.message || 'Gửi thông báo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gửi thông báo</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Thông báo hệ thống: toàn công ty / theo cấp quản lý / chỉ định.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:opacity-90 transition-colors"
        >
          Quay lại
        </button>
      </div>

      {!canAccess(role) ? (
        <div className="p-4 rounded-lg bg-red-50 text-red-700">Bạn không có quyền truy cập.</div>
      ) : (
        <form onSubmit={onSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại gửi</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              >
                <option value="company">Toàn công ty</option>
                <option value="roles">Theo cấp quản lý/nhóm (role)</option>
                <option value="users">Quản lý chỉ định (chọn người)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lưu ý: hệ thống hiện phân loại theo role, chưa có phòng ban riêng.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>

          {mode === 'roles' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chọn nhóm/role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedRoleSystems.includes(opt.value)}
                      onChange={() => toggleRole(opt.value)}
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === 'users' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chọn người nhận</label>
              <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 dark:border-slate-700">
                {visibleAccounts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Không tải được danh sách accounts (hoặc bạn không có quyền).</div>
                ) : (
                  visibleAccounts.map((a) => {
                    const display = a.name || a.username || a.email || `#${a.id}`;
                    const meta = [a.role_system, a.email].filter(Boolean).join(' • ');
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleUser(a.id)}
                        className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedUsers.includes(a.id) ? 'bg-teal-50/50 dark:bg-teal-900/20' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{display}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{meta}</div>
                          </div>
                          <input type="checkbox" readOnly checked={selectedUsers.includes(a.id)} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đã chọn: {selectedUsers.length}</div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
          )}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
