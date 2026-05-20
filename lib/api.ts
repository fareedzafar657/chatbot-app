import axios from 'axios';
import type {
  Session,
  Branch,
  Message,
  PaginatedSessions,
  PaginatedMessages,
  ForkBranchRequest,
  CherryPickRequest,
  CherryPickResponse,
  CompactRequest,
  CompactResponse,
  DeleteCompactionResponse,
  UpdateSessionRequest,
  PatchMessageRequest,
  UsageStats,
} from '@/shared/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─── snake_case → camelCase transformer ──────────────────────────────────────

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        transformKeys(v),
      ])
    );
  }
  return obj;
}

// ─── Axios client ─────────────────────────────────────────────────────────────

const client = axios.create({ baseURL: BASE_URL, timeout: 20000 });

// Attach Cognito access token to every request
client.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('./authStore');
  const token = await useAuthStore.getState().getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Transform all responses from snake_case → camelCase + global 401 handler
client.interceptors.response.use(
  (res) => {
    res.data = transformKeys(res.data);
    return res;
  },
  async (err) => {
    const status = err.response?.status;

    if (status === 401) {
      const { useAuthStore } = await import('./authStore');
      await useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Map status codes to user-safe messages; log detail for debugging only
    const detail = err.response?.data?.detail ?? err.response?.data?.message ?? err.message;
    console.error('[api] request failed', { status, detail });

    const userMessage =
      status === 403 ? 'You do not have permission to perform this action.' :
      status === 404 ? 'The requested resource was not found.' :
      status === 422 ? 'Invalid request. Please check your input.' :
      status >= 500  ? 'Something went wrong on our end. Please try again.' :
                       'Request failed. Please try again.';

    throw new Error(userMessage);
  }
);

// ─── API methods ──────────────────────────────────────────────────────────────

export const api = {
  listSessions: (cursor?: string): Promise<PaginatedSessions> =>
    client
      .get('/sessions', { params: { page_size: 20, ...(cursor ? { cursor } : {}) } })
      .then((r) => r.data),

  getSession: (sessionId: string): Promise<Session> =>
    client.get(`/sessions/${sessionId}`).then((r) => r.data),

  updateSession: (sessionId: string, data: UpdateSessionRequest): Promise<Session> =>
    client.patch(`/sessions/${sessionId}`, data).then((r) => r.data),

  deleteSession: (sessionId: string): Promise<void> =>
    client.delete(`/sessions/${sessionId}`).then(() => undefined),

  listBranches: (sessionId: string): Promise<Branch[]> =>
    client.get(`/branches/session/${sessionId}`).then((r) => r.data),

  getBranch: (branchId: string): Promise<Branch> =>
    client.get(`/branches/${branchId}`).then((r) => r.data),

  forkBranch: (data: ForkBranchRequest): Promise<Branch> =>
    client.post('/branches/fork', data).then((r) => r.data),

  cherryPick: (branchId: string, data: CherryPickRequest): Promise<CherryPickResponse> =>
    client.post(`/branches/${branchId}/cherry-pick`, data).then((r) => r.data),

  compact: (branchId: string, data: CompactRequest): Promise<CompactResponse> =>
    client.post(`/branches/${branchId}/compact`, data, { timeout: 60000 }).then((r) => r.data),

  deleteCompaction: (branchId: string, summaryMsgId: string): Promise<DeleteCompactionResponse> =>
    client.delete(`/branches/${branchId}/compact/${summaryMsgId}`).then((r) => r.data),

  listMessages: (branchId: string, cursor?: string, pageSize = 20): Promise<PaginatedMessages> =>
    client
      .get(`/messages/branch/${branchId}`, {
        params: { page_size: pageSize, ...(cursor ? { cursor } : {}) },
      })
      .then((r) => r.data),

  patchMessage: (msgId: string, data: PatchMessageRequest): Promise<Message> =>
    client.patch(`/messages/${msgId}`, data).then((r) => r.data),

  getUsageStats: (): Promise<UsageStats> =>
    client.get('/sessions/usage/stats').then((r) => r.data),
};