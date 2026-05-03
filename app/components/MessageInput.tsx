'use client';

import { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square, GitBranch } from 'lucide-react';
import { useChatStore, useActiveMessages } from '@/lib/store';

export function MessageInput() {
  const sendMessage = useChatStore((state) => state.sendMessage);
  const stopStreaming = useChatStore((state) => state.stopStreaming);
  const toggleBranchModal = useChatStore((state) => state.toggleBranchModal);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const activeMessages = useActiveMessages();

  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSessionId = useChatStore((state) => state.activeSessionId);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
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

  const canSend = value.trim().length > 0 && !isStreaming;
  const hasBranches = activeMessages.length > 0;

  return (
    <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 pt-4 pb-4">
      <div className="max-w-[740px] mx-auto">
        {/* Input container */}
        <div
          className={`flex items-end gap-2 bg-[#F7F7F9] rounded-2xl px-4 py-3 border transition-all duration-150 ${
            isStreaming
              ? 'border-gray-200 opacity-80'
              : 'border-gray-200 focus-within:border-gray-300 focus-within:shadow-sm'
          }`}
        >
          {/* Branch manager button */}
          <button
            onClick={() => toggleBranchModal(true)}
            disabled={!hasBranches}
            title="Branch Manager"
            className={`flex-shrink-0 mb-0.5 p-1.5 rounded-lg transition-all duration-150 ${
              hasBranches
                ? 'text-gray-400 hover:text-violet-600 hover:bg-violet-50 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <GitBranch className="w-4 h-4" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Generating response…' : 'Message Chatbot…'}
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed py-0.5 min-h-[24px] max-h-[200px] disabled:cursor-not-allowed"
          />

          {/* Send / Stop button */}
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
              className={`flex-shrink-0 mb-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
                canSend
                  ? 'bg-[#18181B] hover:bg-black text-white shadow-sm cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-gray-400 mt-2.5">
          Chatbot can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
