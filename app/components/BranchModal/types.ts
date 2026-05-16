import { type ElementType } from 'react';
import { GitBranch, Scissors } from 'lucide-react';

export type RightTab = 'tree' | 'versions';
export type Operation = 'fork' | null;

export interface OperationButton {
  op: 'fork';
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
    op: 'fork',
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
