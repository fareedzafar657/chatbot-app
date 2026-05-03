'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Sparkles, LogOut, MessageSquare, Settings } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';
import { Session } from '@/lib/types';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) return `${days}d ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SessionItem({ session, isActive, onSelect, onDelete }: SessionItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 group transition-all duration-100 ${
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <MessageSquare
        className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 transition-colors ${
          isActive ? 'text-gray-700' : 'text-gray-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <span
            className={`text-[13px] font-medium truncate leading-snug ${
              isActive ? 'text-gray-900' : 'text-gray-700'
            }`}
          >
            {session.title ?? 'New Conversation'}
          </span>
          {hovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex-shrink-0 p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors -mt-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-gray-400">
            {formatRelativeTime(session.updatedAt)}
          </span>
          {(session.branchCount ?? 0) > 1 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[11px] text-violet-400">
                {session.branchCount} branches
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export function Sidebar() {
  const router = useRouter();
  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const setActiveSession = useChatStore((state) => state.setActiveSession);
  const newSession = useChatStore((state) => state.newSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const initSessions = useChatStore((state) => state.initSessions);
  const isLoadingSessions = useChatStore((state) => state.isLoadingSessions);
  const hasMoreSessions = useChatStore((state) => state.hasMoreSessions);
  const loadMoreSessions = useChatStore((state) => state.loadMoreSessions);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isAuthLoading && user) {
      initSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Group sessions by time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);

  const todaySessions = sessions.filter((s) => new Date(s.updatedAt) >= today);
  const yesterdaySessions = sessions.filter(
    (s) => new Date(s.updatedAt) >= yesterday && new Date(s.updatedAt) < today
  );
  const olderSessions = sessions.filter((s) => new Date(s.updatedAt) < yesterday);

  const renderGroup = (label: string, items: Session[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-4">
        <div className="px-3 mb-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="space-y-0.5">
          {items.map((s) => (
            <SessionItem
              key={s.sessionId}
              session={s}
              isActive={s.sessionId === activeSessionId}
              onSelect={() => setActiveSession(s.sessionId)}
              onDelete={() => deleteSession(s.sessionId)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[260px] flex-shrink-0 h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-gray-900">Chatbot App</span>
      </div>

      {/* New Chat button */}
      <div className="px-3 mb-4">
        <button
          onClick={newSession}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-gray-500" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-1">
        {isLoadingSessions && sessions.length === 0 ? (
          <div className="px-4 py-6 flex items-center justify-center gap-2 text-[13px] text-gray-400">
            <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-6 text-center text-[13px] text-gray-400">
            No conversations yet
          </div>
        ) : (
          <>
            {renderGroup('Today', todaySessions)}
            {renderGroup('Yesterday', yesterdaySessions)}
            {renderGroup('Older', olderSessions)}
            {hasMoreSessions && (
              <div className="px-3 pb-4">
                <button
                  onClick={loadMoreSessions}
                  className="w-full py-2 text-[12px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Settings + User profile */}
      <div className="border-t border-gray-100 px-3 pt-2 pb-3 space-y-1">
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" />
          Settings
        </button>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-white">{user?.initials ?? 'JD'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-gray-800 truncate">
              {user?.name ?? 'John Doe'}
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {user?.email ?? 'john@example.com'}
            </div>
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
    </div>
  );
}
