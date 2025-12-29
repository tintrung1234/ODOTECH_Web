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
    <aside className="w-64 bg-white h-screen sticky top-0 shadow-sm flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ODOTECH" className="w-full object-contain" />
        </div>
      </div>

      {/* Decorative line */}
      <div className="px-6 py-4">
        <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-teal-200 rounded-full"></div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors text-left ${
                isActive ? 'bg-gray-100 text-gray-800 font-medium' : 'text-gray-600 hover:bg-gray-50'
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
