'use client';

import { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square, GitBranch } from 'lucide-react';
import { useChatStore, useActiveMessages } from '@/lib/store';
import { cn } from '@/lib/cn';

export function MessageInput() {
  const sendMessage      = useChatStore((s) => s.sendMessage);
  const stopStreaming    = useChatStore((s) => s.stopStreaming);
  const toggleBranchModal = useChatStore((s) => s.toggleBranchModal);
  const isStreaming      = useChatStore((s) => s.isStreaming);
  const activeSessionId  = useChatStore((s) => s.activeSessionId);
  const activeMessages   = useActiveMessages();

  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset to auto first so scrollHeight recalculates correctly (otherwise only grows)
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || !activeSessionId) return;
    sendMessage(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend     = value.trim().length > 0 && !isStreaming;
  const hasBranches = activeMessages.length > 0;

  return (
    <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-4">
      <div className="max-w-[740px] mx-auto">
        <div
          className={cn(
            'flex items-end gap-2 bg-[#F7F7F9] rounded-2xl px-4 py-3 border border-gray-200 transition-all duration-150',
            isStreaming ? 'opacity-80' : 'focus-within:border-gray-300 focus-within:shadow-sm'
          )}
        >
          <button
            onClick={() => toggleBranchModal(true)}
            disabled={!hasBranches}
            title="Branch Manager"
            className={cn(
              'flex-shrink-0 mb-0.5 p-1.5 rounded-lg transition-all duration-150',
              hasBranches
                ? 'text-gray-400 hover:text-violet-600 hover:bg-violet-50 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            )}
          >
            <GitBranch className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? 'K-AI is thinking…' : 'Message K-AI…'}
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed py-0.5 min-h-[24px] max-h-[200px] disabled:cursor-not-allowed"
          />

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              title="Stop generating"
              className="flex-shrink-0 mb-0.5 w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center transition-colors"
            >
              <Square className="w-3 h-3 fill-white" />
            </button>
          ) : (
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
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-2.5">
          K-AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
