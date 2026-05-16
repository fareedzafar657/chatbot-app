'use client';

import { useSettingsTab } from '@/app/(app)/settingsTabContext';
import { SETTINGS_TABS } from '@/app/(app)/layout';
import { GeneralTab } from '@/app/components/settings/GeneralTab';
import { SecurityTab } from '@/app/components/settings/SecurityTab';
import { UsageTab } from '@/app/components/settings/UsageTab';
import { SpendingTab } from '@/app/components/settings/SpendingTab';
import { AppearanceTab } from '@/app/components/settings/AppearanceTab';
import { type SettingsTab } from '@/app/(app)/settingsTabContext';

// ── Tab content map ────────────────────────────────────────────────────────────

const TAB_COMPONENTS: Record<SettingsTab, () => JSX.Element> = {
  general:    GeneralTab,
  security:   SecurityTab,
  usage:      UsageTab,
  appearance: AppearanceTab,
  spending:   SpendingTab,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { activeTab } = useSettingsTab();

  const ActiveComponent = TAB_COMPONENTS[activeTab];
  const activeTabMeta   = SETTINGS_TABS.find((t) => t.id === activeTab) as (typeof SETTINGS_TABS)[number];
  const ActiveIcon      = activeTabMeta.icon;

  return (
    <div className="flex-1 h-full overflow-y-auto">
      <div className="max-w-[700px] mx-auto px-8 py-8">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <ActiveIcon className="w-4 h-4 text-violet-600" />
            </div>
            <h1 className="text-[20px] font-semibold text-gray-900">
              {activeTabMeta.label}
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 ml-11">{activeTabMeta.description}</p>
        </div>

        {/* Tab content */}
        <ActiveComponent />
      </div>
    </div>
  );
}
