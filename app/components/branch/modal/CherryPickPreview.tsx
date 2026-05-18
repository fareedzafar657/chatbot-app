'use client';

import { Message } from '@/shared/types';
import { User } from 'lucide-react';
import { KaiLogo } from '../../common/KaiLogo';
import { cn } from '@/lib/cn';

function truncate(str: string | null, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

interface CherryPickPreviewProps {
  selectedMessages: Message[];
}

export function CherryPickPreview({ selectedMessages }: CherryPickPreviewProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
        <div className="text-[12px] font-semibold text-gray-700">Append Order</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{selectedMessages.length} messages selected</div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2 min-h-0">
        {selectedMessages.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-gray-400">No messages selected yet</div>
        ) : (
          selectedMessages.map((msg, index) => {
            const isUser = msg.role === 'user';

            return (
              <div key={msg.msgId} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {index + 1}
                </div>

                {isUser ? (
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center mt-1">
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-4 h-4 rounded overflow-hidden mt-1">
                    <KaiLogo size={16} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className={cn('text-[10px] font-semibold mb-0.5', isUser ? 'text-gray-700' : 'text-violet-700')}>
                    {isUser ? 'You' : 'K-AI'}
                  </div>
                  <div className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                    {truncate(msg.content, 100)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
