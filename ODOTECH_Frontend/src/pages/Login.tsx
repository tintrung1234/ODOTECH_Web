import { useEffect, useMemo, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { clearUserCache, getTokenUser } from '../utils/auth';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    useEffect(() => {
        // If already logged in, don't stay on /login.
        (async () => {
            const user = await getTokenUser();
            if (user) navigate('/accounts', { replace: true });
        })();
    }, [navigate]);

    const redirectTo = useMemo(() => {
        const state = location.state as { from?: string } | null;
        const from = state?.from;
        if (!from || from === '/login' || from === '/register') return '/accounts';
        return from;
    }, [location.state]);
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h1 className="text-2xl font-extrabold text-gray-900">Đăng nhập</h1>
                    <div className="text-sm text-gray-600 mt-1">ODOTECH Dashboard</div>
                </div>

                <form
                    className="px-6 py-5"
                    onSubmit={(e) => {
                        (async () => {
                            e.preventDefault();
                            setErrorMessage('');

                            if (isLoading) return;

                            if (!username.trim()) {
                                setErrorMessage('Vui lòng nhập username');
                                return;
                            }
                            if (!password) {
                                setErrorMessage('Vui lòng nhập mật khẩu');
                                return;
                            }

                            setIsLoading(true);
                            try {
                                const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ username: username.trim(), password }),
                                    credentials: 'include', // Important: send/receive cookies
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
                                    setErrorMessage('Đăng nhập thất bại (không có token)');
                                    return;
                                }

                                // Token is now in httpOnly cookie, no need to store it
                                // IMPORTANT: clear cached /api/auth/me result (it may be cached as null from initial check)
                                clearUserCache();
                                // Just navigate to the redirect page
                                navigate(redirectTo, { replace: true });
                            } finally {
                                setIsLoading(false);
                            }
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
                            disabled={isLoading}
                            className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                            placeholder="admin"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 rounded-lg bg-teal-600 text-white font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="inline-flex items-center justify-center gap-2">
                                <span
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                    aria-hidden="true"
                                />
                                Đang đăng nhập...
                            </span>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>

                    <div className="text-xs text-gray-500 mt-4">
                        Đăng nhập sử dụng JWT qua API backend.
                    </div>
                </form>
            </div>
        </div>
    );
}
