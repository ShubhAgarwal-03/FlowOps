import { Outlet } from 'react-router-dom';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { Sidebar } from './sideBar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search customers, products, challans..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Bell className="w-5 h-5" />
            <HelpCircle className="w-5 h-5" />
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}