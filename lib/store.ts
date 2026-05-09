import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Session, Message, Branch } from './types';
import { api } from './api';
import { streamChat } from './stream';

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
  setStreaming(streaming: boolean): void;
  addMessage(sessionId: string, message: Message): void;
  appendToLastMessage(sessionId: string, messageId: string, content: string): void;
  toggleBranchModal(show: boolean): void;
  forkBranch(selectedMsgIds: string[], label?: string): void;
  setActiveBranch(branchId: string): void;
  autoSelectMessages(): string[];
  cherryPickBranch(selectedMsgIds: string[], branchName: string): void;
  dismissError(): void;
}

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeBranchId: null,
  messages: [],
  branches: [],
  isStreaming: false,
  streamingMessageId: null,
  isLoadingSessions: false,
  isLoadingMessages: false,
  showBranchModal: false,
  hasMoreMessages: false,
  messagesCursor: null,
  abortController: null,
  errorMessage: null,
  hasMoreSessions: false,
  sessionsCursor: null,

  initSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const result = await api.listSessions();
      set({
        sessions: result.items,
        hasMoreSessions: result.has_more,
        sessionsCursor: result.next_cursor ?? null,
        isLoadingSessions: false,
      });
      const { activeSessionId } = get();
      if (!activeSessionId) {
        // Always start with a new session, regardless of existing sessions
        get().newSession();
      }
    } catch (err) {
      set({ isLoadingSessions: false, errorMessage: (err as Error).message });
      // Even on error, ensure there's a session to work with
      const { activeSessionId } = get();
      if (!activeSessionId) {
        get().newSession();
      }
    }
  },

  loadMoreSessions: async () => {
    const { sessionsCursor, sessions } = get();
    if (!sessionsCursor) return;
    try {
      const result = await api.listSessions(sessionsCursor);
      set({
        sessions: [...sessions, ...result.items],
        hasMoreSessions: result.has_more,
        sessionsCursor: result.next_cursor ?? null,
      });
    } catch (err) {
      set({ errorMessage: (err as Error).message });
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
    });

    get().loadMessages(session.activeBranchId);
    get().loadBranches(sessionId);
  },

  loadMessages: async (branchId, cursor?) => {
    set({ isLoadingMessages: true });
    try {
      const result = await api.listMessages(branchId, cursor);
      set((state) => ({
        // Cursor-based pagination: prepend older messages at the top
        messages: cursor ? [...result.items, ...state.messages] : result.items,
        hasMoreMessages: result.has_more,
        messagesCursor: result.next_cursor ?? null,
        isLoadingMessages: false,
      }));
    } catch (err) {
      set({ isLoadingMessages: false, errorMessage: (err as Error).message });
    }
  },

  loadMoreMessages: async () => {
    const { messagesCursor, activeBranchId } = get();
    if (!messagesCursor || !activeBranchId) return;
    await get().loadMessages(activeBranchId, messagesCursor);
  },

  loadBranches: async (sessionId) => {
    try {
      const branches = await api.listBranches(sessionId);
      set((state) => ({
        branches,
        sessions: state.sessions.map((s) =>
          s.sessionId === sessionId ? { ...s, branchCount: branches.length } : s
        ),
      }));
    } catch (err) {
      set({ errorMessage: (err as Error).message });
    }
  },

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
    // Optimistic removal
    set((state) => {
      const remaining = state.sessions.filter((s) => s.sessionId !== sessionId);
      const wasActive = state.activeSessionId === sessionId;
      return {
        sessions: remaining,
        ...(wasActive && {
          activeSessionId: remaining[0]?.sessionId ?? null,
          activeBranchId: remaining[0]?.activeBranchId ?? null,
          messages: [],
          branches: [],
        }),
      };
    });

    // Load the new active session's data if we switched
    const { activeSessionId } = get();
    if (activeSessionId && activeSessionId !== sessionId) {
      const session = get().sessions.find((s) => s.sessionId === activeSessionId);
      if (session) {
        get().loadMessages(session.activeBranchId);
        get().loadBranches(activeSessionId);
      }
    }

    try {
      await api.deleteSession(sessionId);
    } catch (err) {
      set({ errorMessage: (err as Error).message });
    }
  },

  renameSession: async (sessionId, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionId === sessionId ? { ...s, title } : s
      ),
    }));

    try {
      await api.updateSession(sessionId, { title });
    } catch (err) {
      set({ errorMessage: (err as Error).message });
    }
  },

  sendMessage: async (prompt) => {
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
            set((state) => {
              const isNewSession = state.activeSessionId !== sId;
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
                  ? { ...m, content: m.content + text }
                  : m
              ),
            }));
          },

          onDone: (msgId, msgState) => {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.msgId === tempAiMsgId
                  ? { ...m, msgId, state: msgState as Message['state'], branchId: realBranchId }
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
                  hasMoreSessions: result.has_more,
                  sessionsCursor: result.next_cursor ?? null,
                }));
              })
              .catch(() => {});

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
                .catch(() => {});
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
          errorMessage: (err as Error).message,
        }));
      }
    }
  },

  stopStreaming: async () => {
    const { abortController, messages } = get();
    const streamingMsg = [...messages].reverse().find((m) => m.role === 'assistant');

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

  // Legacy stubs — kept so no component imports break
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setStreaming: (_s: boolean) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addMessage: (_sid: string, _msg: Message) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendToLastMessage: (_sid: string, _mid: string, _c: string) => {},

  toggleBranchModal: (show) => set({ showBranchModal: show }),

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
    } catch (err) {
      set({ errorMessage: (err as Error).message });
    }
  },

  setActiveBranch: async (branchId) => {
    const { activeSessionId } = get();
    set({ activeBranchId: branchId });

    if (activeSessionId) {
      try {
        await api.updateSession(activeSessionId, { active_branch_id: branchId });
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === activeSessionId ? { ...s, activeBranchId: branchId } : s
          ),
        }));
      } catch (err) {
        set({ errorMessage: (err as Error).message });
      }
    }

    await get().loadMessages(branchId);
  },

  autoSelectMessages: () => {
    const { messages } = get();
    const selected = new Set<string>();

    const first2 = messages.slice(0, 2).map((m) => m.msgId);
    first2.forEach((id) => selected.add(id));

    const last4 = messages.slice(-4).map((m) => m.msgId);
    last4.forEach((id) => selected.add(id));

    messages.forEach((m) => {
      if (m.role === 'assistant' && m.content.length > 400) {
        selected.add(m.msgId);
      }
      if (m.role === 'user' && m.content.includes('?')) {
        selected.add(m.msgId);
      }
    });

    return Array.from(selected);
  },

  cherryPickBranch: (selectedMsgIds, branchName) => {
    const { activeSessionId, activeBranchId, branches, messages } = get();
    if (!activeSessionId || !activeBranchId) return;

    const activeBranch = branches.find((b) => b.branchId === activeBranchId);
    if (!activeBranch) return;

    const newBranchId = genTempId();
    const now = new Date().toISOString();

    const newBranch: Branch = {
      branchId: newBranchId,
      sessionId: activeSessionId,
      parentBranchId: activeBranchId,
      parentMsgId: selectedMsgIds[0],
      selectedMsgIds,
      label: branchName,
      description: `Cherry-picked from ${activeBranch.label}`,
      createdAt: now,
    };

    const filteredMessages = messages.filter((m) => selectedMsgIds.includes(m.msgId));

    set((state) => ({
      branches: [...state.branches, newBranch],
      activeBranchId: newBranchId,
      messages: filteredMessages,
      showBranchModal: false,
    }));
  },

  dismissError: () => set({ errorMessage: null }),
}));

// ---------------------------------------------------------------------------
// Selector hooks — same names as before so no component changes needed
// ---------------------------------------------------------------------------

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
