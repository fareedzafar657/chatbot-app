# Frontend Code Review Plan

Step-by-step review order, foundation first.

---

## Phase 1 — Foundation (Data & Types)

**1. `lib/types.ts`**
Start here. Understand core data shapes (`Message`, `Branch`, `Session`, etc.) before reading anything that uses them.

**2. `lib/store.ts`**
The most connected node in the graph (10 edges). The `Chat Store (Zustand)` — central nervous system. Review state shape, selectors (`useActiveSession`, `useActiveBranch`, `useActiveMessages`), and all mutations.

**3. `lib/authStore.ts`**
The second most-connected store. Bridges Settings, API, and Auth. Review after the chat store since it cross-cuts multiple features.

---

## Phase 2 — API & Config Layer

**4. `lib/api.ts`**
The `API Client (axios)` — 8 edges. Review base URL config, request/response interceptors, auth headers, and error handling.

**5. `lib/stream.ts`**
The `streamChat` SSE function. Review how SSE chunks are parsed and pushed into the store.

**6. `lib/amplify.ts`**
AWS Amplify config and initialization. Check for hardcoded values or env var usage.

---

## Phase 3 — App Shell

**7. `app/layout.tsx`**
Root layout — fonts, global providers, metadata.

**8. `app/components/AppProviders.tsx`**
Wraps the app in context/store providers. Review what's scoped globally vs locally.

**9. `app/context/ThemeContext.tsx`**
Theme state. Check if it's consistent with Tailwind config or duplicating it.

---

## Phase 4 — Auth Flow

**10. `app/login/page.tsx`**
Entry point for unauthenticated users. Review Amplify UI usage, redirect logic, and error states.

---

## Phase 5 — Core Chat UI (Highest Complexity)

**11. `app/chat/page.tsx`**
`ChatPage` — 6 edges. Top-level chat route. Review layout composition, session initialization, and routing guards.

**12. `app/components/ChatWindow.tsx`**
`ChatWindow` — 8 edges (tied 2nd most connected). Main feature container. Review `handleSend`, `handleKeyDown`, and how it wires `MessageInput` → `streamChat` → store.

**13. `app/components/MessageInput.tsx`**
Input box logic — submit behavior, keyboard shortcuts, disabled states.

**14. `app/components/MessageList.tsx`**
Renders the conversation. Review scroll behavior and how it maps store messages to bubbles.

**15. `app/components/MessageBubble.tsx`**
Individual message rendering. Check role-based styling and markdown rendering integration.

**16. `app/components/MarkdownRenderer.tsx`**
Isolated node in the graph. Review for XSS risk (raw HTML rendering).

---

## Phase 6 — Branch Feature

**17. `app/components/BranchModal.tsx`**
`BranchModal` — 8 edges, 4 inferred connections. Most complex component after `ChatWindow`. Review branch creation logic and its calls to `useActiveSession` / `useActiveBranch`.

**18. `app/components/BranchTree.tsx`**
`BranchTree` + `layoutBranches()` — layout algorithm for tree visualization (uses `reactflow`). Review `assignPositions`, `buildChildren`, `subtreeWidth`.

**19. `app/components/BranchVersionsView.tsx`**
Branch history/versions view. Review how it reads from the store.

---

## Phase 7 — Supporting UI

**20. `app/components/Sidebar.tsx`**
Session list, navigation. Check for direct store access vs prop drilling.

**21. `app/components/SuggestionChips.tsx`**
Has an inferred connection to the Chat Store — verify whether it actually reads/writes store state or is purely presentational.

**22. `app/components/EmptyState.tsx`**
Likely purely presentational — confirm.

**23. `app/components/TypingIndicator.tsx`**
Has an inferred store connection. Verify if it reads a `isTyping` flag from the store.

**24. `app/components/ErrorToast.tsx`**
Global error display. Check what triggers it and how errors propagate.

---

## Phase 8 — Settings

**25. `app/settings/page.tsx`**
Settings route shell and tab routing.

**26. `app/components/settings/GeneralTab.tsx`**

**27. `app/components/settings/AppearanceTab.tsx`**

**28. `app/components/settings/SecurityTab.tsx`**
Connects to `Auth Store` — check carefully.

**29. `app/components/settings/SpendingTab.tsx`**

**30. `app/components/settings/UsageTab.tsx`**

---

## Review Checklist (apply to every file)

- [ ] Direct store mutations outside of actions
- [ ] Unhandled promise rejections
- [ ] `any` types or missing type annotations
- [ ] Hardcoded strings/values that should be constants
- [ ] Auth checks done in the component instead of middleware
- [ ] `MarkdownRenderer` — check for `dangerouslySetInnerHTML` without sanitization
- [ ] The 4 inferred `BranchModal` edges — verify they're real
- [ ] The 2 inferred `Chat Store` edges (SuggestionChips, TypingIndicator) — verify they're real
