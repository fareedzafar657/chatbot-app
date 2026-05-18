import { type ElementType } from 'react';
import { GitBranch, Scissors } from 'lucide-react';

export type RightTab = 'tree' | 'versions';
export type Operation = 'fork' | 'cherry-pick' | null;

export interface OperationButton {
  op: 'fork' | 'cherry-pick';
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
];

export const RIGHT_TABS = [
  { id: 'tree' as const,     label: 'Branch Tree' },
  { id: 'versions' as const, label: 'Versions'    },
];
