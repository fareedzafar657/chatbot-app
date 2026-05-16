'use client';

import React, { useState } from 'react';
import { ArrowUpDown, GitBranch, Check } from 'lucide-react';
import { Branch } from '@/lib/types';
import { cn } from '@/lib/cn';

type SortKey = 'name' | 'created' | 'messages';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
}

type SortDir = 'asc' | 'desc';

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

export function BranchVersionsView({ branches, activeBranchId, onSwitchBranch }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const branchById = Object.fromEntries(branches.map((b) => [b.branchId, b]));

  const sorted = [...branches].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name')     cmp = a.label.localeCompare(b.label);
    if (sortKey === 'created')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortKey === 'messages') cmp = a.selectedMsgIds.length - b.selectedMsgIds.length;
    return sortDir === 'asc' ? cmp : -cmp;
  });

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
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
            <tr>
              <th className="px-4 py-2.5"><SortBtn label="Branch" active={sortKey === 'name'}     onClick={() => toggleSort('name')} /></th>
              <th className="px-4 py-2.5 hidden sm:table-cell">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Parent</span>
              </th>
              <th className="px-4 py-2.5 hidden md:table-cell"><SortBtn label="Msgs"    active={sortKey === 'messages'} onClick={() => toggleSort('messages')} /></th>
              <th className="px-4 py-2.5 hidden lg:table-cell"><SortBtn label="Created" active={sortKey === 'created'}  onClick={() => toggleSort('created')} /></th>
              <th className="px-4 py-2.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((branch) => {
              const isActive = branch.branchId === activeBranchId;
              const parent   = branch.parentBranchId ? branchById[branch.parentBranchId] : null;

              return (
                <tr
                  key={branch.branchId}
                  onClick={() => onSwitchBranch(branch.branchId)}
                  className={cn(
                    'border-b border-gray-50 last:border-0 transition-colors cursor-pointer',
                    isActive ? 'bg-violet-50' : 'bg-white hover:bg-gray-50'
                  )}
                >
                  <td className="px-4 py-3">
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
                  </td>

                  <td className="px-4 py-3 hidden sm:table-cell">
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
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-gray-700 font-medium">{branch.selectedMsgIds.length}</span>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-[11px] text-gray-600">{formatDate(new Date(branch.createdAt))}</div>
                    <div className="text-[10px] text-gray-400">{formatTime(new Date(branch.createdAt))}</div>
                  </td>

                  <td className="px-4 py-3">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
