import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Session, Message, Branch } from './types';
import { initialSessions, AI_RESPONSES } from './mockData';

let idCounter = 1000;
const genId = () => `id-${++idCounter}-${Date.now()}`;

// Module-level streaming interval (outside React lifecycle)
let streamingInterval: ReturnType<typeof setInterval> | null = null;
let aiResponseIndex = 0;

interface ChatState {
  sessions: Session[];
  activeSessionId: string;
  isStreaming: boolean;
  streamingMessageId: string | null;
  showBranchModal: boolean;
}

interface ChatActions {
  setActiveSession: (id: string) => void;
  newSession: () => void;
  deleteSession: (id: string) => void;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  setStreaming: (streaming: boolean) => void;
  addMessage: (sessionId: string, message: Message) => void;
  appendToLastMessage: (sessionId: string, messageId: string, content: string) => void;
  toggleBranchModal: (show: boolean) => void;
  forkBranch: (name: string, messageIds: string[]) => void;
  setActiveBranch: (branchId: string) => void;
}

export type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: initialSessions,
  activeSessionId: 'session-1',
  isStreaming: false,
  streamingMessageId: null,
  showBranchModal: false,

  setActiveSession: (id) => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
      streamingInterval = null;
    }
    set({ activeSessionId: id, isStreaming: false, streamingMessageId: null });
  },

  newSession: () => {
    const id = genId();
    const branchId = genId();
    const now = new Date();
    const session: Session = {
      id,
      title: 'New Conversation',
      activeBranchId: branchId,
      branches: [
        {
          id: branchId,
          name: 'main',
          parentBranchId: null,
          messageIds: [],
          createdAt: now,
        },
      ],
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: id,
    }));
  },

  deleteSession: (id) => {
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id);
      return {
        sessions: remaining,
        activeSessionId:
          state.activeSessionId === id
            ? remaining[0]?.id ?? ''
            : state.activeSessionId,
      };
    });
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  addMessage: (sessionId, message) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      ),
    }));
  },

  appendToLastMessage: (sessionId, messageId, content) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, content } : m
          ),
        };
      }),
    }));
  },

  sendMessage: (content) => {
    const { activeSessionId, isStreaming, sessions } = get();
    if (isStreaming || !activeSessionId) return;

    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession) return;

    const userMsgId = genId();
    const aiMsgId = genId();
    const now = new Date();

    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: now,
    };
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(now.getTime() + 100),
    };

    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          title:
            s.messages.length === 0
              ? content.slice(0, 45) + (content.length > 45 ? '...' : '')
              : s.title,
          messages: [...s.messages, userMsg, aiMsg],
          branches: s.branches.map((b) =>
            b.id === s.activeBranchId
              ? { ...b, messageIds: [...b.messageIds, userMsgId, aiMsgId] }
              : b
          ),
          updatedAt: now,
        };
      }),
      isStreaming: true,
      streamingMessageId: aiMsgId,
    }));

    const responseIdx = aiResponseIndex % AI_RESPONSES.length;
    aiResponseIndex++;
    const fullResponse = AI_RESPONSES[responseIdx];
    let charIndex = 0;
    const capturedSessionId = activeSessionId;

    streamingInterval = setInterval(() => {
      const step = Math.floor(Math.random() * 6) + 3;
      charIndex = Math.min(charIndex + step, fullResponse.length);

      set((state) => ({
        sessions: state.sessions.map((s) => {
          if (s.id !== capturedSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: fullResponse.slice(0, charIndex) }
                : m
            ),
          };
        }),
      }));

      if (charIndex >= fullResponse.length) {
        clearInterval(streamingInterval!);
        streamingInterval = null;
        set({ isStreaming: false, streamingMessageId: null });
      }
    }, 25);
  },

  stopStreaming: () => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
      streamingInterval = null;
    }
    set({ isStreaming: false, streamingMessageId: null });
  },

  toggleBranchModal: (show) => set({ showBranchModal: show }),

  forkBranch: (name, messageIds) => {
    const { activeSessionId, sessions } = get();
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession) return;

    const branchId = genId();
    const now = new Date();
    const newBranch: Branch = {
      id: branchId,
      name,
      parentBranchId: activeSession.activeBranchId,
      messageIds,
      createdAt: now,
    };

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              branches: [...s.branches, newBranch],
              activeBranchId: branchId,
              updatedAt: now,
            }
          : s
      ),
      showBranchModal: false,
    }));
  },

  setActiveBranch: (branchId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === state.activeSessionId
          ? { ...s, activeBranchId: branchId }
          : s
      ),
    }));
  },
}));

// Selector hooks for derived state
export const useActiveSession = () =>
  useChatStore((state) =>
    state.sessions.find((s) => s.id === state.activeSessionId) ?? null
  );

export const useActiveBranch = () =>
  useChatStore((state) => {
    const session = state.sessions.find((s) => s.id === state.activeSessionId);
    if (!session) return null;
    return session.branches.find((b) => b.id === session.activeBranchId) ?? null;
  });

export const useActiveMessages = () =>
  useChatStore(
    useShallow((state) => {
      const session = state.sessions.find((s) => s.id === state.activeSessionId);
      if (!session) return [] as Message[];
      const branch = session.branches.find(
        (b) => b.id === session.activeBranchId
      );
      if (!branch) return [] as Message[];
      const ids = new Set(branch.messageIds);
      return session.messages
        .filter((m) => ids.has(m.id))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    })
  );
