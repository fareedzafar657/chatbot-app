'use client';

import { useState } from 'react';
import { ArrowLeft, Minimize2 } from 'lucide-react';
import { type Message } from '@/shared/types';
import { Spinner } from '../../common/Spinner';
import { cn } from '@/lib/cn';
import { truncate } from './modal.utils';
import { MessagePreviewRow, SelectedPreviewCard } from './MessagePreviewRow';

const TRUNCATE_COMPACT_ROW  = 60;  // compact/summary rows in the message list
const TRUNCATE_LIST_ITEM    = 80;  // selectable messages in the left panel
const TRUNCATE_PREVIEW_ITEM = 100; // messages in the right-side preview panel

export function selectableIds(messages: Message[]): string[] {
  return messages
    .filter((m) => m.state !== 'compacted' && m.type !== 'compaction-summary')
    .map((m) => m.msgId);
}

function estimateTokens(messages: Message[]): number {
  return Math.round(
    messages.reduce((acc, m) => acc + (m.content?.length ?? 0), 0) / 4
  );
}

interface CompactTabProps {
  messages: Message[];
  selectedIds: string[];
  compactName: string;
  isCompacting: boolean;
  onToggle: (msgId: string) => void;
  onChangeName: (name: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function CompactTab({
  messages,
  selectedIds,
  compactName,
  isCompacting,
  onToggle,
  onChangeName,
  onConfirm,
  onBack,
  onSelectAll,
  onSelectNone,
}: CompactTabProps) {
  const [nameError, setNameError] = useState(false);

  const selectedSet = new Set(selectableIds(messages).filter((id) => selectedIds.includes(id)));
  const selectedMessages = messages.filter((m) => selectedSet.has(m.msgId));
  const tokenEstimate = estimateTokens(selectedMessages);
  const firstSelectedRole = selectedMessages.length > 0 ? selectedMessages[0].role : null;
  const hasInvalidFirst   = firstSelectedRole === 'assistant';
  const canConfirm = selectedIds.length >= 2 && compactName.trim().length > 0 && !isCompacting && !hasInvalidFirst;

  const handleConfirm = () => {
    if (!compactName.trim()) { setNameError(true); return; }
    setNameError(false);
    onConfirm();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Compact Messages</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {selectedIds.length} selected
            {selectedIds.length >= 2 && (
              <> · <span className="text-teal-600">~{tokenEstimate.toLocaleString()} tokens (est.)</span></>
            )}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">

        {/* Left: message list */}
        <div className="w-[380px] flex-shrink-0 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
            <p className="text-[11px] text-gray-500">Select 2+ messages to replace with an AI summary.</p>
            <div className="flex items-center gap-1.5">
              <button onClick={onSelectAll} className="text-[11px] text-teal-600 hover:text-teal-700 font-medium transition-colors">All</button>
              <span className="text-[11px] text-gray-300">·</span>
              <button onClick={onSelectNone} className="text-[11px] text-gray-400 hover:text-gray-600 font-medium transition-colors">None</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-[13px] text-gray-400">No messages</div>
            ) : (
              messages.map((msg) => {
                if (msg.state === 'compacted') return <CompactedRow key={msg.msgId} msg={msg} />;
                if (msg.type === 'compaction-summary') return <SummaryRow key={msg.msgId} msg={msg} />;

                const isSelected = selectedIds.includes(msg.msgId);

                return (
                  <button
                    key={msg.msgId}
                    onClick={() => onToggle(msg.msgId)}
                    className={cn(
                      'w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg transition-all border',
                      isSelected
                        ? 'bg-teal-50 border-teal-200'
                        : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-gray-100'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all',
                      isSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'
                    )}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>

                    <MessagePreviewRow
                      message={msg}
                      avatarSize={20}
                      truncateAt={TRUNCATE_LIST_ITEM}
                      clampClass="line-clamp-2"
                      labelClass="text-[11px]"
                      contentClass="text-[12px]"
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Warning */}
          {hasInvalidFirst && (
            <div className="px-3 py-2.5 bg-amber-50 border-t border-amber-100 flex-shrink-0">
              <div className="text-[11px] font-semibold text-amber-900 mb-0.5">First message must be from user</div>
              <div className="text-[10px] text-amber-700">Select a user message as the first message to compact.</div>
            </div>
          )}
        </div>

        {/* Right: name + preview */}
        <div className="flex-1 flex flex-col border border-gray-200 rounded-lg overflow-hidden">

          {/* Name input */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 space-y-1.5">
            <div className="text-[12px] font-semibold text-gray-700">Compaction Name</div>
            <input
              type="text"
              value={compactName}
              onChange={(e) => { onChangeName(e.target.value); if (nameError) setNameError(false); }}
              placeholder="e.g. stars-discussion"
              className={cn(
                'w-full px-3 py-1.5 text-[12px] bg-gray-50 border rounded-lg outline-none transition-all',
                nameError
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-gray-200 focus:border-teal-400 focus:bg-white'
              )}
              autoFocus
            />
            {nameError && <p className="text-[10px] text-red-500">Name is required</p>}
          </div>

          {/* Selected preview */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px] text-gray-400">
                Select messages on the left
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMessages.map((msg, index) => (
                  <SelectedPreviewCard
                    key={msg.msgId}
                    message={msg}
                    index={index}
                    accent="teal"
                    truncateAt={TRUNCATE_PREVIEW_ITEM}
                    clampClass="line-clamp-3"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-[12px] font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-[12px] transition-all',
                canConfirm
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {isCompacting && <Spinner className="w-3 h-3" />}
              {isCompacting ? 'Compacting…' : 'Confirm Compact'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-rows ─────────────────────────────────────────────────────────────────

function CompactedRow({ msg }: { msg: Message }) {
  return (
    <div className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg bg-gray-50 border border-transparent opacity-60">
      <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-gray-200 bg-gray-100" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-semibold text-gray-500">
            {msg.role === 'user' ? 'You' : 'K-AI'}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            compacted · {msg.compactedBy?.name}
          </span>
        </div>
        <div className="text-[11px] text-gray-400 line-clamp-1">{truncate(msg.content, TRUNCATE_COMPACT_ROW)}</div>
      </div>
    </div>
  );
}

function SummaryRow({ msg }: { msg: Message }) {
  return (
    <div className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg bg-teal-50 border border-teal-100">
      <Minimize2 className="flex-shrink-0 w-4 h-4 text-teal-600 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-semibold text-teal-700">{msg.compaction?.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-600 font-medium">
            summary
          </span>
        </div>
        <div className="text-[11px] text-teal-600 line-clamp-1">{truncate(msg.content, TRUNCATE_COMPACT_ROW)}</div>
      </div>
    </div>
  );
}
