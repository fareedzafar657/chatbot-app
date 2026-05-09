'use client';

import { useChatStore } from '@/lib/store';
import { SuggestionChips } from './SuggestionChips';
import { KaiLogo } from './KaiLogo';

export function EmptyState() {
  const sendMessage = useChatStore((state) => state.sendMessage);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Logo */}
      <div className="mb-6">
        <KaiLogo size={56} />
      </div>

      {/* Greeting */}
      <h2
        className="text-gray-900 mb-1"
        style={{ fontSize: '22px', fontWeight: 600 }}
      >
        Hello, I&apos;m K-AI
      </h2>
      <p className="text-[11px] text-gray-400 mb-8">by Wondering Kaslana</p>
      <p className="text-[14px] text-gray-500 mb-10 max-w-sm leading-relaxed">
        Ask me anything — from code questions to concept explanations. I&apos;m here to help.
      </p>

      <SuggestionChips onSelect={sendMessage} />
    </div>
  );
}
