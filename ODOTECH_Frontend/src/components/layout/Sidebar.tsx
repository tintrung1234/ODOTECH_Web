import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

import logo from '/logo-full.png';
import { sidebarItems } from '../../routes/appRoutes';
import { getTokenUser, normalizeRole } from '../../utils/auth';

export default function Sidebar() {
  const [role, setRole] = useState<ReturnType<typeof normalizeRole>>('unknown');

  useEffect(() => {
    getTokenUser().then((user) => {
      setRole(normalizeRole(user?.role));
    });
  }, []);
  const visibleItems = sidebarItems.filter((item) => {
    // If role is customer, ONLY show customer portal
    if (role === 'customer') {
      return item.to === '/customer-portal';
    }

    // For other roles, hide customer portal
    if (item.to === '/customer-portal') return false;

    // Sales page is used by Sales + Dev roles; keep it visible.
    // Hide websites from sales roles
    if (item.to === '/websites') {
      return !(role === 'sale' || role === 'sales_manager' || role === 'head_sales');
    }
    return true;
  });

  return (
    <aside className="w-52 bg-gradient-to-b from-slate-50 to-white h-screen sticky top-0 shadow-lg border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ODOTECH" className="w-full h-20 object-contain" />
        </div>
      </div>

      {/* Decorative line */}
      <div className="px-4 py-4">
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-blue-400 rounded-full shadow-sm"></div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30 scale-[1.02]'
                : 'text-gray-700 hover:bg-gray-100 hover:text-teal-600 hover:shadow-sm'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer decoration */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-t from-slate-100 to-transparent">
        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium">ODOTECH © 2026</p>
        </div>
      </div>
    </aside>

  );
}

