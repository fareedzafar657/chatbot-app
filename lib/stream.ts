import type { Message } from '@/shared/types';

const STREAMING_URL = process.env.NEXT_PUBLIC_STREAMING_LAMBDA_URL!;
const STREAM_TIMEOUT_MS = 30_000;
const GENERIC_STREAM_ERROR = 'Something went wrong. Please try again.';

interface StreamParams {
  prompt: string;
  sessionId: string;
  branchId: string | null;
  apiKey?: string | null;
  provider?: 'anthropic' | 'gemini' | null;
  model?: string | null;
  systemPrompt?: string | null;
}

interface StreamCallbacks {
  onMetadata(sessionId: string, branchId: string, modelId: string): void;
  onUserMessage(msgId: string): void;
  onDelta(text: string): void;
  onDone(msgId: string, state: Message['state'], inputTokens: number, outputTokens: number): void;
  onError(message: string): void;
}

export async function streamChat(
  params: StreamParams,
  callbacks: StreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  const { useAuthStore } = await import('./authStore');

  // Fetch the ID token only when a non-BYOK model is explicitly selected — the backend
  // uses it solely to verify the user is on the demo allowlist (extractEmail in the
  // streaming Lambda is optional and never blocks the request). Mirrors compactBranch.
  const needsIdToken = !params.provider && Boolean(params.model);
  const [token, idToken] = await Promise.all([
    useAuthStore.getState().getAccessToken(),
    needsIdToken ? useAuthStore.getState().getIdToken() : Promise.resolve(null),
  ]);

  const timeoutSignal = AbortSignal.timeout(STREAM_TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

  let response: Response;
  try {
    response = await fetch(STREAMING_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(idToken && { 'X-Id-Token': idToken }),
      },
      body: JSON.stringify({
        prompt:    params.prompt,
        sessionId: params.sessionId,
        branchId:  params.branchId,
        ...(params.apiKey       && { apiKey:       params.apiKey }),
        ...(params.provider     && { provider:     params.provider }),
        ...(params.model        && { model:        params.model }),
        ...(params.systemPrompt && { systemPrompt: params.systemPrompt }),
      }),
      signal: combinedSignal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    console.error('[stream] fetch failed', err);
    callbacks.onError('Request failed. Please try again.');
    return;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) ?? await response.text().catch(() => '');
    const detail = typeof body === 'object' ? (body?.detail ?? body?.message) : body;
    console.error('[stream] request failed', { status: response.status, detail });

    const userMessage =
      response.status === 401 ? 'Your session has expired. Please sign in again.' :
      response.status === 403 ? 'You do not have permission to perform this action.' :
      response.status >= 500  ? 'Something went wrong on our end. Please try again.' :
                                 'Request failed. Please try again.';

    callbacks.onError(userMessage);
    return;
  }

  if (!response.body) {
    callbacks.onError('No response body');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) chunk in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          dispatchEvent(event, callbacks);
        } catch {
          // A single corrupt/partial line shouldn't abort the stream; warn in dev so
          // protocol drift is diagnosable, then continue with the next line.
          console.warn('[stream] skipping unparseable line', trimmed);
        }
      }
    }

    // Flush any remaining buffer content (a final line without a trailing newline)
    if (buffer.trim()) {
      try {
        dispatchEvent(JSON.parse(buffer.trim()), callbacks);
      } catch {
        console.warn('[stream] skipping unparseable trailing buffer', buffer.trim());
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('[stream] read failed', err);
      callbacks.onError(GENERIC_STREAM_ERROR);
    }
  }
}

// ─── Event dispatch ───────────────────────────────────────────────────────────

interface StreamEvent {
  type?: string;
  sessionId?: string;
  branchId?: string;
  modelId?: string;
  msgId?: string;
  text?: string;
  state?: Message['state'];
  inputTokens?: number;
  outputTokens?: number;
  message?: string;
}

// Validates each event against the streaming Lambda's NDJSON contract before invoking the
// typed callbacks. The backend guarantees these fields, so a missing one means a corrupt or
// drifted payload — we drop the malformed event rather than forward `undefined` into the UI.
function dispatchEvent(event: StreamEvent, callbacks: StreamCallbacks): void {
  switch (event.type) {
    case 'metadata':
      if (event.sessionId && event.branchId) {
        callbacks.onMetadata(event.sessionId, event.branchId, event.modelId ?? '');
      }
      break;
    case 'userMessage':
      if (event.msgId) callbacks.onUserMessage(event.msgId);
      break;
    case 'delta':
      if (typeof event.text === 'string') callbacks.onDelta(event.text);
      break;
    case 'done':
      // state is always present on a real 'done'; msgId may be null when the model produced
      // no assistant text — still finalize so isStreaming is cleared either way.
      if (event.state) {
        callbacks.onDone(event.msgId ?? '', event.state, event.inputTokens ?? 0, event.outputTokens ?? 0);
      }
      break;
    case 'error':
      // Don't surface the backend's raw error string to the user — log it for operators
      // and show generic copy (mirrors the HTTP error handling above).
      console.error('[stream] server error event', event.message);
      callbacks.onError(GENERIC_STREAM_ERROR);
      break;
  }
}
