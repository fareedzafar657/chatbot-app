'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ArrowLeft, Search } from 'lucide-react';
import { Message, Branch } from '@/shared/types';
import { Spinner } from '../../common/Spinner';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { truncate } from './modal.utils';
import { MessagePreviewRow, SelectedPreviewCard } from './MessagePreviewRow';

interface CherryPickTabProps {
  branches: Branch[];
  activeBranchId: string;
  selectedIds: string[];
  isCherryPicking: boolean;
  onToggle: (msgId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function CherryPickTab({
  branches,
  activeBranchId,
  selectedIds,
  isCherryPicking,
  onToggle,
  onConfirm,
  onBack,
}: CherryPickTabProps) {
  const [branchMessages, setBranchMessages] = useState<Record<string, Message[]>>({});
  const [branchCursors, setBranchCursors] = useState<Record<string, string | null>>({});
  const [branchHasMore, setBranchHasMore] = useState<Record<string, boolean>>({});
  const [loadingInitial, setLoadingInitial] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState<Set<string>>(new Set());
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const otherBranches = branches.filter((b) => b.branchId !== activeBranchId);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBranchPage = async (branchId: string, cursor?: string) => {
    const isLoadingMore = cursor !== undefined;
    setLoadingInitial((prev) => {
      if (isLoadingMore) return prev;
      const next = new Set(prev);
      next.add(branchId);
      return next;
    });
    setLoadingMore((prev) => {
      if (!isLoadingMore) return prev;
      const next = new Set(prev);
      next.add(branchId);
      return next;
    });

    try {
      const result = await api.listMessages(branchId, cursor, 5);
      setBranchMessages((prev) => ({
        ...prev,
        [branchId]: cursor ? [...(prev[branchId] ?? []), ...result.items] : result.items,
      }));
      setBranchCursors((prev) => ({ ...prev, [branchId]: result.nextCursor ?? null }));
      setBranchHasMore((prev) => ({ ...prev, [branchId]: result.hasMore }));
    } catch {
      // Silently fail, keep UI responsive
    }

    if (isLoadingMore) {
      setLoadingMore((prev) => {
        const next = new Set(prev);
        next.delete(branchId);
        return next;
      });
    } else {
      setLoadingInitial((prev) => {
        const next = new Set(prev);
        next.delete(branchId);
        return next;
      });
    }
  };

  const toggleBranch = (branchId: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      const isExpanding = !prev.has(branchId);
      if (isExpanding) {
        next.add(branchId);
        if (!branchMessages[branchId]) {
          fetchBranchPage(branchId);
        }
      } else {
        next.delete(branchId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Cherry Pick Messages</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">{selectedIds.length} selected</p>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left: Branch selector */}
        <div className="w-[380px] flex-shrink-0 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages…"
                className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-300 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {otherBranches.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px] text-gray-400">
                No other branches
              </div>
            ) : (
              <div className="space-y-0">
                {otherBranches.map((branch) => {
                  const isExpanded = expandedBranches.has(branch.branchId);
                  const messages = branchMessages[branch.branchId] ?? [];
                  const totalCount = messages.length;
                  const hasMore = branchHasMore[branch.branchId] ?? false;
                  const isLoadingInit = loadingInitial.has(branch.branchId);
                  const isLoadingMore = loadingMore.has(branch.branchId);

                  const filteredMessages = debouncedQuery
                    ? messages.filter((m) => m.content?.toLowerCase().includes(debouncedQuery.toLowerCase()))
                    : messages;

                  return (
                    <div key={branch.branchId} className="border-b border-gray-100 last:border-b-0">
                      {/* Branch header */}
                      <button
                        onClick={() => toggleBranch(branch.branchId)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <ChevronDown
                          className={cn('w-4 h-4 text-gray-400 transition-transform', !isExpanded && '-rotate-90')}
                        />
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[12px] font-semibold text-gray-700 truncate">{branch.label}</div>
                          <div className="text-[10px] text-gray-400">
                            {hasMore ? `${messages.length} / ${totalCount} messages` : `${totalCount} message${totalCount !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </button>

                      {/* Messages (collapsed by default) */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {isLoadingInit ? (
                            <div className="flex justify-center py-2">
                              <Spinner className="w-4 h-4" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-3 text-[11px] text-gray-400">No messages</div>
                          ) : filteredMessages.length === 0 ? (
                            <div className="text-center py-3 text-[11px] text-gray-400">No matches in loaded messages</div>
                          ) : (
                            <div className="space-y-1 p-2">
                              {filteredMessages.map((msg) => {
                                const isSelected = selectedIds.includes(msg.msgId);
                                const selectionIndex = selectedIds.indexOf(msg.msgId) + 1;

                                // Non-interactive rows for compacted/summary messages from other branches
                                if (msg.state === 'compacted') {
                                  return (
                                    <div key={msg.msgId} className="flex items-start gap-2 p-2 rounded bg-gray-50 opacity-50">
                                      <div className="flex-shrink-0 w-5 h-5 rounded border border-gray-200 bg-gray-100" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <span className="text-[10px] font-semibold text-gray-500">{msg.role === 'user' ? 'You' : 'K-AI'}</span>
                                          <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">compacted · {msg.compactedBy?.name}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 line-clamp-1">{truncate(msg.content, 50)}</div>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={msg.msgId}
                                    onClick={() => onToggle(msg.msgId)}
                                    className={cn(
                                      'w-full text-left flex items-start gap-2 p-2 rounded transition-colors',
                                      isSelected ? 'bg-amber-100 hover:bg-amber-200' : 'bg-white hover:bg-gray-100'
                                    )}
                                  >
                                    {/* Selection-order badge */}
                                    <div
                                      className={cn(
                                        'flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center text-[9px] font-bold transition-colors',
                                        isSelected
                                          ? 'bg-amber-600 border-amber-600 text-white'
                                          : 'bg-white border-gray-300'
                                      )}
                                    >
                                      {isSelected ? selectionIndex : ''}
                                    </div>

                                    <MessagePreviewRow
                                      message={msg}
                                      avatarSize={16}
                                      truncateAt={60}
                                      clampClass="line-clamp-2"
                                      labelClass="text-[10px]"
                                      contentClass="text-[11px]"
                                    />
                                  </button>
                                );
                              })}
                              {hasMore && !debouncedQuery && (
                                <button
                                  onClick={() => fetchBranchPage(branch.branchId, branchCursors[branch.branchId] ?? undefined)}
                                  disabled={isLoadingMore}
                                  className="w-full py-2 text-center text-[11px] text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  {isLoadingMore && <Spinner className="w-3 h-3" />}
                                  {isLoadingMore ? 'Loading...' : 'See More'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected messages preview */}
        <div className="flex-1 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="text-[12px] font-semibold text-gray-700">Selected Messages</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{selectedIds.length} to append</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedIds.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px] text-gray-400">
                Select messages to append
              </div>
            ) : (
              <div className="space-y-2">
                {selectedIds.map((msgId, index) => {
                  const allMessages = Object.values(branchMessages).flat();
                  const msg = allMessages.find((m) => m.msgId === msgId);

                  if (!msg) return null;

                  return (
                    <SelectedPreviewCard
                      key={msgId}
                      message={msg}
                      index={index}
                      accent="amber"
                      truncateAt={80}
                      clampClass="line-clamp-3"
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-[12px] font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={selectedIds.length === 0 || isCherryPicking}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-[12px] transition-all',
                selectedIds.length === 0 || isCherryPicking
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              )}
            >
              {isCherryPicking && <Spinner className="w-3 h-3" />}
              {isCherryPicking ? 'Appending...' : 'Confirm Cherry Pick'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
