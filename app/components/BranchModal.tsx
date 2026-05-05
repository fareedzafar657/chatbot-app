'use client';

import React, { useState } from 'react';
import { X, GitBranch, Sparkles, User, Check } from 'lucide-react';
import { useChatStore, useActiveSession, useActiveMessages, useActiveBranch } from '@/lib/store';
import { BranchTree } from './BranchTree';

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function BranchModal() {
  const toggleBranchModal = useChatStore((state) => state.toggleBranchModal);
  const forkBranch = useChatStore((state) => state.forkBranch);
  const setActiveBranch = useChatStore((state) => state.setActiveBranch);
  const branches = useChatStore((state) => state.branches);
  const activeBranchId = useChatStore((state) => state.activeBranchId);
  const activeSession = useActiveSession();
  const activeMessages = useActiveMessages();
  const activeBranch = useActiveBranch();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(activeMessages.map((m) => m.msgId))
  );
  const [forkName, setForkName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  if (!activeSession) return null;

  const toggleMessage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFork = () => {
    if (!showNameInput) {
      setShowNameInput(true);
      setForkName(`branch-${branches.length + 1}`);
      return;
    }
    const label = forkName.trim() || `branch-${branches.length + 1}`;
    forkBranch(Array.from(selectedIds), label);
  };

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  const handleConfirmSwitch = async () => {
    if (selectedBranchId && selectedBranchId !== activeBranchId) {
      await setActiveBranch(selectedBranchId);
      toggleBranchModal(false);
      setSelectedBranchId(null);
    }
  };

  const selectedCount = selectedIds.size;
  const currentBranchLabel = activeBranch?.label ?? 'main';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleBranchModal(false);
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Modal */}
      <div className="relative z-10 w-[900px] max-w-[96vw] h-[580px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Branch Manager</h2>
              <p className="text-[12px] text-gray-400">
                Current:{' '}
                <span className="text-violet-600 font-medium">{currentBranchLabel}</span>
                {' · '}
                {branches.length} branch{branches.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleBranchModal(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden divide-x divide-gray-100">
          {/* Left: Message selector */}
          <div className="w-[320px] flex-shrink-0 flex flex-col">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Messages
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">{selectedCount} selected</span>
                <button
                  onClick={() => setSelectedIds(new Set(activeMessages.map((m) => m.msgId)))}
                  className="text-[11px] text-violet-500 hover:text-violet-700 font-medium"
                >
                  All
                </button>
                <span className="text-gray-300">·</span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] text-gray-400 hover:text-gray-600 font-medium"
                >
                  None
                </button>
              </div>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {activeMessages.length === 0 ? (
                <div className="text-center py-10 text-[13px] text-gray-400">
                  No messages in this branch
                </div>
              ) : (
                activeMessages.map((msg, i) => {
                  const isSelected = selectedIds.has(msg.msgId);
                  const isUser = msg.role === 'user';

                  return (
                    <button
                      key={msg.msgId}
                      onClick={() => toggleMessage(msg.msgId)}
                      className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-100 group ${
                        isSelected
                          ? 'bg-violet-50 border border-violet-200'
                          : 'bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-violet-600 border-violet-600'
                            : 'bg-white border-gray-300 group-hover:border-gray-400'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>

                      {/* Avatar */}
                      {isUser ? (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mt-0.5">
                          <User className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mt-0.5">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[11px] font-semibold mb-0.5 ${
                            isUser ? 'text-gray-700' : 'text-violet-700'
                          }`}
                        >
                          {isUser ? 'You' : 'Chatbot'} · #{i + 1}
                        </div>
                        <div className="text-[12px] text-gray-600 leading-snug line-clamp-2">
                          {truncate(msg.content, 80)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Fork button */}
            <div className="px-4 py-4 border-t border-gray-100">
              {showNameInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={forkName}
                    onChange={(e) => setForkName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFork()}
                    placeholder="Branch name…"
                    className="w-full px-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:bg-white transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleFork}
                      disabled={selectedCount === 0}
                      className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        selectedCount > 0
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Create Fork
                    </button>
                    <button
                      onClick={() => setShowNameInput(false)}
                      className="px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleFork}
                  disabled={selectedCount === 0}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    selectedCount > 0
                      ? 'bg-[#18181B] hover:bg-black text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Fork Branch ({selectedCount} msg{selectedCount !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          </div>

          {/* Right: Branch tree */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 overflow-hidden">
              <BranchTree
                branches={branches}
                activeBranchId={selectedBranchId ?? activeBranchId ?? ''}
                onSwitchBranch={handleSelectBranch}
              />
            </div>

            {/* Confirm button */}
            {selectedBranchId && selectedBranchId !== activeBranchId && (
              <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                <button
                  onClick={handleConfirmSwitch}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium transition-all shadow-sm"
                >
                  Switch to Branch
                </button>
                <button
                  onClick={() => setSelectedBranchId(null)}
                  className="px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 text-[13px] font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
