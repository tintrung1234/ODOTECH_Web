import { useEffect, useMemo, useState } from 'react';

export interface ResetPasswordModalAccount {
  id: number;
  name: string;
}

interface ResetPasswordModalProps {
  open: boolean;
  account: ResetPasswordModalAccount | null;
  onClose: () => void;
  onGetStatus: (accountId: number) => Promise<{ hasPassword: boolean }>;
  onSetPassword: (accountId: number, password?: string) => Promise<{ temporaryPassword?: string }>;
}

export default function ResetPasswordModal({ open, account, onClose, onGetStatus, onSetPassword }: ResetPasswordModalProps) {
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [useGenerated, setUseGenerated] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState<string>('');

  const canSubmit = useMemo(() => {
    if (!account) return false;
    if (busy) return false;
    return true;
  }, [account, busy]);

  useEffect(() => {
    if (!open || !account) return;

    const accountId = account.id;
    let cancelled = false;

    // Defer local resets to avoid synchronous setState in effect body.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setErrorMessage('');
      setTemporaryPassword('');
      setHasPassword(null);
      setUseGenerated(true);
      setPassword('');
      setConfirmPassword('');
      setStatusLoading(true);
    });

    onGetStatus(accountId)
      .then((res) => {
        if (cancelled) return;
        setHasPassword(Boolean(res?.hasPassword));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErrorMessage(e instanceof Error ? e.message : 'Không lấy được trạng thái mật khẩu');
      })
      .finally(() => {
        if (cancelled) return;
        setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [account, onGetStatus, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative h-full w-full p-4 flex items-center justify-center">
        <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Đặt lại mật khẩu</h2>
            <div className="text-sm text-gray-600 mt-1">Tài khoản: <span className="font-medium text-gray-900">{account?.name ?? ''}</span></div>
          </div>

          <div className="px-6 py-5">
            <div className="text-sm text-gray-700">
              Không thể “xem” mật khẩu hiện tại. Bạn có thể đặt mật khẩu mới.
            </div>

            <div className="mt-3 text-sm text-gray-700">
              Trạng thái: {' '}
              {statusLoading ? (
                <span className="text-gray-500">Đang tải...</span>
              ) : hasPassword === null ? (
                <span className="text-gray-500">-</span>
              ) : hasPassword ? (
                <span className="text-emerald-700 font-medium">Đã có mật khẩu</span>
              ) : (
                <span className="text-amber-700 font-medium">Chưa có mật khẩu</span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={useGenerated}
                  onChange={(e) => {
                    setUseGenerated(e.target.checked);
                    setErrorMessage('');
                    setTemporaryPassword('');
                  }}
                />
                Tạo mật khẩu random (hệ thống sinh tự động)
              </label>

              {!useGenerated ? (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                        setTemporaryPassword('');
                      }}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorMessage('');
                        setTemporaryPassword('');
                      }}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                      placeholder="(Tuỳ chọn)"
                    />
                  </div>
                </div>
              ) : null}

              {temporaryPassword ? (
                <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="text-sm text-emerald-800 font-medium">Mật khẩu tạm thời</div>
                  <div className="mt-2 flex gap-2 items-center">
                    <input
                      type="text"
                      readOnly
                      value={temporaryPassword}
                      className="flex-1 h-10 px-3 border border-emerald-200 rounded-lg bg-white text-emerald-900"
                    />
                    <button
                      type="button"
                      className="h-10 px-4 rounded-lg bg-emerald-600 text-white font-medium"
                      onClick={() => {
                        void navigator.clipboard?.writeText(temporaryPassword);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-xs text-emerald-700 mt-2">Mật khẩu này chỉ hiển thị một lần. Hãy lưu lại trước khi đóng.</div>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{errorMessage}</div>
              ) : null}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              className="h-10 px-5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium"
              onClick={onClose}
              disabled={busy}
            >
              Đóng
            </button>
            <button
              type="button"
              className="h-10 px-5 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit}
              onClick={() => {
                if (!account) return;
                setBusy(true);
                setErrorMessage('');

                const p = useGenerated ? '' : password;
                onSetPassword(account.id, p)
                  .then((res) => {
                    if (res?.temporaryPassword) {
                      setTemporaryPassword(res.temporaryPassword);
                    } else {
                      setTemporaryPassword('');
                    }
                  })
                  .catch((e: unknown) => {
                    setErrorMessage(e instanceof Error ? e.message : 'Không đặt lại được mật khẩu');
                  })
                  .finally(() => setBusy(false));
              }}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
