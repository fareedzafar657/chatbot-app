import axios from 'axios';
import type {
  Session,
  Branch,
  Message,
  PaginatedSessions,
  PaginatedMessages,
  ForkBranchRequest,
  UpdateSessionRequest,
  PatchMessageRequest,
  UsageStats,
} from './types';

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
    if (err.response?.status === 401) {
      const { useAuthStore } = await import('./authStore');
      await useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    const detail = err.response?.data?.detail ?? err.response?.data?.message ?? err.message;
    // FastAPI 422 validation errors return detail as an array of objects
    const message = Array.isArray(detail)
      ? detail.map((d) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('; ')
      : typeof detail === 'string' ? detail : JSON.stringify(detail);
    throw new Error(message);
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

  listMessages: (branchId: string, cursor?: string): Promise<PaginatedMessages> =>
    client
      .get(`/messages/branch/${branchId}`, {
        params: { page_size: 50, ...(cursor ? { cursor } : {}) },
      })
      .then((r) => r.data),

  patchMessage: (msgId: string, data: PatchMessageRequest): Promise<Message> =>
    client.patch(`/messages/${msgId}`, data).then((r) => r.data),

  getUsageStats: (): Promise<UsageStats> =>
    client.get('/sessions/usage/stats').then((r) => r.data),
};