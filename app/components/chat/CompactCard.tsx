'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { type Message } from '@/shared/types';
import { cn } from '@/lib/cn';

interface CompactCardProps {
  message: Message;
}

export function CompactCard({ message }: CompactCardProps) {
  const [expanded, setExpanded] = useState(false);
  const msgCount = message.originalMsgIds?.length ?? 0;
  const saved = (message.tokensBefore ?? 0) - (message.tokensAfter ?? 0);

  return (
    <div className="flex justify-center mb-5">
      <div className="w-fit rounded-xl bg-teal-50 border border-teal-100 text-teal-700 overflow-hidden">
        {/* Pill row — click to toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2.5 px-4 py-2 hover:bg-teal-100/40 transition-colors"
        >
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <div className="w-3.5 h-0.5 bg-teal-500 rounded-full" />
            <div className="w-2 h-0.5 bg-teal-400 rounded-full" />
          </div>

          <span className="text-[12px] font-semibold">{message.compactionName}</span>

          <span className="text-[11px] text-teal-500 whitespace-nowrap">
            {msgCount > 0 && <>{msgCount} msg{msgCount !== 1 ? 's' : ''} · </>}
            {saved > 0 ? `saved ~${saved.toLocaleString()} tokens` : 'compacted'}
          </span>

          <ChevronDown className={cn('w-3 h-3 ml-2 flex-shrink-0 transition-transform duration-150', expanded && 'rotate-180')} />
        </button>

        {/* Expanded summary text */}
        {expanded && (
          <div className="px-4 pb-3 pt-1 border-t border-teal-100 max-w-[480px]">
            <p className="text-[12px] text-teal-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}
