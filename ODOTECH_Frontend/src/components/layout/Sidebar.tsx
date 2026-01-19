import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

import logo from '/logo-full.png';
import { sidebarItems } from '../../routes/appRoutes';
import { getTokenUser, normalizeRole } from '../../utils/auth';

export default function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean; setIsCollapsed: (value: boolean) => void }) {
  const [role, setRole] = useState<ReturnType<typeof normalizeRole>>('unknown');

  useEffect(() => {
    getTokenUser().then((user) => {
      setRole(normalizeRole(user?.role));
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleItems = sidebarItems.filter((item) => {
    // If role is customer, ONLY show customer portal and tickets
    if (role === 'customer') {
      return item.to === '/customer-portal' || item.to === '/tickets';
    }

    // For other roles, hide customer portal
    if (item.to === '/customer-portal') return false;

    // Sales page is used by Sales + Dev roles; keep it visible.
    // Hide websites and servers from sales roles
    if (item.to === '/websites' || item.to === '/servers') {
      return !(role === 'sale' || role === 'sales_manager' || role === 'head_sales');
    }
    return true;
  });

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[59] md:hidden transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside className={`${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64 md:w-52'} h-screen fixed md:sticky top-0 left-0 transition-all duration-300 ease-in-out z-[60] overflow-visible`}>
        {/* Toggle Button - Hidden on mobile, visible on desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex absolute ${isCollapsed ? 'left-15 top-4' : '-right-5 top-8'} z-50 w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full shadow-lg shadow-teal-500/40 hover:shadow-teal-500/60 hover:scale-110 active:scale-95 transition-all duration-300 items-center justify-center border border-white/20`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={18} className="stroke-[2.5]" />
        </button>

        {/* Scrollable Container */}
        <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-slate-50 to-white shadow-lg border-r border-gray-200 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700 transition-colors duration-300">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0 transition-colors duration-300">
            <div className="flex items-center justify-center gap-2">
              <img
                src={logo}
                alt="ODOTECH"
                className={`${isCollapsed ? 'h-10' : 'w-full h-20'} object-contain transition-all duration-300`}
              />
            </div>
          </div>

          {/* Decorative line */}
          <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 transition-all duration-300 shrink-0`}>
            <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-blue-400 rounded-full shadow-sm"></div>
          </div>

          {/* Menu Items */}
          <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-2 transition-all duration-300`}>
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}
                className={({ isActive }) =>
                  `w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl mb-2 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30 scale-[1.02]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400 hover:shadow-sm'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <span className={isCollapsed ? '' : 'shrink-0'}>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Footer decoration */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gradient-to-t from-slate-100 to-transparent dark:from-slate-900 shrink-0 transition-colors duration-300">
            <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} transition-all duration-300`}>
              {!isCollapsed && <p className="text-xs text-gray-400 font-medium mx-auto">ODOTECH © 2026</p>}

              {isCollapsed && <p className="text-xs text-gray-400 font-medium mt-1">©</p>}
            </div>
          </div>
        </div>
      </aside >
    </>
  );
}

