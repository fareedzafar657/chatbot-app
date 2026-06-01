'use client';

import { useState, useMemo, ReactNode } from 'react';
import { ArrowUpDown, GitBranch, Check } from 'lucide-react';
import { Branch } from '@/shared/types';
import { cn } from '@/lib/cn';
type SortKey = 'name' | 'created';
type SortDir = 'asc' | 'desc';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function sortBranches<T extends { label: string; createdAt: string }>(
  branches: T[],
  sortKey: SortKey,
  sortDir: SortDir
): T[] {
  return [...branches].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name')    cmp = a.label.localeCompare(b.label);
    if (sortKey === 'created') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

const Cell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <td className={cn('px-4 py-3', className)}>{children}</td>;

const HeaderCell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <th className={cn('px-4 py-2.5', className)}>{children}</th>;

const SortBtn = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
  >
    {label}
    <ArrowUpDown className={cn('w-3 h-3', active ? 'text-violet-500' : 'text-gray-300')} />
  </button>
);

interface Props {
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
}

export function BranchVersionsView({ branches, activeBranchId, onSwitchBranch }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const branchById = useMemo(
    () => Object.fromEntries(branches.map((b) => [b.branchId, b])),
    [branches]
  );

  const sorted = useMemo(
    () => sortBranches(branches, sortKey, sortDir),
    [branches, sortKey, sortDir]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[12px] font-semibold text-gray-700">
            {branches.length} version{branches.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[11px] text-gray-400">Click a row to switch branch</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {branches.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
            No branches yet
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
              <tr>
                <HeaderCell><SortBtn label="Branch"  active={sortKey === 'name'}     onClick={() => toggleSort('name')} /></HeaderCell>
                <HeaderCell className="hidden sm:table-cell">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Parent</span>
                </HeaderCell>
                <HeaderCell className="hidden lg:table-cell"><SortBtn label="Created" active={sortKey === 'created'}  onClick={() => toggleSort('created')} /></HeaderCell>
                <HeaderCell>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                </HeaderCell>
              </tr>
            </thead>
            <tbody>
              {sorted.map((branch) => {
                const isActive  = branch.branchId === activeBranchId;
                const parent    = branch.parentBranchId ? branchById[branch.parentBranchId] : null;
                const createdAt = new Date(branch.createdAt);

                return (
                  <tr
                    key={branch.branchId}
                    onClick={() => onSwitchBranch(branch.branchId)}
                    className={cn(
                      'border-b border-gray-50 last:border-0 transition-colors cursor-pointer',
                      isActive ? 'bg-violet-50' : 'bg-white hover:bg-gray-50'
                    )}
                  >
                    <Cell>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isActive ? 'bg-violet-500' : 'bg-gray-300')} />
                        <div>
                          <div className={cn('text-[13px] font-medium', isActive ? 'text-violet-700' : 'text-gray-800')}>
                            {branch.label}
                          </div>
                          {branch.description && (
                            <div className="text-[11px] text-gray-400 truncate max-w-[160px]">{branch.description}</div>
                          )}
                        </div>
                      </div>
                    </Cell>

                    <Cell className="hidden sm:table-cell">
                      <span className="text-[12px] text-gray-500">
                        {parent ? (
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-gray-400" />
                            {parent.label}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">root</span>
                        )}
                      </span>
                    </Cell>

                    <Cell className="hidden lg:table-cell">
                      <div className="text-[11px] text-gray-600">{formatDate(createdAt)}</div>
                      <div className="text-[10px] text-gray-400">{formatTime(createdAt)}</div>
                    </Cell>

                    <Cell>
                      {isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          Inactive
                        </span>
                      )}
                    </Cell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
