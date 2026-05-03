'use client';

import { GitBranch } from 'lucide-react';
import { useChatStore, useActiveSession, useActiveBranch, useActiveMessages } from '@/lib/store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatWindow() {
  const toggleBranchModal = useChatStore((state) => state.toggleBranchModal);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const streamingMessageId = useChatStore((state) => state.streamingMessageId);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);
  const branchCount = useChatStore((state) => state.branches.length);
  const activeSession = useActiveSession();
  const activeBranch = useActiveBranch();
  const activeMessages = useActiveMessages();

  const title = activeSession?.title ?? 'New Conversation';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0 h-[56px] flex items-center justify-between px-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h1
              className="text-gray-900 truncate"
              style={{ fontSize: '14px', fontWeight: 600, lineHeight: '1.4' }}
            >
              {title}
            </h1>
            {activeBranch && (
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3 h-3 text-gray-400" />
                <span className="text-[11px] text-gray-400">{activeBranch.label}</span>
                {branchCount > 1 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-violet-500">{branchCount} branches</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100">
              <span className="cursor-blink inline-block w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[11px] font-medium text-violet-600">Generating</span>
            </div>
          )}
          <button
            onClick={() => toggleBranchModal(true)}
            disabled={activeMessages.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              activeMessages.length > 0
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-200'
                : 'text-gray-300 border border-gray-100 cursor-not-allowed'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Branches
          </button>
        </div>
      </div>

      {/* Messages / Empty state */}
      <MessageList
        messages={activeMessages}
        streamingMessageId={streamingMessageId}
        hasMoreMessages={hasMoreMessages}
        isLoadingMessages={isLoadingMessages}
        onLoadMore={loadMoreMessages}
      />

      {/* Input */}
      <MessageInput />
    </div>
  );
}
