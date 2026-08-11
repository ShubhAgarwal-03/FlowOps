import { NavLink } from 'react-router-dom';
import { LayoutGrid, Users, Package, FileText, Settings, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { initials } from '../../lib/format';

const NAV_BY_ROLE: Record<string, { label: string; to: string; icon: any }[]> = {
  ADMIN: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
    { label: 'CRM', to: '/customers', icon: Users },
    { label: 'Inventory', to: '/products', icon: Package },
    { label: 'Sales', to: '/challans', icon: FileText },
  ],
  SALES: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
    { label: 'CRM', to: '/customers', icon: Users },
    { label: 'Sales', to: '/challans', icon: FileText },
  ],
  WAREHOUSE: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
    { label: 'Inventory', to: '/products', icon: Package },
  ],
  ACCOUNTS: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
    { label: 'CRM', to: '/customers', icon: Users },
    { label: 'Sales', to: '/challans', icon: FileText },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const items = user ? NAV_BY_ROLE[user.role] ?? [] : [];

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold">
          M
        </div>
        <div>
          <div className="font-semibold text-slate-800 text-sm leading-tight">Mini ERP</div>
          <div className="text-xs text-slate-400 leading-tight">Operations Portal</div>
        </div>
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
        <div className="px-3 pt-3">
          <NavLink
            to="/challans/new"
            className="flex items-center justify-center gap-1 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md py-2"
          >
            + New Challan
          </NavLink>
        </div>
      )}

      <nav className="flex-1 px-2 pt-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-2 space-y-1 text-sm text-slate-500">
        <button className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-50 rounded-md">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-50 rounded-md">
          <LifeBuoy className="w-4 h-4" /> Support
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
          {user ? initials(user.name) : ''}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-700 truncate">{user?.name}</div>
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
        </div>
        <button onClick={logout} className="text-xs text-red-500 hover:text-red-600">
          Log out
        </button>
      </div>
    </aside>
  );
}