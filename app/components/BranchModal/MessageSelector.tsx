'use client';

import { Sparkles, User, Check } from 'lucide-react';
import { Message } from '@/lib/types';
import { KaiLogo } from '../KaiLogo';
import { cn } from '@/lib/cn';

function truncate(str: string | null, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

interface MessageSelectorProps {
  messages: Message[];
  selectedIds: Set<string>;
  firstSelectedRole: 'user' | 'assistant' | null;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function MessageSelector({
  messages,
  selectedIds,
  firstSelectedRole,
  onToggle,
  onSelectAll,
  onSelectNone,
}: MessageSelectorProps) {
  const selectedCount = selectedIds.size;
  const hasInvalidFirst = selectedCount > 0 && firstSelectedRole === 'assistant';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-gray-700">Context Messages</span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {selectedCount}/{messages.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/*
            AI Pick — not yet implemented.
            Idea: POST all messages from the active branch to a dedicated API endpoint,
            optionally with a user-provided preference string (e.g. "focus on the auth discussion").
            The AI returns the message IDs it considers most relevant for the branch context.
            Needs: a new Lambda/API route, prompt design, and a preference input UI.
          */}
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

      {/* Message list */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-gray-400">No messages in this branch</div>
        ) : (
          messages.map((msg, i) => {
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
