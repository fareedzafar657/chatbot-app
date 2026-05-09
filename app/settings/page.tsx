'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Settings, Shield, BarChart2, Palette, CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { GeneralTab } from '@/app/components/settings/GeneralTab';
import { SecurityTab } from '@/app/components/settings/SecurityTab';
import { UsageTab } from '@/app/components/settings/UsageTab';
import { SpendingTab } from '@/app/components/settings/SpendingTab';
import { AppearanceTab } from '@/app/components/settings/AppearanceTab';
import { KaiLogo } from '@/app/components/KaiLogo';

type Tab = 'general' | 'security' | 'usage' | 'appearance' | 'spending';

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'general', label: 'General', icon: Settings, description: 'Profile & preferences' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password & sessions' },
  { id: 'usage', label: 'Usage', icon: BarChart2, description: 'Analytics & limits' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Colors & theme' },
  { id: 'spending', label: 'Spending', icon: CreditCard, description: 'Billing & plan' },
];

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  const ActiveComponent = {
    general: GeneralTab,
    security: SecurityTab,
    usage: UsageTab,
    appearance: AppearanceTab,
    spending: SpendingTab,
  }[activeTab];

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;
  const ActiveIcon = activeTabMeta.icon;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Left sidebar */}
      <div className="w-[240px] flex-shrink-0 h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100">
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
          <KaiLogo size={28} />
          <span className="text-[15px] font-semibold text-gray-900">K-AI</span>
        </div>

        {/* Back button */}
        <div className="px-3 mb-5">
          <button
            onClick={() => router.push('/')}
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

        {/* Tabs */}
        <nav className="flex-1 px-2 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white border border-gray-200 shadow-sm text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? 'bg-violet-50' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? 'text-violet-600' : 'text-gray-500'}`}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[13px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}
                  >
                    {tab.label}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-white">{user.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-800 truncate">{user.name}</div>
              <div className="text-[11px] text-gray-400 truncate">{user.plan} Plan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-8 py-8">
          {/* Page header */}
          <div className="mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                <ActiveIcon className="w-4 h-4 text-violet-600" />
              </div>
              <h1 className="text-gray-900" style={{ fontSize: '20px', fontWeight: 600 }}>
                {activeTabMeta.label}
              </h1>
            </div>
            <p className="text-[14px] text-gray-500 ml-11">{activeTabMeta.description}</p>
          </div>

          {/* Tab content */}
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
