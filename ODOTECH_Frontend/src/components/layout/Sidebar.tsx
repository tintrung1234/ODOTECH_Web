import { NavLink } from 'react-router-dom';

import logo from '../../assets/img/logo.png';
import { sidebarItems } from '../../routes/appRoutes';
import { getTokenUser, normalizeRole } from '../../utils/auth';

export default function Sidebar() {
  const role = normalizeRole(getTokenUser()?.role);
  const visibleItems = sidebarItems.filter((item) => {
    if (item.to !== '/sales') return true;
    return !(role === 'dev' || role === 'dev_manager' || role === 'head_tech');
  });

  return (
    <aside className="w-52 bg-white h-screen sticky top-0 shadow-sm flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ODOTECH" className="w-full h-20 object-contain" />
        </div>
      </div>

      {/* Decorative line */}
      <div className="px-4 py-3">
        <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 to-teal-200 rounded-full"></div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-2 rounded-md mb-1 text-sm transition-colors ${isActive
                ? 'bg-gray-100 text-gray-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>

  );
}
