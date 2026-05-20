'use client';

import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useChatStore, useActiveSession, useActiveBranch, useActiveMessages } from '@/lib/store';
import { KaiLogo } from '../../common/KaiLogo';
import { Spinner } from '../../common/Spinner';
import { MessageSelector } from './MessageSelector';
import { OperationsPanel } from './OperationsPanel';
import { RightPanel } from './RightPanel';
import { CherryPickPage } from './CherryPickPage';
import { CompactPage, selectableIds } from './CompactPage';
import { Operation, RightTab } from '@/shared/branch-modal';
import { type Message } from '@/shared/types';

// Compacted originals are not in selectedMsgIds — place them right after their summary
function sortByBranchOrder(messages: Message[], selectedMsgIds: string[]): Message[] {
  const posMap = new Map(selectedMsgIds.map((id, i) => [id, i]));
  return [...messages].sort((a, b) => {
    const posA = posMap.has(a.msgId)
      ? posMap.get(a.msgId)!
      : (posMap.get(a.compactedBy?.summaryMsgId ?? '') ?? 0) + 0.5;
    const posB = posMap.has(b.msgId)
      ? posMap.get(b.msgId)!
      : (posMap.get(b.compactedBy?.summaryMsgId ?? '') ?? 0) + 0.5;
    return posA - posB;
  });
}

export function BranchModal() {
  const toggleBranchModal  = useChatStore((s) => s.toggleBranchModal);
  const forkBranch         = useChatStore((s) => s.forkBranch);
  const cherryPickMessages = useChatStore((s) => s.cherryPickMessages);
  const compactMessages    = useChatStore((s) => s.compactMessages);
  const isCompacting       = useChatStore((s) => s.isCompacting);
  const isForkingBranch    = useChatStore((s) => s.isForkingBranch);
  const setActiveBranch    = useChatStore((s) => s.setActiveBranch);
  const branches = useChatStore((s) => s.branches);

  const activeSession  = useActiveSession();
  const activeBranch   = useActiveBranch();
  const activeMessages = useActiveMessages();

  const selectorMessages = useMemo(
    () => sortByBranchOrder(activeMessages, activeBranch?.selectedMsgIds ?? []),
    [activeMessages, activeBranch?.selectedMsgIds],
  );

  // True while messages are still loading — hide selector until all pages are present.
  // Initialise from both flags: hasMoreMessages covers the common case; isLoadingMessages
  // covers the race where the modal opens before the first page has even finished loading
  // (at which point hasMoreMessages is still false even though more pages will exist).
  const [isLoadingAll, setIsLoadingAll] = useState(
    () => useChatStore.getState().isLoadingMessages || useChatStore.getState().hasMoreMessages,
  );

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      const { messages, activeBranchId } = useChatStore.getState();
      const all = activeBranchId ? messages.filter((m) => m.branchId === activeBranchId) : messages;
      setSelectedIds(new Set(all.filter((m) => m.state !== 'compacted').map((m) => m.msgId)));
      setIsLoadingAll(false);
    };

    const loadRemainingThenFinish = () => {
      useChatStore.getState().loadAllMessages().then(finish);
    };

    // If the initial page is still in flight, wait for it to settle before loading remaining pages.
    // This handles the race where hasMoreMessages is false only because the first fetch hasn't
    // resolved yet — subscribing ensures we pick up the real hasMoreMessages value.
    if (useChatStore.getState().isLoadingMessages) {
      const unsub = useChatStore.subscribe((state) => {
        if (!state.isLoadingMessages && !cancelled) {
          unsub();
          loadRemainingThenFinish();
        }
      });
      return () => { cancelled = true; unsub(); };
    }

    loadRemainingThenFinish();
    return () => { cancelled = true; };
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(activeMessages.filter((m) => m.state !== 'compacted').map((m) => m.msgId))
  );
  const [cherrySelectedIds, setCherrySelectedIds] = useState<string[]>([]);
  const [compactSelectedIds, setCompactSelectedIds] = useState<string[]>([]);
  const [compactName, setCompactName] = useState('');
  const [opName, setOpName]         = useState('');
  const [operation, setOperation] = useState<Operation>(null);
  const [rightTab, setRightTab]     = useState<RightTab>('tree');
  const [confirmSwitch, setConfirmSwitch] = useState<{ id: string; name: string } | null>(null);
  const [isCherryPicking, setIsCherryPicking] = useState(false);

  if (!activeSession) return null;

  const toggleMessage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkSetMessages = (toAdd: string[], toRemove: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      toRemove.forEach((id) => next.delete(id));
      toAdd.forEach((id) => next.add(id));
      return next;
    });
  };

  const startOp = (op: 'fork' | 'cherry-pick' | 'compact') => {
    setOperation(op);
    if (op === 'fork') {
      setOpName(`branch-${branches.length + 1}`);
    } else if (op === 'cherry-pick') {
      setCherrySelectedIds([]);
    } else if (op === 'compact') {
      setCompactSelectedIds([]);
      setCompactName('');
    }
  };

  const cancelOp = () => {
    setOperation(null);
    setOpName('');
    setCherrySelectedIds([]);
    setCompactSelectedIds([]);
    setCompactName('');
  };

  const toggleCherryMsg = (msgId: string) => {
    setCherrySelectedIds((prev) => {
      if (prev.includes(msgId)) return prev.filter((id) => id !== msgId);
      return [...prev, msgId];
    });
  };

  const toggleCompactMsg = (msgId: string) => {
    setCompactSelectedIds((prev) => {
      if (prev.includes(msgId)) return prev.filter((id) => id !== msgId);
      return [...prev, msgId];
    });
  };

  const executeCherryPick = async () => {
    setIsCherryPicking(true);
    await cherryPickMessages(cherrySelectedIds);
    setIsCherryPicking(false);
  };

  const executeCompact = () => {
    // Sort selected IDs by chronological order (activeMessages is already ordered by createdAt)
    const orderedIds = activeMessages
      .filter((m) => compactSelectedIds.includes(m.msgId))
      .map((m) => m.msgId);
    compactMessages(orderedIds, compactName);
  };

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
  const firstSelected = selectorMessages.find((m) => selectedIds.has(m.msgId)) ?? null;
  // Compaction summaries are valid as first context — only reject plain assistant messages
  const hasValidFirst = selectedCount === 0 || firstSelected?.role === 'user' || firstSelected?.type === 'compaction-summary';
  const canExecute = operation === 'fork' && selectedCount > 0 && hasValidFirst;

  const currentBranchName = activeBranch?.label ?? 'main';

  return (
    <>
      {/* Branch-switch confirmation dialog */}
      {confirmSwitch && (
        <ConfirmDialog
          title="Switch branch?"
          description={<>Switch to <span className="font-semibold text-gray-800">{confirmSwitch.name}</span>? Your active context will change to this branch&apos;s messages.</>}
          confirmLabel="Switch"
          onConfirm={confirmAndSwitch}
          onCancel={() => setConfirmSwitch(null)}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) toggleBranchModal(false); }}
      >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Main modal */}
      <div className="relative z-10 w-[1060px] max-w-[96vw] h-[680px] max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">

        {/* Full-page overlays */}
        {operation === 'cherry-pick' ? (
          <CherryPickPage
            branches={branches}
            activeBranchId={activeBranch?.branchId ?? ''}
            selectedIds={cherrySelectedIds}
            isCherryPicking={isCherryPicking}
            onToggle={toggleCherryMsg}
            onConfirm={executeCherryPick}
            onBack={() => {
              setOperation(null);
              setCherrySelectedIds([]);
            }}
          />
        ) : operation === 'compact' ? (
          <CompactPage
            messages={selectorMessages}
            selectedIds={compactSelectedIds}
            compactName={compactName}
            isCompacting={isCompacting}
            onToggle={toggleCompactMsg}
            onChangeName={setCompactName}
            onConfirm={executeCompact}
            onBack={cancelOp}
            onSelectAll={() => setCompactSelectedIds(selectableIds(selectorMessages))}
            onSelectNone={() => setCompactSelectedIds([])}
          />
        ) : (
          <>
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
            {isLoadingAll ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <Spinner className="w-5 h-5" />
              </div>
            ) : (
              <>
                <MessageSelector
                  messages={selectorMessages}
                  selectedIds={selectedIds}
                  firstSelectedRole={firstSelected?.role ?? null}
                  firstSelectedType={firstSelected?.type ?? null}
                  onToggle={toggleMessage}
                  onBulkSet={bulkSetMessages}
                  onSelectAll={() => setSelectedIds(new Set(selectorMessages.filter((m) => m.state !== 'compacted').map((m) => m.msgId)))}
                  onSelectNone={() => setSelectedIds(new Set())}
                />
                <OperationsPanel
                  operation={operation}
                  opName={opName}
                  selectedCount={selectedCount}
                  canExecute={canExecute}
                  isForkingBranch={isForkingBranch}
                  onStart={startOp}
                  onCancel={cancelOp}
                  onChangeName={setOpName}
                  onExecute={executeOp}
                />
              </>
            )}
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
          </>
        )}
      </div>
      </div>
    </>
  );
}
