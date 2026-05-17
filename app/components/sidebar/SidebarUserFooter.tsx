'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

export function SidebarUserFooter() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user)!;
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="border-t border-gray-100 px-3 pt-2 pb-3">
      {/* User profile */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg group">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-white">{user.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-gray-800 truncate">{user.name}</div>
          <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
