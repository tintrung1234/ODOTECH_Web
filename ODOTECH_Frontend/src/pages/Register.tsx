import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { setToken } from '../utils/auth';

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-extrabold text-gray-900">Đăng ký</h1>
          <div className="text-sm text-gray-600 mt-1">Tạo tài khoản mới</div>
        </div>

        <form
          className="px-6 py-5"
          onSubmit={(e) => {
            (async () => {
              e.preventDefault();
              setErrorMessage('');

              if (!username.trim()) {
                setErrorMessage('Vui lòng nhập username');
                return;
              }
              if (!password) {
                setErrorMessage('Vui lòng nhập mật khẩu');
                return;
              }
              if (password !== confirmPassword) {
                setErrorMessage('Mật khẩu nhập lại không khớp');
                return;
              }

              const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
              });

              if (!res.ok) {
                const contentType = res.headers.get('content-type') || '';
                let message = `HTTP ${res.status}`;
                try {
                  if (contentType.includes('application/json')) {
                    const json = (await res.json()) as { message?: string };
                    message = json?.message || message;
                  } else {
                    const text = await res.text();
                    message = text || message;
                  }
                } catch {
                  // ignore
                }
                setErrorMessage(message);
                return;
              }

              const json = (await res.json()) as { token?: string };
              if (!json?.token) {
                setErrorMessage('Đăng ký thất bại (không có token)');
                return;
              }

              setToken(json.token);
              navigate('/accounts', { replace: true });
            })();
          }}
        >
          {errorMessage ? (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
              placeholder="admin"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
              placeholder="••••••••"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="w-full h-11 rounded-lg bg-teal-600 text-white font-semibold cursor-pointer">
            Đăng ký
          </button>

          <div className="mt-4 text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-teal-700 font-medium hover:underline">
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
