'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type SettingsTab = 'general' | 'security' | 'usage' | 'appearance' | 'spending';

interface SettingsTabCtx {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsTabContext = createContext<SettingsTabCtx>({
  activeTab: 'general',
  setActiveTab: () => {},
});

export function useSettingsTab() {
  return useContext(SettingsTabContext);
}

export function SettingsTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  return (
    <SettingsTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SettingsTabContext.Provider>
  );
}
