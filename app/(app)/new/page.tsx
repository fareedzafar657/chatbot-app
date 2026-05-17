'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { EmptyState } from '@/app/components/chat/EmptyState';
import { useChatStore } from '@/lib/store';
import { cn } from '@/lib/cn';

interface NewChatInputProps { onSend: (prompt: string) => void; }

function NewChatInput({ onSend }: NewChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-4">
      <div className="max-w-[740px] mx-auto">
        <div className="flex items-end gap-2 bg-[#F7F7F9] rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-gray-300 focus-within:shadow-sm transition-all duration-150">
          {/* Input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message K-AI…"
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed py-0.5 min-h-[24px] max-h-[200px]"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            title="Send message"
            className={cn(
              'flex-shrink-0 mb-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150',
              canSend
                ? 'bg-[#18181B] hover:bg-black text-white shadow-sm cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-2.5">
          K-AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NewPage() {
  const router = useRouter();

  const handleSend = (prompt: string) => {
    const { activeSessionId, newSession } = useChatStore.getState();
    if (!activeSessionId) newSession();
    const sessionId = useChatStore.getState().activeSessionId!;
    router.push(`/chat/${sessionId}?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <EmptyState onSelect={handleSend} />
      <NewChatInput onSend={handleSend} />
    </div>
  );
}
