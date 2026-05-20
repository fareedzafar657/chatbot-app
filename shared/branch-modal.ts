import { type ElementType } from 'react';
import { GitBranch, Scissors, Minimize2 } from 'lucide-react';

export type RightTab = 'tree' | 'versions' | 'compacts';
export type Operation = 'fork' | 'cherry-pick' | 'compact' | null;

export interface OperationButton {
  op: 'fork' | 'cherry-pick' | 'compact';
  icon: ElementType;
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
  {
    op: 'cherry-pick',
    icon: Scissors,
    label: 'Cherry Pick',
    desc: 'Append messages from any branch',
    colorClass: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  },
  {
    op: 'compact',
    icon: Minimize2,
    label: 'Compact',
    desc: 'Summarise messages to free tokens',
    colorClass: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
  },
];

export const RIGHT_TABS = [
  { id: 'tree'     as const, label: 'Branch Tree' },
  { id: 'versions' as const, label: 'Versions'    },
  { id: 'compacts' as const, label: 'Compacts'    },
];
