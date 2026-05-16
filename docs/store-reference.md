# Chat Store Reference

Global state lives in `lib/store.ts` (Zustand). This document describes every field — what it holds, who sets it, who reads it, and what null/false means.

---

## Sessions

### `sessions: Session[]`
The full list of sessions belonging to the current user, ordered newest-first.
- **Set by:** `initSessions` (full replace), `loadMoreSessions` (append), `onMetadata` in `sendMessage` (prepend new session), `renameSession`, `deleteSession`, `forkBranch`, `setActiveBranch`, `onDone` in `sendMessage` (full replace from API refresh)
- **Read by:** sidebar session list, `setActiveSession`, `deleteSession`, `renameSession`
- **Empty (`[]`):** sessions haven't loaded yet, or the user has no sessions

### `activeSessionId: string | null`
The session currently open in the chat window.
- **Set by:** `newSession` (temp UUID), `setActiveSession`, `onMetadata` in `sendMessage` (real server ID replaces temp), `deleteSession` (→ null if deleted session was active)
- **Read by:** `sendMessage`, `setActiveBranch`, `forkBranch`, `ChatWindow`, `SessionPage`, sidebar highlight
- **null:** no session is open (e.g. user just loaded the app, or deleted the active session)

### `activeBranchId: string | null`
The branch currently being viewed within `activeSessionId`.
- **Set by:** `newSession` (→ null), `setActiveSession` (→ session's `activeBranchId`), `onMetadata` in `sendMessage` (real branch ID), `setActiveBranch`, `forkBranch`, `deleteSession` (→ null)
- **Read by:** `sendMessage`, `loadMoreMessages`, `loadMessages` (staleness guard), `ChatWindow`
- **null:** no branch yet — happens during new-chat flow before the first message completes

---

## Messages & Branches

### `messages: Message[]`
The ordered message list for the current branch, oldest-first. Includes optimistic (temp) messages during streaming.
- **Set by:** `setActiveSession` (→ []), `setActiveBranch` (→ []), `newSession` (→ []), `loadMessages` (replace or prepend for pagination), `sendMessage` (append temp pair, then patch real IDs), `stopStreaming` (patches state), `onError` / catch in `sendMessage` (removes temp pair)
- **Read by:** `ChatWindow` via `useActiveMessages`, `stopStreaming`
- **Empty (`[]`):** session/branch cleared but not yet loaded, or session has no messages

### `branches: Branch[]`
All branches for `activeSessionId`.
- **Set by:** `setActiveSession` (→ []), `newSession` (→ []), `loadBranches` (replace), `forkBranch` (append), `onDone` in `sendMessage` (replace from API refresh)
- **Read by:** `ChatWindow` (branch count, active branch label), `BranchModal`
- **Empty (`[]`):** session cleared or branches haven't loaded yet

---

## Streaming

### `isStreaming: boolean`
True while a stream response is in flight (from `sendMessage` call until `onDone`, `onError`, `stopStreaming`, or catch).
- **Set by:** `sendMessage` (→ true on start, → false on done/error/catch), `stopStreaming` (→ false), `setActiveSession` (→ false)
- **Read by:** `MessageInput` (disables input, shows stop button), `ChatWindow` (shows generating indicator), `sendMessage` guard (prevents double-send)
- **false:** no stream running

### `streamingMessageId: string | null`
The `msgId` of the assistant message currently being streamed (starts as a temp ID, replaced by real ID on `onDone`).
- **Set by:** `sendMessage` (→ temp ID on start, → null on done/error/catch), `stopStreaming` (→ null), `setActiveSession` (→ null)
- **Read by:** `ChatWindow` passes to `MessageList` to show the streaming cursor on the right bubble
- **null:** no stream running

### `abortController: AbortController | null`
The controller for the current fetch. Calling `.abort()` cancels the stream.
- **Set by:** `sendMessage` (→ new controller on start, → null on done/error/catch), `stopStreaming` (aborts then → null), `setActiveSession` (aborts then → null), `newSession` (aborts then → null)
- **Read by:** `stopStreaming`, `setActiveSession`, `newSession` (all abort before reassigning)
- **null:** no stream running

---

## Loading Flags

### `isLoadingSessions: boolean`
True while `initSessions` is fetching the session list. Starts as `true` so the app shows a loader before the first fetch completes.
- **Set by:** `initSessions` (→ true then → false)
- **Read by:** `SessionPage` (shows `<PageLoader />`), `ChatSidebarMiddle` (shows spinner row), layout auth guard
- **Initial value `true`:** prevents flash of empty sidebar on load

### `isLoadingMessages: boolean`
True while `loadMessages` is fetching messages for the active branch.
- **Set by:** `setActiveSession` (→ true), `setActiveBranch` (→ true), `loadMessages` (→ true then → false)
- **Read by:** `MessageList` (shows skeleton when true and messages are empty)
- **false:** messages are loaded or there are none

---

## Pagination

### `hasMoreMessages: boolean` / `messagesCursor: string | null`
Controls the "load older messages" behaviour. `messagesCursor` is the opaque token from the API for the next page.
- **Set by:** `loadMessages` (both fields), `setActiveSession` / `setActiveBranch` / `newSession` (reset to false/null)
- **Read by:** `loadMoreMessages`, `MessageList` (shows "load more" trigger)

### `hasMoreSessions: boolean` / `sessionsCursor: string | null`
Controls the "load more sessions" behaviour in the sidebar.
- **Set by:** `initSessions`, `loadMoreSessions`, `onDone` in `sendMessage` (session refresh)
- **Read by:** `loadMoreSessions`, `ChatSidebarMiddle` (shows "Load more" button)

---

## UI State

### `showBranchModal: boolean`
Controls visibility of the `BranchModal` overlay.
- **Set by:** `toggleBranchModal`, `forkBranch` (→ false on success)
- **Read by:** `SessionPage` (conditionally renders `<BranchModal />`)

### `errorMessage: string | null`
Generic error string shown to the user via a toast or banner. Always a user-safe message — never raw API/server detail.
- **Set by:** almost every async action on failure (always set to `GENERIC_ERROR` constant), `sendMessage` `onError` callback, `dismissError` (→ null)
- **Read by:** app-level error display (toast/banner component)
- **null:** no error to show
