'use client';

import React, { useState } from 'react';
import {
  X, GitBranch, Sparkles, User, Check, Scissors,
  AlertTriangle, List,
} from 'lucide-react';
import { useChatStore, useActiveSession, useActiveBranch, useActiveMessages } from '@/lib/store';
import { Branch, Message } from '@/lib/types';
import { BranchTree } from './BranchTree';
import { BranchVersionsView } from './BranchVersionsView';
import { KaiLogo } from './KaiLogo';

// TODO: BranchGraphView is disabled but preserved at app/components/BranchGraphView.tsx for future use
type RightTab = 'tree' | 'versions';
type Operation = 'fork' | 'cherry' | null;

interface AdaptedBranch {
  id: string;
  name: string;
  version: number;
  parentBranchId?: string;
  forkPointMessageId?: string;
  messageIds: string[];
  selectedMsgIds?: string[];
  description?: string;
  createdAt: Date;
}

interface AdaptedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function truncate(str: string | null, max: number) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function adaptBranch(b: Branch, idx: number): AdaptedBranch {
  return {
    id: b.branchId,
    name: b.label,
    version: idx + 1,
    parentBranchId: b.parentBranchId,
    forkPointMessageId: b.parentMsgId,
    messageIds: b.selectedMsgIds,
    selectedMsgIds: b.selectedMsgIds,
    description: b.description,
    createdAt: new Date(b.createdAt),
  };
}

function adaptMessage(m: Message): AdaptedMessage {
  return {
    id: m.msgId,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.createdAt),
  };
}

export function BranchModal() {
  const showBranchModal = useChatStore((state) => state.showBranchModal);
  const toggleBranchModal = useChatStore((state) => state.toggleBranchModal);
  const forkBranch = useChatStore((state) => state.forkBranch);
  const setActiveBranch = useChatStore((state) => state.setActiveBranch);
  const autoSelectMessages = useChatStore((state) => state.autoSelectMessages);
  const cherryPickBranch = useChatStore((state) => state.cherryPickBranch);

  const activeSession = useActiveSession();
  const activeBranch = useActiveBranch();
  const activeMessages = useActiveMessages();
  const branches = useChatStore((state) => state.branches);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(activeMessages.map(m => m.msgId))
  );
  const [opName, setOpName] = useState('');
  const [operation, setOperation] = useState<Operation>(null);
  const [rightTab, setRightTab] = useState<RightTab>('tree');
  const [confirmSwitch, setConfirmSwitch] = useState<{ id: string; name: string } | null>(null);

  if (!showBranchModal || !activeSession) return null;

  const toggleMessage = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAIRecommend = () => {
    const recommended = new Set(autoSelectMessages());
    setSelectedIds(recommended);
  };

  const startOp = (op: Operation) => {
    setOperation(op);
    setOpName('');
    if (op === 'fork') setOpName(`branch-${branches.length + 1}`);
    if (op === 'cherry') setOpName(`cherry-${branches.length + 1}`);
  };

  const cancelOp = () => { setOperation(null); setOpName(''); };

  const executeOp = () => {
    const count = selectedIds.size;
    if (operation === 'fork' && count > 0) {
      forkBranch(Array.from(selectedIds), opName || `branch-${branches.length + 1}`);
    } else if (operation === 'cherry' && count > 0) {
      cherryPickBranch(Array.from(selectedIds), opName || `cherry-${branches.length + 1}`);
    }
  };

  const requestSwitch = (branchId: string) => {
    const branch = branches.find(b => b.branchId === branchId);
    if (!branch) return;
    if (branchId === activeBranch?.branchId) return;
    setConfirmSwitch({ id: branchId, name: branch.label });
  };

  const confirmAndSwitch = () => {
    if (confirmSwitch) {
      setActiveBranch(confirmSwitch.id);
      toggleBranchModal(false);
    }
    setConfirmSwitch(null);
  };

  const selectedCount = selectedIds.size;
  const currentBranchName = activeBranch?.label ?? 'main';
  const needsName = operation === 'fork' || operation === 'cherry';

  // Validation: first selected message must be from user (for fork/cherry operations)
  const getFirstSelectedMessage = () => {
    const selected = activeMessages.filter(m => selectedIds.has(m.msgId));
    return selected.length > 0 ? selected[0] : null;
  };

  const firstSelected = getFirstSelectedMessage();
  const isFirstFromUser = firstSelected?.role === 'user';
  const hasValidFirstMessage = selectedCount === 0 || isFirstFromUser;

  const canExecute =
    (operation === 'fork' && selectedCount > 0 && hasValidFirstMessage) ||
    (operation === 'cherry' && selectedCount > 0 && hasValidFirstMessage);

  // Rebase and Merge disabled for now
  const OP_BUTTONS: { op: Operation; icon: React.ElementType; label: string; desc: string; color: string }[] = [
    { op: 'fork', icon: GitBranch, label: 'Fork', desc: 'New branch from selected', color: 'violet' },
    { op: 'cherry', icon: Scissors, label: 'Cherry Pick', desc: 'Isolated branch from picks', color: 'pink' },
  ];

  const colorMap: Record<string, string> = {
    violet: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100',
    pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  };

  const adaptedBranches = branches.map(adaptBranch);
  const adaptedMessages = activeMessages.map(adaptMessage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) toggleBranchModal(false); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Branch-switch confirmation dialog */}
      {confirmSwitch && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-[360px] text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Switch branch?</h3>
            <p className="text-[13px] text-gray-500 mb-5">
              Switch to <span className="font-semibold text-gray-800">{confirmSwitch.name}</span>?
              Your active context will change to this branch&apos;s messages.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSwitch(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndSwitch}
                className="flex-1 py-2 px-4 rounded-xl bg-[#18181B] hover:bg-black text-white text-[13px] font-medium transition-colors"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main modal */}
      <div className="relative z-10 w-[1060px] max-w-[96vw] h-[680px] max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <KaiLogo size={28} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-gray-900">Branch Manager</h2>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {activeSession.title}
                </span>
              </div>
              <p className="text-[12px] text-gray-400">
                Active: <span className="text-violet-600 font-medium">{currentBranchName}</span>
                {' · '}
                {branches.length} branch{branches.length !== 1 ? 'es' : ''}
                {' · '}
                {activeMessages.length} messages
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

          {/* ── Left panel: messages + operations ── */}
          <div className="w-[340px] flex-shrink-0 flex flex-col">

            {/* Messages header */}
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-gray-700">Context Messages</span>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {selectedCount}/{activeMessages.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAIRecommend}
                  className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 font-medium bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-md transition-colors"
                  title="AI-recommended context"
                >
                  <Sparkles className="w-3 h-3" />
                  AI Pick
                </button>
                <button onClick={() => setSelectedIds(new Set(activeMessages.map(m => m.msgId)))}
                  className="text-[11px] text-violet-500 hover:text-violet-700 font-medium">All</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] text-gray-400 hover:text-gray-600 font-medium">None</button>
              </div>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 min-h-0">
              {activeMessages.length === 0 ? (
                <div className="text-center py-10 text-[13px] text-gray-400">No messages in this branch</div>
              ) : (
                activeMessages.map((msg, i) => {
                  const isSelected = selectedIds.has(msg.msgId);
                  const isUser = msg.role === 'user';
                  const isFirstSelected = isSelected && firstSelected?.msgId === msg.msgId;
                  const isInvalidFirst = isFirstSelected && !isUser;
                  return (
                    <button
                      key={msg.msgId}
                      onClick={() => toggleMessage(msg.msgId)}
                      className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-100 group ${
                        isInvalidFirst
                          ? 'bg-red-50 border border-red-200'
                          : isSelected
                          ? 'bg-violet-50 border border-violet-200'
                          : 'bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all ${
                        isInvalidFirst
                          ? 'bg-red-600 border-red-600'
                          : isSelected
                          ? 'bg-violet-600 border-violet-600'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {isUser ? (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mt-0.5">
                          <User className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-5 h-5 rounded-md overflow-hidden mt-0.5">
                          <KaiLogo size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-semibold mb-0.5 ${isUser ? 'text-gray-700' : 'text-violet-700'}`}>
                          {isUser ? 'You' : 'K-AI'} · #{i + 1}
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

            {/* Validation warning */}
            {selectedCount > 0 && !hasValidFirstMessage && (
              <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-start gap-2.5 flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-amber-900 mb-0.5">First message must be from user</div>
                  <div className="text-[10px] text-amber-700">Select a user message as the first message in your branch.</div>
                </div>
              </div>
            )}

            {/* Operations panel */}
            <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
              {!operation && (
                <div className="grid grid-cols-2 gap-1.5">
                  {OP_BUTTONS.map(({ op, icon: Icon, label, desc, color }) => (
                    <button
                      key={op}
                      onClick={() => startOp(op)}
                      className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-left transition-all ${colorMap[color]}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[12px] font-semibold">{label}</span>
                      </div>
                      <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {operation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-gray-700 capitalize">{operation} Branch</span>
                    <button onClick={cancelOp} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                  </div>

                  {needsName && (
                    <input
                      type="text"
                      value={opName}
                      onChange={e => setOpName(e.target.value)}
                      placeholder="Branch name…"
                      className="w-full px-3 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:bg-white transition-all"
                      autoFocus
                    />
                  )}

                  {(operation === 'fork' || operation === 'cherry') && (
                    <p className="text-[11px] text-gray-400">{selectedCount} message{selectedCount !== 1 ? 's' : ''} selected</p>
                  )}

                  <button
                    onClick={executeOp}
                    disabled={!canExecute}
                    className={`w-full py-2 rounded-xl text-[13px] font-medium transition-all ${
                      canExecute ? 'bg-[#18181B] hover:bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Confirm {operation === 'fork' ? 'Fork' : 'Cherry Pick'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: visualization tabs ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
              {([
                { id: 'tree' as const, icon: GitBranch, label: 'Branch Tree' },
                { id: 'versions' as const, icon: List, label: 'Versions' },
              ]).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setRightTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    rightTab === id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 p-3 overflow-hidden">
              {rightTab === 'tree' && (
                <BranchTree
                  branches={branches}
                  activeBranchId={activeBranch?.branchId ?? ''}
                  onSwitchBranch={requestSwitch}
                />
              )}
              {rightTab === 'versions' && (
                <BranchVersionsView
                  branches={adaptedBranches}
                  messages={adaptedMessages}
                  activeBranchId={activeBranch?.branchId ?? ''}
                  onSwitchBranch={requestSwitch}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
