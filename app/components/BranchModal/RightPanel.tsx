'use client';

import { GitBranch, List } from 'lucide-react';
import { Branch } from '@/lib/types';
import { BranchTree } from '../BranchTree';
import { BranchVersionsView } from '../BranchVersionsView';
import { RightTab, RIGHT_TABS } from './types';
import { cn } from '@/lib/cn';

const TAB_ICONS: Record<RightTab, React.ElementType> = {
  tree:     GitBranch,
  versions: List,
};

interface RightPanelProps {
  activeTab: RightTab;
  branches: Branch[];
  activeBranchId: string;
  onTabChange: (tab: RightTab) => void;
  onSwitchBranch: (id: string) => void;
}

export function RightPanel({
  activeTab,
  branches,
  activeBranchId,
  onTabChange,
  onSwitchBranch,
}: RightPanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        {RIGHT_TABS.map(({ id, label }) => {
          const Icon = TAB_ICONS[id];
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                activeTab === id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-3 overflow-hidden">
        {activeTab === 'tree' ? (
          <BranchTree
            branches={branches}
            activeBranchId={activeBranchId}
            onSwitchBranch={onSwitchBranch}
          />
        ) : (
          <BranchVersionsView
            branches={branches}
            activeBranchId={activeBranchId}
            onSwitchBranch={onSwitchBranch}
          />
        )}
      </div>
    </div>
  );
}
