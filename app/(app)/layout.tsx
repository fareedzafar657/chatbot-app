'use client';

import { useEffect, type ElementType } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft, Settings, Plus, BarChart2, CreditCard, Palette, Shield,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/lib/authStore';
import { useChatStore } from '@/lib/store';
import { SidebarShell } from '@/app/components/SidebarShell';
import { PageLoader } from '@/app/components/common/PageLoader';
import { Spinner } from '@/app/components/common/Spinner';
import { SessionItem } from '@/app/components/SessionItem';
import { type Session } from '@/lib/types';
import {
  SettingsTabProvider, useSettingsTab, type SettingsTab,
} from './settings-tab-context';

// ── Settings tab config ────────────────────────────────────────────────────────

export const SETTINGS_TABS: { id: SettingsTab; label: string; icon: ElementType; description: string }[] = [
  { id: 'general',    label: 'General',    icon: Settings,   description: 'Profile & preferences' },
  { id: 'security',   label: 'Security',   icon: Shield,     description: 'Password & sessions'   },
  { id: 'usage',      label: 'Usage',      icon: BarChart2,  description: 'Analytics & limits'    },
  { id: 'appearance', label: 'Appearance', icon: Palette,    description: 'Colors & theme'        },
  { id: 'spending',   label: 'Spending',   icon: CreditCard, description: 'Billing & plan'        },
];

// ── Session group ──────────────────────────────────────────────────────────────

interface SessionGroupProps {
  label: string;
  items: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function SessionGroup({ label, items, activeSessionId, onSelect, onDelete, onRename }: SessionGroupProps) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="px-3 mb-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-0.5">
        {items.map((s) => (
          <SessionItem
            key={s.sessionId}
            session={s}
            isActive={s.sessionId === activeSessionId}
            onSelect={() => onSelect(s.sessionId)}
            onDelete={() => onDelete(s.sessionId)}
            onRename={(title) => onRename(s.sessionId, title)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Chat sidebar middle ────────────────────────────────────────────────────────

function ChatSidebarMiddle() {
  const router = useRouter();
  const sessions          = useChatStore((s) => s.sessions);
  const activeSessionId   = useChatStore((s) => s.activeSessionId);
  const newSession        = useChatStore((s) => s.newSession);
  const deleteSession     = useChatStore((s) => s.deleteSession);
  const renameSession     = useChatStore((s) => s.renameSession);
  const isLoadingSessions = useChatStore((s) => s.isLoadingSessions);
  const hasMoreSessions   = useChatStore((s) => s.hasMoreSessions);
  const loadMoreSessions  = useChatStore((s) => s.loadMoreSessions);

  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dated     = sessions.map((s) => ({ s, t: new Date(s.updatedAt).getTime() }));

  const todaySessions     = dated.filter(({ t }) => t >= today.getTime()).map(({ s }) => s);
  const yesterdaySessions = dated.filter(({ t }) => t >= yesterday.getTime() && t < today.getTime()).map(({ s }) => s);
  const olderSessions     = dated.filter(({ t }) => t < yesterday.getTime()).map(({ s }) => s);

  const handleSelect = (id: string) => { router.push(`/chat/${id}`); };

  const handleDelete = (id: string) => {
    if (id === activeSessionId) router.push('/new');
    deleteSession(id);
  };

  return (
    <>
      {/* New Chat button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => { newSession(); router.push('/new'); }}
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
            <Spinner className="h-3.5 w-3.5" />
            Loading…
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-6 text-center text-[13px] text-gray-400">
            No conversations yet
          </div>
        ) : (
          <>
            <SessionGroup label="Today"     items={todaySessions}     activeSessionId={activeSessionId} onSelect={handleSelect} onDelete={handleDelete} onRename={renameSession} />
            <SessionGroup label="Yesterday" items={yesterdaySessions} activeSessionId={activeSessionId} onSelect={handleSelect} onDelete={handleDelete} onRename={renameSession} />
            <SessionGroup label="Older"     items={olderSessions}     activeSessionId={activeSessionId} onSelect={handleSelect} onDelete={handleDelete} onRename={renameSession} />
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

      {/* Settings link */}
      <div className="border-t border-gray-100 px-3 pt-2 pb-1">
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" />
          Settings
        </button>
      </div>
    </>
  );
}

// ── Settings sidebar middle ────────────────────────────────────────────────────

function SettingsSidebarMiddle() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useSettingsTab();

  return (
    <>
      {/* Back button */}
      <div className="px-3 mb-5">
        <button
          onClick={() => router.push('/new')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Chat
        </button>
      </div>

      {/* Section label */}
      <div className="px-4 mb-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Settings</span>
      </div>

      {/* Tab nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive
                  ? 'bg-white border border-gray-200 shadow-sm text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                isActive ? 'bg-violet-50' : 'bg-transparent'
              )}>
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-violet-600' : 'text-gray-500')} />
              </div>
              <div className="min-w-0">
                <div className={cn('text-[13px] font-medium', isActive ? 'text-gray-900' : 'text-gray-700')}>
                  {tab.label}
                </div>
                <div className="text-[11px] text-gray-400 truncate">{tab.description}</div>
              </div>
            </button>
          );
        })}
      </nav>
    </>
  );
}

// ── Inner layout — needs SettingsTabContext ────────────────────────────────────

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const user      = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initSessions = useChatStore((s) => s.initSessions);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  // Bootstrap sessions once after auth resolves
  useEffect(() => {
    if (!isLoading && user) initSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user]);

  if (isLoading) return <PageLoader />;
  if (!user) return null;

  const isSettings = pathname.startsWith('/settings');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <SidebarShell>
        {isSettings ? <SettingsSidebarMiddle /> : <ChatSidebarMiddle />}
      </SidebarShell>

      {/* Main content */}
      {children}
    </div>
  );
}

// ── App layout ─────────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsTabProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SettingsTabProvider>
  );
}
