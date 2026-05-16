'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from './EmptyState';

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  onLoadMore: () => void;
}

// Alternating skeleton shapes to mimic assistant / user / assistant bubble layout
const SKELETON_SHAPES = [
  { align: 'gap-3',       avatar: true,  bubble: 'h-16 flex-1 max-w-[60%]' },
  { align: 'justify-end', avatar: false, bubble: 'h-10 w-48'               },
  { align: 'gap-3',       avatar: true,  bubble: 'h-16 flex-1 max-w-[60%]' },
];

export function MessageList({
  messages,
  streamingMessageId,
  hasMoreMessages,
  isLoadingMessages,
  onLoadMore,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when a new message is added or streaming begins/ends
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessageId]);

  if (messages.length === 0 && !isLoadingMessages) {
    return <EmptyState />;
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarGutter: 'stable' } as React.CSSProperties}
    >
      <div className="max-w-[740px] mx-auto px-6 pt-8 pb-4">

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

        {isLoadingMessages && messages.length === 0 && (
          <div className="space-y-6 animate-pulse">
            {SKELETON_SHAPES.map((shape, i) => (
              <div key={i} className={`flex ${shape.align}`}>
                {shape.avatar && <div className="w-7 h-7 rounded-lg bg-gray-100 flex-shrink-0" />}
                <div className={`rounded-2xl bg-gray-100 ${shape.bubble}`} />
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
