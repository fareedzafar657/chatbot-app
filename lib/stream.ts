import type { Message } from './types';

const STREAMING_URL = process.env.NEXT_PUBLIC_STREAMING_LAMBDA_URL!;
const STREAM_TIMEOUT_MS = 30_000;

interface StreamParams {
  prompt: string;
  sessionId: string;
  branchId: string | null;
}

interface StreamCallbacks {
  onMetadata(sessionId: string, branchId: string): void;
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
  const token = await useAuthStore.getState().getAccessToken();

  const timeoutSignal = AbortSignal.timeout(STREAM_TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

  let response: Response;
  try {
    response = await fetch(STREAMING_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        sessionId: params.sessionId,
        branchId: params.branchId,
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
          switch (event.type) {
            case 'metadata':
              callbacks.onMetadata(event.sessionId, event.branchId);
              break;
            case 'userMessage':
              callbacks.onUserMessage(event.msgId);
              break;
            case 'delta':
              callbacks.onDelta(event.text);
              break;
            case 'done':
              callbacks.onDone(event.msgId, event.state, event.inputTokens, event.outputTokens);
              break;
            case 'error':
              callbacks.onError(event.message);
              break;
          }
        } catch {
          // Skip malformed NDJSON lines
        }
      }
    }

    // Flush any remaining buffer content
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer.trim());
        if (event.type === 'done') {
          callbacks.onDone(event.msgId, event.state, event.inputTokens, event.outputTokens);
        } else if (event.type === 'error') {
          callbacks.onError(event.message);
        }
      } catch {
        // Ignore
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      callbacks.onError((err as Error).message);
    }
  }
}
