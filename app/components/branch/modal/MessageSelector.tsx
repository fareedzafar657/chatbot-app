'use client';

import { useEffect, useState } from 'react';
import { Sparkles, User, Check, Search } from 'lucide-react';
import { Message } from '@/shared/types';
import { KaiLogo } from '../../common/KaiLogo';
import { cn } from '@/lib/cn';

function truncate(str: string | null, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

interface MessageSelectorProps {
  messages: Message[];
  selectedIds: Set<string>;
  firstSelectedRole: 'user' | 'assistant' | null;
  firstSelectedType?: string | null;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onBulkSet?: (toAdd: string[], toRemove: string[]) => void;
}

export function MessageSelector({
  messages,
  selectedIds,
  firstSelectedRole,
  firstSelectedType,
  onToggle,
  onSelectAll,
  onSelectNone,
  onBulkSet,
}: MessageSelectorProps) {
  const selectedCount = selectedIds.size;
  // Compaction summaries are valid as the first context message — only warn for plain assistant messages
  const hasInvalidFirst = selectedCount > 0 && firstSelectedRole === 'assistant' && firstSelectedType !== 'compaction-summary';
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleCompactionGroupToggle = (thisId: string, counterpartIds: string[]) => {
    if (selectedIds.has(thisId)) {
      onToggle(thisId);
    } else {
      const selectedCounterparts = counterpartIds.filter((id) => selectedIds.has(id));
      if (selectedCounterparts.length > 0) onBulkSet?.([thisId], selectedCounterparts);
      else onToggle(thisId);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filtered = debouncedQuery
    ? messages.filter((m) => m.content?.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header with search */}
      <div className="px-4 py-3 border-b border-gray-50 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-gray-700">Context Messages</span>
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {selectedCount}/{filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled
              title="Coming soon"
              className="flex items-center gap-1 text-[11px] font-medium bg-gray-50 px-2 py-1 rounded-md text-gray-400 cursor-not-allowed opacity-60"
            >
              <Sparkles className="w-3 h-3" />
              AI Pick
            </button>
            <button onClick={onSelectAll} className="text-[11px] text-violet-500 hover:text-violet-700 font-medium">All</button>
            <span className="text-gray-300">·</span>
            <button onClick={onSelectNone} className="text-[11px] text-gray-400 hover:text-gray-600 font-medium">None</button>
          </div>
        </div>
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

      {/* Message list */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-gray-400">No messages in this branch</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-gray-400">No matches in messages</div>
        ) : (
          filtered.map((msg, i) => {
            // Compaction summary row — full row is clickable to select/deselect
            if (msg.type === 'compaction-summary') {
              const isSelected = selectedIds.has(msg.msgId);
              return (
                <button
                  key={msg.msgId}
                  onClick={() => handleCompactionGroupToggle(msg.msgId, msg.originalMsgIds ?? [])}
                  className={cn('w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg border transition-all', isSelected ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-gray-100')}
                >
                  <div className={cn('flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all', isSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300')}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-semibold text-teal-700">{msg.compactionName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-600 font-medium">summary</span>
                    </div>
                    <div className="text-[11px] text-gray-500 line-clamp-1">{truncate(msg.content, 60)}</div>
                  </div>
                </button>
              );
            }

            // Compacted original message row — always visible, indented to show grouping
            if (msg.state === 'compacted') {
              const isSelected = selectedIds.has(msg.msgId);
              const isUser = msg.role === 'user';
              return (
                <button
                  key={msg.msgId}
                  onClick={() => handleCompactionGroupToggle(msg.msgId, msg.compactedBy?.summaryMsgId ? [msg.compactedBy.summaryMsgId] : [])}
                  className={cn(
                    'w-full text-left flex items-start gap-2.5 pl-5 pr-2.5 py-2 rounded-lg transition-all border ml-2',
                    isSelected ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <div className={cn('flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all', isSelected ? 'bg-violet-600 border-violet-600' : 'bg-white border-gray-300')}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-semibold text-gray-500">{isUser ? 'You' : 'K-AI'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">compacted</span>
                    </div>
                    <div className="text-[11px] text-gray-400 line-clamp-1">{truncate(msg.content, 60)}</div>
                  </div>
                </button>
              );
            }

            const isSelected = selectedIds.has(msg.msgId);
            const isUser = msg.role === 'user';
            const isFirstSelected = isSelected && messages.find(m => selectedIds.has(m.msgId))?.msgId === msg.msgId;
            const isInvalidFirst = isFirstSelected && !isUser;

            return (
              <button
                key={msg.msgId}
                onClick={() => onToggle(msg.msgId)}
                className={cn(
                'w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-100 group border',
                isInvalidFirst  ? 'bg-red-50 border-red-200'
                : isSelected    ? 'bg-violet-50 border-violet-200'
                                : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-gray-100'
              )}
              >
                <div className={cn(
                  'flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all',
                  isInvalidFirst  ? 'bg-red-600 border-red-600'
                  : isSelected    ? 'bg-violet-600 border-violet-600'
                                  : 'bg-white border-gray-300 group-hover:border-gray-400'
                )}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>

                {isUser ? (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mt-0.5">
                    <User className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-5 h-5 rounded-md overflow-hidden mt-0.5">
                    <KaiLogo size={20} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className={cn('text-[11px] font-semibold mb-0.5', isUser ? 'text-gray-700' : 'text-violet-700')}>
                    {isUser ? 'You' : 'K-AI'} · #{i + 1}
                  </div>
                  <div className="text-[12px] text-gray-600 leading-snug line-clamp-2">
                    {truncate(msg.content, 80)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Validation warning */}
      {hasInvalidFirst && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-start gap-2.5 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-amber-900 mb-0.5">First message must be from user</div>
            <div className="text-[10px] text-amber-700">Select a user message as the first message in your branch.</div>
          </div>
        </div>
      )}
    </div>
  );
}
