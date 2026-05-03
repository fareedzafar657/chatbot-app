export interface Message {
  msgId: string;
  sessionId: string;
  branchId: string;
  role: 'user' | 'assistant';
  content: string;
  state: 'active' | 'stopped' | 'edited' | 'deleted';
  createdAt: string;
  updatedAt: string;
  parentMsgId?: string;
}

export interface Branch {
  branchId: string;
  sessionId: string;
  parentBranchId?: string;
  parentMsgId?: string;
  selectedMsgIds: string[];
  label: string;
  createdAt: string;
}

export interface Session {
  sessionId: string;
  userId: string;
  trunkBranchId: string;
  activeBranchId: string;
  title?: string;
  /** Populated locally after loadBranches — used for sidebar display */
  branchCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMessages {
  items: Message[];
  has_more: boolean;
  next_cursor?: string;
}

export interface PaginatedSessions {
  items: Session[];
  has_more: boolean;
  next_cursor?: string;
}

export interface ForkBranchRequest {
  session_id: string;
  parent_branch_id: string;
  parent_msg_id?: string;
  selected_msg_ids: string[];
  label?: string;
}
