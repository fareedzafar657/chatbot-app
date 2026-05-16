'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useChatStore, useActiveSession, useActiveBranch, useActiveMessages } from '@/lib/store';
import { KaiLogo } from '../KaiLogo';
import { MessageSelector } from './MessageSelector';
import { OperationsPanel } from './OperationsPanel';
import { RightPanel } from './RightPanel';
import { Operation, RightTab } from './types';

export function BranchModal() {
  const toggleBranchModal  = useChatStore((s) => s.toggleBranchModal);
  const forkBranch         = useChatStore((s) => s.forkBranch);
  const setActiveBranch    = useChatStore((s) => s.setActiveBranch);
  const branches = useChatStore((s) => s.branches);

  const activeSession  = useActiveSession();
  const activeBranch   = useActiveBranch();
  const activeMessages = useActiveMessages();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(activeMessages.map((m) => m.msgId))
  );
  const [opName, setOpName]         = useState('');
  const [operation, setOperation] = useState<Operation>(null);
  const [rightTab, setRightTab]     = useState<RightTab>('tree');
  const [confirmSwitch, setConfirmSwitch] = useState<{ id: string; name: string } | null>(null);

  if (!activeSession) return null;

  const toggleMessage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startOp = (op: 'fork') => {
    setOperation(op);
    setOpName(`branch-${branches.length + 1}`);
  };

  const cancelOp = () => { setOperation(null); setOpName(''); };

  const executeOp = () => {
    if (operation === 'fork') forkBranch(Array.from(selectedIds), opName || `branch-${branches.length + 1}`);
  };

  const requestSwitch = (branchId: string) => {
    if (branchId === activeBranch?.branchId) return;
    const branch = branches.find((b) => b.branchId === branchId)!;
    setConfirmSwitch({ id: branchId, name: branch.label });
  };

  const confirmAndSwitch = () => {
    setActiveBranch(confirmSwitch!.id);
    toggleBranchModal(false);
    setConfirmSwitch(null);
  };

  const selectedCount = selectedIds.size;
  const firstSelected = activeMessages.find((m) => selectedIds.has(m.msgId)) ?? null;
  const hasValidFirst = selectedCount === 0 || firstSelected?.role === 'user';
  const canExecute = operation === 'fork' && selectedCount > 0 && hasValidFirst;

  const currentBranchName = activeBranch?.label ?? 'main';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) toggleBranchModal(false); }}
    >
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

          {/* Left panel */}
          <div className="w-[340px] flex-shrink-0 flex flex-col">
            <MessageSelector
              messages={activeMessages}
              selectedIds={selectedIds}
              firstSelectedRole={firstSelected?.role ?? null}
              onToggle={toggleMessage}
              onSelectAll={() => setSelectedIds(new Set(activeMessages.map((m) => m.msgId)))}
              onSelectNone={() => setSelectedIds(new Set())}
            />
            <OperationsPanel
              operation={operation}
              opName={opName}
              selectedCount={selectedCount}
              canExecute={canExecute}
              onStart={startOp}
              onCancel={cancelOp}
              onChangeName={setOpName}
              onExecute={executeOp}
            />
          </div>

          {/* Right panel */}
          <RightPanel
            activeTab={rightTab}
            branches={branches}
            activeBranchId={activeBranch?.branchId ?? ''}
            onTabChange={setRightTab}
            onSwitchBranch={requestSwitch}
          />
        </div>
      </div>
    </div>
  );
}
