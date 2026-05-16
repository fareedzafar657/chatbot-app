import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Session, Message, Branch } from './types';
import { api } from './api';
import { streamChat } from './stream';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function genTempId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  activeBranchId: string | null;
  messages: Message[];
  branches: Branch[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  showBranchModal: boolean;
  hasMoreMessages: boolean;
  messagesCursor: string | null;
  abortController: AbortController | null;
  errorMessage: string | null;
  hasMoreSessions: boolean;
  sessionsCursor: string | null;
}

interface ChatActions {
  initSessions(): Promise<void>;
  loadMoreSessions(): Promise<void>;
  setActiveSession(sessionId: string): void;
  loadMessages(branchId: string, cursor?: string): Promise<void>;
  loadMoreMessages(): Promise<void>;
  loadBranches(sessionId: string): Promise<void>;
  newSession(): void;
  deleteSession(sessionId: string): void;
  renameSession(sessionId: string, title: string): Promise<void>;
  sendMessage(prompt: string): void;
  stopStreaming(): void;
  toggleBranchModal(show: boolean): void;
  forkBranch(selectedMsgIds: string[], label?: string): void;
  setActiveBranch(branchId: string): void;
  autoSelectMessages(): string[];
  cherryPickBranch(selectedMsgIds: string[], branchName: string): void;
  dismissError(): void;
}

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  sessions: [],
  activeSessionId: null,
  activeBranchId: null,
  messages: [],
  branches: [],
  isStreaming: false,
  streamingMessageId: null,
  isLoadingSessions: true,
  isLoadingMessages: false,
  showBranchModal: false,
  hasMoreMessages: false,
  messagesCursor: null,
  abortController: null,
  errorMessage: null,
  hasMoreSessions: false,
  sessionsCursor: null,

  // ── Session management ────────────────────────────────────────────────────

  initSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const result = await api.listSessions();
      set({
        sessions: result.items,
        hasMoreSessions: result.hasMore,
        sessionsCursor: result.nextCursor ?? null,
        isLoadingSessions: false,
      });
    } catch {
      set({ isLoadingSessions: false, errorMessage: GENERIC_ERROR });
    }
  },

  loadMoreSessions: async () => {
    const { sessionsCursor, sessions } = get();
    if (!sessionsCursor) return;
    try {
      const result = await api.listSessions(sessionsCursor);
      set({
        sessions: [...sessions, ...result.items],
        hasMoreSessions: result.hasMore,
        sessionsCursor: result.nextCursor ?? null,
      });
    } catch {
      set({ errorMessage: GENERIC_ERROR });
    }
  },

  setActiveSession: (sessionId) => {
    const { abortController } = get();
    if (abortController) abortController.abort();

    const session = get().sessions.find((s) => s.sessionId === sessionId);
    if (!session) return;

    set({
      activeSessionId: sessionId,
      activeBranchId: session.activeBranchId,
      messages: [],
      branches: [],
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      hasMoreMessages: false,
      messagesCursor: null,
      isLoadingMessages: true,
    });

    get().loadMessages(session.activeBranchId);
    get().loadBranches(sessionId);
  },

  // ── Message operations ────────────────────────────────────────────────────

  loadMessages: async (branchId, cursor?) => {
    set({ isLoadingMessages: true });
    try {
      const result = await api.listMessages(branchId, cursor);
      if (get().activeBranchId !== branchId) return;
      set((state) => ({
        // Cursor-based pagination: prepend older messages at the top
        messages: cursor ? [...result.items, ...state.messages] : result.items,
        hasMoreMessages: result.hasMore,
        messagesCursor: result.nextCursor ?? null,
        isLoadingMessages: false,
      }));
    } catch {
      if (get().activeBranchId !== branchId) return;
      set({ isLoadingMessages: false, errorMessage: GENERIC_ERROR });
    }
  },

  loadMoreMessages: async () => {
    const { messagesCursor, activeBranchId } = get();
    if (!messagesCursor || !activeBranchId) return;
    await get().loadMessages(activeBranchId, messagesCursor);
  },

  // ── Branch operations ─────────────────────────────────────────────────────

  loadBranches: async (sessionId) => {
    try {
      const branches = await api.listBranches(sessionId);
      set((state) => ({
        branches,
        sessions: state.sessions.map((s) =>
          s.sessionId === sessionId ? { ...s, branchCount: branches.length } : s
        ),
      }));
    } catch {
      set({ errorMessage: GENERIC_ERROR });
    }
  },

  forkBranch: async (selectedMsgIds, label?) => {
    const { activeSessionId, activeBranchId } = get();
    if (!activeSessionId || !activeBranchId) return;

    try {
      const newBranch = await api.forkBranch({
        session_id: activeSessionId,
        parent_branch_id: activeBranchId,
        selected_msg_ids: selectedMsgIds,
        label,
      });

      await api.updateSession(activeSessionId, { active_branch_id: newBranch.branchId });

      set((state) => ({
        branches: [...state.branches, newBranch],
        activeBranchId: newBranch.branchId,
        messages: state.messages.filter(m => selectedMsgIds.includes(m.msgId)),
        showBranchModal: false,
        sessions: state.sessions.map((s) =>
          s.sessionId === activeSessionId
            ? { ...s, activeBranchId: newBranch.branchId, branchCount: state.branches.length + 1 }
            : s
        ),
      }));
    } catch {
      set({ errorMessage: GENERIC_ERROR });
    }
  },

  setActiveBranch: async (branchId) => {
    const { activeSessionId } = get();
    // Clear messages immediately so the skeleton shows while the new branch loads
    set({ activeBranchId: branchId, messages: [], isLoadingMessages: true });

    if (activeSessionId) {
      try {
        await api.updateSession(activeSessionId, { active_branch_id: branchId });
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === activeSessionId ? { ...s, activeBranchId: branchId } : s
          ),
        }));
      } catch {
        set({ errorMessage: GENERIC_ERROR });
      }
    }

    await get().loadMessages(branchId);
  },

  // AI Pick — not yet implemented.
  // Idea: POST all messages from the active branch to a dedicated API endpoint,
  // optionally with a user-provided preference string (e.g. "focus on the auth discussion").
  // The AI returns the message IDs it considers most relevant for the branch context.
  // Needs: a new Lambda/API route, prompt design, and a preference input UI in MessageSelector.
  autoSelectMessages: () => [],

  // Cherry Pick — not yet implemented.
  // Idea: let the user browse all branches in the session, select individual messages
  // from any branch (not just the active one), and append them to the current active branch —
  // analogous to `git cherry-pick`. Needs a backend API + a branch/message browser UI.
  cherryPickBranch: () => {},

  // ── Session CRUD ──────────────────────────────────────────────────────────

  newSession: () => {
    const { abortController } = get();
    if (abortController) abortController.abort();
    set({
      activeSessionId: genTempId(),
      activeBranchId: null,
      messages: [],
      branches: [],
      isStreaming: false,
      streamingMessageId: null,
      abortController: null,
      hasMoreMessages: false,
      messagesCursor: null,
    });
  },

  deleteSession: async (sessionId) => {
    const snapshot = get().sessions;

    set((state) => {
      const remaining = state.sessions.filter((s) => s.sessionId !== sessionId);
      const wasActive = state.activeSessionId === sessionId;
      return {
        sessions: remaining,
        ...(wasActive && {
          activeSessionId: null,
          activeBranchId: null,
          messages: [],
          branches: [],
        }),
      };
    });

    try {
      await api.deleteSession(sessionId);
    } catch {
      // Rollback optimistic removal
      set({ sessions: snapshot, errorMessage: GENERIC_ERROR });
    }
  },

  renameSession: async (sessionId, title) => {
    const snapshot = get().sessions;

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId ? { ...s, title } : s
      ),
    }));

    try {
      await api.updateSession(sessionId, { title });
    } catch {
      set({ sessions: snapshot, errorMessage: GENERIC_ERROR });
    }
  },

  // ── Stream handling ───────────────────────────────────────────────────────

  sendMessage: async (prompt: string) => {
    const { activeSessionId, activeBranchId, isStreaming } = get();
    if (isStreaming || !activeSessionId) return;

    const tempUserMsgId = `temp-user-${genTempId()}`;
    const tempAiMsgId = `temp-ai-${genTempId()}`;
    const now = new Date().toISOString();

    const userMsg: Message = {
      msgId: tempUserMsgId,
      sessionId: activeSessionId,
      branchId: activeBranchId ?? '',
      role: 'user',
      content: prompt,
      state: 'active',
      createdAt: now,
      updatedAt: now,
    };
    const aiMsg: Message = {
      msgId: tempAiMsgId,
      sessionId: activeSessionId,
      branchId: activeBranchId ?? '',
      role: 'assistant',
      content: '',
      state: 'active',
      createdAt: new Date(Date.now() + 100).toISOString(),
      updatedAt: new Date(Date.now() + 100).toISOString(),
    };

    const controller = new AbortController();

    set((state) => ({
      messages: [...state.messages, userMsg, aiMsg],
      isStreaming: true,
      streamingMessageId: tempAiMsgId,
      abortController: controller,
    }));

    // Track real IDs as they arrive from the stream
    let realSessionId = activeSessionId;
    let realBranchId = activeBranchId ?? '';

    try {
      await streamChat(
        { prompt, sessionId: activeSessionId, branchId: activeBranchId },
        {
          onMetadata: (sId, bId) => {
            realSessionId = sId;
            realBranchId = bId;
            const isNewSession = get().activeSessionId !== sId;
            set((state) => {
              const updatedMessages = state.messages.map((m) => ({
                ...m,
                sessionId: sId,
                branchId: bId,
              }));
              const newSessions = isNewSession
                ? [
                    {
                      sessionId: sId,
                      userId: '',
                      trunkBranchId: bId,
                      activeBranchId: bId,
                      title: prompt.slice(0, 45) + (prompt.length > 45 ? '…' : ''),
                      createdAt: now,
                      updatedAt: now,
                    } as Session,
                    ...state.sessions,
                  ]
                : state.sessions;
              return {
                activeSessionId: sId,
                activeBranchId: bId,
                messages: updatedMessages,
                sessions: newSessions,
              };
            });
          },

          onUserMessage: (msgId) => {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.msgId === tempUserMsgId
                  ? { ...m, msgId, branchId: realBranchId }
                  : m
              ),
            }));
          },

          onDelta: (text) => {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.msgId === tempAiMsgId
                  ? { ...m, content: (m.content ?? '') + text }
                  : m
              ),
            }));
          },

          onDone: (msgId, msgState, inputTokens, outputTokens) => {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.msgId === tempAiMsgId
                  ? { ...m, msgId, state: msgState, branchId: realBranchId, inputTokens, outputTokens }
                  : m
              ),
              isStreaming: false,
              streamingMessageId: null,
              abortController: null,
            }));

            // Refresh sessions list (updates title, adds new session to sidebar)
            api
              .listSessions()
              .then((result) => {
                useChatStore.setState((state) => ({
                  sessions: result.items.map((s) => ({
                    ...s,
                    branchCount: state.sessions.find((ss) => ss.sessionId === s.sessionId)
                      ?.branchCount,
                  })),
                  hasMoreSessions: result.hasMore,
                  sessionsCursor: result.nextCursor ?? null,
                }));
              })
              .catch(() => useChatStore.setState({ errorMessage: GENERIC_ERROR }));

            // Refresh branches for updated count
            if (realSessionId) {
              api
                .listBranches(realSessionId)
                .then((branches) => {
                  useChatStore.setState((state) => ({
                    branches,
                    sessions: state.sessions.map((s) =>
                      s.sessionId === realSessionId
                        ? { ...s, branchCount: branches.length }
                        : s
                    ),
                  }));
                })
                .catch(() => useChatStore.setState({ errorMessage: GENERIC_ERROR }));
            }
          },

          onError: (message) => {
            set((state) => ({
              messages: state.messages.filter(
                (m) => m.msgId !== tempAiMsgId && m.msgId !== tempUserMsgId
              ),
              isStreaming: false,
              streamingMessageId: null,
              abortController: null,
              errorMessage: message,
            }));
          },
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        set((state) => ({
          messages: state.messages.filter(
            (m) => m.msgId !== tempAiMsgId && m.msgId !== tempUserMsgId
          ),
          isStreaming: false,
          streamingMessageId: null,
          abortController: null,
          errorMessage: GENERIC_ERROR,
        }));
      }
    }
  },

  stopStreaming: async () => {
    const { abortController, messages, streamingMessageId } = get();
    const streamingMsg = messages.find((m) => m.msgId === streamingMessageId);

    if (abortController) abortController.abort();
    set({ isStreaming: false, streamingMessageId: null, abortController: null });

    if (streamingMsg && !streamingMsg.msgId.startsWith('temp-')) {
      try {
        await api.patchMessage(streamingMsg.msgId, { state: 'stopped' });
        set((state) => ({
          messages: state.messages.map((m) =>
            m.msgId === streamingMsg.msgId ? { ...m, state: 'stopped' } : m
          ),
        }));
      } catch {
        // Ignore patch errors on manual stop
      }
    }
  },

  // ── UI state ──────────────────────────────────────────────────────────────

  toggleBranchModal: (show) => set({ showBranchModal: show }),

  dismissError: () => set({ errorMessage: null }),
}));

// ── Selector hooks ────────────────────────────────────────────────────────────

export const useActiveSession = () =>
  useChatStore((state) =>
    state.sessions.find((s) => s.sessionId === state.activeSessionId) ?? null
  );

export const useActiveBranch = () =>
  useChatStore((state) =>
    state.branches.find((b) => b.branchId === state.activeBranchId) ?? null
  );

// Messages are already filtered by branch from the API — no client-side filtering needed
export const useActiveMessages = () =>
  useChatStore(useShallow((state) => state.messages));
