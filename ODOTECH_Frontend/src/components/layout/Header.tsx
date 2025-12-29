import { formatDate } from '../../utils/formatDate';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../../utils/auth';

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  const navigate = useNavigate();
  const formattedDate = formatDate(new Date());

  return (
    <header className="px-6 pt-5">
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-teal-700 text-white rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="text-3xl font-extrabold tracking-tight">Xin chào {userName}!</div>
          <div className="flex items-center gap-3">
            <div className="text-white/90 font-medium">{formattedDate}</div>
            <button
              type="button"
              className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium cursor-pointer"
              onClick={() => {
                clearToken();
                navigate('/login', { replace: true });
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tạm thời ẩn nút thông báo */}
        {/* <button
          type="button"
          className="relative shrink-0 bg-white border border-gray-200 rounded-lg w-12 h-12 grid place-items-center text-gray-700 hover:bg-gray-50"
          aria-label="Thông báo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            5
          </span>
        </button> */}
      </div>
    </header>
  );
}
