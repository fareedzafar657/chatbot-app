import React from 'react';
import { GitBranch, Scissors } from 'lucide-react';

export type RightTab = 'tree' | 'versions';
export type Operation = 'fork' | null;

export interface OperationButton {
  op: 'fork';
  icon: React.ElementType;
  label: string;
  desc: string;
  colorClass: string;
  disabled?: boolean;
}

export const OP_BUTTONS: OperationButton[] = [
  {
    op: 'fork',
    icon: GitBranch,
    label: 'Fork',
    desc: 'New branch from selected',
    colorClass: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100',
  },
  // Cherry Pick — not yet implemented.
  // Idea: open a sub-view inside the modal showing all branches and their messages.
  // User selects individual messages from any branch (not just the active one) and
  // appends them to the current active branch — similar to `git cherry-pick`, where
  // you pick specific commits from any branch into your current one.
  // Needs: backend API, a branch/message browser UI, and conflict handling.
  {
    op: 'fork', // placeholder op — button is disabled, click is blocked
    icon: Scissors,
    label: 'Cherry Pick',
    desc: 'Coming soon',
    colorClass: 'bg-gray-50 border-gray-200 text-gray-400',
    disabled: true,
  },
];

export const RIGHT_TABS = [
  { id: 'tree' as const,     label: 'Branch Tree' },
  { id: 'versions' as const, label: 'Versions'    },
];
