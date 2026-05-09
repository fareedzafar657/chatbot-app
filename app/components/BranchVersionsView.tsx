'use client';

import React, { useState } from 'react';
import { ArrowUpDown, GitBranch, Check } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  version: number;
  parentBranchId?: string;
  forkPointMessageId?: string;
  messageIds: string[];
  description?: string;
  createdAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  branches: Branch[];
  messages: Message[];
  activeBranchId: string;
  onSwitchBranch?: (id: string) => void;
}

type SortKey = 'version' | 'name' | 'created' | 'messages';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function BranchVersionsView({ branches, messages, activeBranchId, onSwitchBranch }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('version');
  const [sortAsc, setSortAsc] = useState(true);

  const msgById = Object.fromEntries(messages.map(m => [m.id, m]));
  const branchById = Object.fromEntries(branches.map(b => [b.id, b]));

  const sorted = [...branches].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'version') cmp = a.version - b.version;
    else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'created') cmp = a.createdAt.getTime() - b.createdAt.getTime();
    else if (sortKey === 'messages') cmp = a.messageIds.length - b.messageIds.length;
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? 'text-violet-500' : 'text-gray-300'}`} />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[12px] font-semibold text-gray-700">
            {branches.length} version{branches.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[11px] text-gray-400">Click a row to switch branch</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
            <tr>
              <th className="px-4 py-2.5"><SortBtn k="version" label="Ver" /></th>
              <th className="px-4 py-2.5"><SortBtn k="name" label="Branch" /></th>
              <th className="px-4 py-2.5 hidden sm:table-cell">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Parent</span>
              </th>
              <th className="px-4 py-2.5 hidden md:table-cell"><SortBtn k="messages" label="Msgs" /></th>
              <th className="px-4 py-2.5 hidden lg:table-cell"><SortBtn k="created" label="Created" /></th>
              <th className="px-4 py-2.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Fork Point</span>
              </th>
              <th className="px-4 py-2.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((branch) => {
              const isActive = branch.id === activeBranchId;
              const parent = branch.parentBranchId ? branchById[branch.parentBranchId] : null;
              const forkMsg = branch.forkPointMessageId ? msgById[branch.forkPointMessageId] : null;

              return (
                <tr
                  key={branch.id}
                  onClick={() => onSwitchBranch?.(branch.id)}
                  className={`border-b border-gray-50 last:border-0 transition-colors cursor-pointer ${
                    isActive ? 'bg-violet-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Version */}
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[12px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      v{branch.version}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-violet-500' : 'bg-gray-300'}`} />
                      <div>
                        <div className={`text-[13px] font-medium ${isActive ? 'text-violet-700' : 'text-gray-800'}`}>
                          {branch.name}
                        </div>
                        {branch.description && (
                          <div className="text-[11px] text-gray-400 truncate max-w-[160px]">{branch.description}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Parent */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[12px] text-gray-500">
                      {parent ? (
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-gray-400" />
                          {parent.name}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">root</span>
                      )}
                    </span>
                  </td>

                  {/* Messages */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-gray-700 font-medium">{branch.messageIds.length}</span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-[11px] text-gray-600">{formatDate(branch.createdAt)}</div>
                    <div className="text-[10px] text-gray-400">{formatTime(branch.createdAt)}</div>
                  </td>

                  {/* Fork point */}
                  <td className="px-4 py-3">
                    {forkMsg ? (
                      <div className="max-w-[120px]">
                        <div className={`text-[10px] font-semibold mb-0.5 ${forkMsg.role === 'user' ? 'text-gray-500' : 'text-violet-500'}`}>
                          {forkMsg.role === 'user' ? 'You' : 'K-AI'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {forkMsg.content.slice(0, 32)}…
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">—</span>
                    )}
                  </td>

                  {/* Status */}
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
