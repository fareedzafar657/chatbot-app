'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from './EmptyState';

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
}

export function MessageList({ messages, streamingMessageId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageContent = messages[messages.length - 1]?.content;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, lastMessageContent]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{ scrollbarGutter: 'stable' } as React.CSSProperties}
    >
      <div className="max-w-[740px] mx-auto px-6 pt-8 pb-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
