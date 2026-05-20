'use client';

import { Copy, Check, X } from 'lucide-react';
import { Message } from '@/shared/types';
import { useCopyToClipboard } from '@/lib/hooks';
import { MarkdownRenderer } from './MarkdownRenderer';
import { KaiLogo } from '../common/KaiLogo';
import { CompactCard } from './CompactCard';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copyState, copy] = useCopyToClipboard();

  if (message.type === 'compaction-summary') return <CompactCard message={message} />;

  const handleCopy = () => copy(message.content!);

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 group">
        <div className="max-w-[72%]">
          <div className="bg-[#18181B] text-white px-4 py-3 rounded-2xl rounded-br-sm text-[14px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 group">
      <div className="flex-shrink-0">
        <KaiLogo size={28} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[12px] font-semibold text-gray-900">K-AI</span>
          {isStreaming && (
            <span className="text-[10px] text-violet-500 font-medium tracking-wide uppercase">
              Generating…
            </span>
          )}
        </div>

        <div className="text-gray-800">
          {message.content
            ? <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
            : isStreaming
              ? <span className="cursor-blink inline-block w-[2px] h-[1em] bg-gray-500 align-middle" />
              : null}
        </div>

        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[11px] text-gray-400">{formatTime(message.createdAt)}</span>
          {!isStreaming && message.content && (
            <button
              onClick={handleCopy}
              title={copyState === 'error' ? 'Copy failed' : 'Copy message'}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            >
              {copyState === 'copied' ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : copyState === 'error' ? (
                <X className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
