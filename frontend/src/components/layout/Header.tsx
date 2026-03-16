'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { LogOut, Bell, Search } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search trips, bookings, expenses..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/notifications')}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="w-px h-8 bg-gray-200" />

        <button
          onClick={() => router.push('/dashboard/profile')}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
