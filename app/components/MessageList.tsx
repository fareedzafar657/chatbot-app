'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from './EmptyState';

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
  onLoadMore?: () => void;
}

export function MessageList({
  messages,
  streamingMessageId,
  hasMoreMessages,
  isLoadingMessages,
  onLoadMore,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageContent = messages[messages.length - 1]?.content;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, lastMessageContent]);

  if (messages.length === 0 && !isLoadingMessages) {
    return <EmptyState />;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{ scrollbarGutter: 'stable' } as React.CSSProperties}
    >
      <div className="max-w-[740px] mx-auto px-6 pt-8 pb-4">
        {/* Load more — older messages */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-6">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMessages}
              className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {isLoadingMessages ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Loading skeleton while first fetch is in flight */}
        {isLoadingMessages && messages.length === 0 && (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'gap-3'}`}>
                {i % 2 !== 0 && <div className="w-7 h-7 rounded-lg bg-gray-100 flex-shrink-0" />}
                <div className={`rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'h-10 w-48' : 'h-16 flex-1 max-w-[60%]'}`} />
              </div>
            ))}
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.msgId}
            message={message}
            isStreaming={message.msgId === streamingMessageId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
