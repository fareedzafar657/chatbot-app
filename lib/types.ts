export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Branch {
  id: string;
  name: string;
  parentBranchId: string | null;
  messageIds: string[];
  createdAt: Date;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  branches: Branch[];
  activeBranchId: string;
  createdAt: Date;
  updatedAt: Date;
}
