'use client';

import { Sparkles } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { SuggestionChips } from './SuggestionChips';

export function EmptyState() {
  const sendMessage = useChatStore((state) => state.sendMessage);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md mb-6">
        <Sparkles className="w-6 h-6 text-white" />
      </div>

      {/* Greeting */}
      <h2
        className="text-gray-900 mb-2"
        style={{ fontSize: '22px', fontWeight: 600 }}
      >
        How can I help you today?
      </h2>
      <p className="text-[14px] text-gray-500 mb-10 max-w-sm leading-relaxed">
        Ask me anything — from code questions to concept explanations. I&apos;m here to help.
      </p>

      <SuggestionChips onSelect={sendMessage} />
    </div>
  );
}
