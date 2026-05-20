'use client';

import { useState } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import { useChatStore, useActiveMessages } from '@/lib/store';
import { Spinner } from '../common/Spinner';
import { cn } from '@/lib/cn';

export function CompactsView() {
  const messages         = useActiveMessages();
  const deleteCompaction = useChatStore((s) => s.deleteCompaction);

  const compacts = messages.filter((m) => m.type === 'compaction-summary');

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const handleDelete = async (summaryMsgId: string) => {
    if (confirmingId !== summaryMsgId) {
      setConfirmingId(summaryMsgId);
      return;
    }
    setConfirmingId(null);
    setDeletingId(summaryMsgId);
    await deleteCompaction(summaryMsgId);
    setDeletingId(null);
  };

  if (compacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 px-6 text-center">
        <Archive className="w-8 h-8 opacity-30" />
        <p className="text-[13px] font-medium">No compactions yet</p>
        <p className="text-[11px] text-gray-400">
          Use Compact to replace selected messages with an AI summary and free context tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full py-1 pr-1">
      {compacts.map((msg) => {
        const msgCount     = msg.originalMsgIds?.length ?? 0;
        const saved        = (msg.tokensBefore ?? 0) - (msg.tokensAfter ?? 0);
        const isConfirming = confirmingId === msg.msgId;
        const isDeleting   = deletingId === msg.msgId;
        const date         = new Date(msg.createdAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });

        return (
          <div
            key={msg.msgId}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors',
              isConfirming
                ? 'bg-red-50 border-red-200'
                : 'bg-teal-50 border-teal-100'
            )}
          >
            {/* Compact icon */}
            <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1.5">
              <div className="w-3.5 h-0.5 bg-teal-500 rounded-full" />
              <div className="w-2 h-0.5 bg-teal-400 rounded-full" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-teal-800 truncate">{msg.compactionName}</div>
              <div className="text-[11px] text-teal-600 mt-0.5">
                {msgCount > 0 && <>{msgCount} msg{msgCount !== 1 ? 's' : ''} · </>}
                {saved > 0 ? `saved ~${saved.toLocaleString()} tokens` : 'compacted'}
              </div>
              <div className="text-[10px] text-teal-500 mt-0.5">{date}</div>

              {/* Inline confirm */}
              {isConfirming && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-red-600 font-medium">Revert and restore originals?</span>
                  <button
                    onClick={() => handleDelete(msg.msgId)}
                    className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="text-[10px] px-2 py-0.5 text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Delete button */}
            {!isConfirming && (
              <button
                onClick={() => handleDelete(msg.msgId)}
                disabled={isDeleting}
                className="flex-shrink-0 p-1 rounded-lg text-teal-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Revert compaction"
              >
                {isDeleting ? <Spinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
