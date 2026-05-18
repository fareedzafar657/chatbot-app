// All API responses pass through a snake_case → camelCase transformer in lib/api.ts,
// so these types use camelCase even though the backend sends snake_case.
// Request payload types (ForkBranchRequest, etc.) are the exception — they are
// sent directly to the API and must stay snake_case.

export interface Message {
  msgId: string;
  sessionId: string;
  branchId: string;
  role: 'user' | 'assistant';
  /** null when the message is deleted or not yet streamed */
  content: string | null;
  state: 'active' | 'stopped' | 'edited' | 'deleted';
  /** absent on optimistic local messages created before the server responds */
  userId?: string;
  parentMsgId?: string;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: string;
  updatedAt: string;
  // Local-only — not from API
  isStreaming?: boolean;
}

export interface Branch {
  branchId: string;
  sessionId: string;
  parentBranchId?: string;
  parentMsgId?: string;
  /** Message IDs carried over from the parent branch when forking */
  selectedMsgIds: string[];
  label: string;
  createdAt: string;
  // Local-only — not from API
  description?: string;
  messageCount?: number;
}

export interface Session {
  sessionId: string;
  userId: string;
  trunkBranchId: string;
  activeBranchId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  // TODO(backend): should come from GET /sessions once backend includes branch_count in the list response.
  // Currently populated client-side only after loadBranches() is called on session open.
  branchCount?: number;
}

export interface PaginatedMessages {
  items: Message[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginatedSessions {
  items: Session[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ─── API request payloads (snake_case — sent directly to the backend) ────────

export interface UpdateSessionRequest {
  title?: string;
  active_branch_id?: string;
}

export interface PatchMessageRequest {
  state?: Message['state'];
  content?: string;
}

export interface ForkBranchRequest {
  session_id: string;
  parent_branch_id: string;
  parent_msg_id?: string;
  selected_msg_ids: string[];
  label?: string;
}

export interface CherryPickRequest {
  source_msg_ids: string[];
}

export interface CherryPickResponse {
  branch: Branch;
  newMessages: Message[];
}

// ─── Usage stats ──────────────────────────────────────────────────────────────

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
}

export interface ModelBreakdown {
  modelId: string;
  tokenCount: number;
  percentage: number;
}

export interface UsageStats {
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  dailyUsage: DailyUsage[];
  modelBreakdown: ModelBreakdown[];
}
