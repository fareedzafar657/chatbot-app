# K-AI Chatbot — Project Rules

> This file is the single source of truth for how to work in this codebase.
> Read it before adding features, changing architecture, or creating new files.

---

## Stack & Entry Points

- **Framework:** Next.js 14 App Router — pages live in `app/`, root layout in `app/layout.tsx`
- **State:** Zustand — `lib/store.ts` (chat), `lib/authStore.ts` (auth). Never use `useReducer` or React context for global state.
- **Auth:** AWS Cognito via Amplify (`lib/amplify.ts`). Call Cognito directly from the frontend for user-pool operations (`signIn`, `signOut`, `updatePassword`, `updateUserAttributes`). Use backend proxy only for admin-level operations.
- **API:** `lib/api.ts` wraps every backend call. Never call `fetch` or `axios` directly from components.
- **Streaming:** `lib/stream.ts` — uses `fetch` + `ReadableStream` to parse the NDJSON token stream from the streaming Lambda (`application/x-ndjson`, one JSON object per `\n`-delimited line; not SSE). Don't add new streaming logic inline in components.

---

## Styling Rules

- Always use `cn()` from `lib/cn.ts` for conditional `className` — never template literal ternaries (`` `${condition ? 'a' : 'b'}` ``).
- Never use `style={{}}` for values Tailwind can express (font sizes, weights, colors).
- Shared component-layer utilities live in `app/globals.css` under `@layer components`. The `.input-field` class is already defined there — use it for standard text inputs. Add new shared classes here rather than repeating them inline.
- All structural JSX sections get a navigation comment: `{/* Header */}`, `{/* Sidebar */}`, `{/* Actions */}`, etc.

---

## Component Rules

- `'use client'` only when the component uses hooks (`useState`, `useEffect`, `useRef`, `useId`, event handlers, context) or browser APIs. Pure renders don't need it.
- Type-only imports: `import { type Foo }` — never `import React` just for namespace access.
- Non-null assert `!` on store selectors when the parent route already guarantees the value (e.g. `useAuthStore((s) => s.user)!` inside a page that redirects when `!user`).
- Check these locations before creating new components:
  - `app/components/common/` — generic shared components (`Spinner` is already here)
  - `app/components/settings/Section.tsx` — layout wrapper for settings tab sections
  - `app/components/sidebar/SidebarUserFooter.tsx` — user avatar/name/email/logout; used by both sidebars

---

## Shared Hooks

- `lib/hooks.ts` — shared React hooks:
  - `useCopyToClipboard()` — returns `[copyState, copy]`; used by `MessageBubble` and `MarkdownRenderer`'s `CodeBlock`

---

## State & Data Rules

- **Optimistic updates:** always snapshot state before mutating; restore on API failure (see `deleteSession`, `renameSession` in `lib/store.ts` for the pattern).
- **Error messages shown to users must be generic** — never `(err as Error).message` in `set({ errorMessage })`. Use the `GENERIC_ERROR` constant in `lib/store.ts`.
- **No unconfirmed fallbacks** (`?? 0`, `?? ''`) for values that come from the API — show an explicit empty/loading/error state instead.
- **Every promise must either surface its error or document why it's ignorable:** `// non-critical: ...`

---

## What Is Currently Stubbed / Disabled

See `BACKLOG.md` for full details. Summary:

| Feature | Status |
|---------|--------|
| AI Pick button | Non-functional stub (`autoSelectMessages` returns `[]` in `lib/store.ts`) |
| Google / GitHub OAuth | Buttons present, no handler |
| Forgot Password | Link present, no handler |
| General Settings Save | Button disabled (no profile API) |
| SpendingTab | All billing data hardcoded, all buttons non-functional |
| Theme persistence | Local only, not saved to DB |
| Suggestion Chips | Hardcoded, no API |
| Session title generation | Falls back to first 45 chars of first message |

---

## Loading States — Always Show a Loader

Never leave the UI in a static/empty state while async work is in progress. Use the appropriate loader for the context:

| Situation | What to show |
|-----------|-------------|
| Auth session restoring on page load | `<PageLoader />` from `app/components/common/PageLoader.tsx` |
| Any full-page wait (auth, route guard) | `<PageLoader />` |
| Messages loading in chat (initial or branch switch) | The skeleton in `MessageList` — already shown when `isLoadingMessages && messages.length === 0` |
| Sessions loading in sidebar | Spinner row — already shown when `isLoadingSessions && sessions.length === 0` |
| Settings tab data loading | `<Loader2 className="animate-spin" />` centered in the tab content area |
| Inline button action (save, submit, delete) | `<Spinner />` inside the button + `disabled` |

**Rules:**
- Before switching branch, clear `messages: []` in the store so the skeleton appears immediately — never let old branch messages linger while the new branch loads.
- Every new page that has an auth guard must check `isLoading` from `useAuthStore` and show `<PageLoader />` while it's true, before checking `!user`.
- Every new API-backed tab or panel must have an explicit loading state — a `Loader2` spinner centered in the content area, not a blank panel.

## File and Folder Naming Conventions

- **Folders** — always `kebab-case`: `branch-modal/`, `settings/`, `common/`
- **React component files** — always `PascalCase`: `MessageBubble.tsx`, `BranchTree.tsx`, `SessionItem.tsx`
- **Non-component TypeScript files** — always `camelCase`: `store.ts`, `authStore.ts`, `hooks.ts`, `api.ts`
- **Files in `shared/`** — always `kebab-case`: `types.ts`, `branch-modal.ts`
- **No default exports** — always named exports so imports are refactor-safe and grep-able

---

## `shared/` Folder — Types, Constants, and UI Config

Everything that is a type, interface, constant, or hardcoded config belongs in `shared/`, not scattered across feature folders or `lib/`.

**Files currently in `shared/`:**

| File | What goes here |
|------|---------------|
| `shared/types.ts` | All domain and API types — `Message`, `Branch`, `Session`, paginated wrappers, request payloads, usage stats |
| `shared/branch-modal.ts` | Branch modal UI types (`RightTab`, `Operation`, `OperationButton`) and constants (`OP_BUTTONS`, `RIGHT_TABS`) |
| `shared/ai-config.ts` | AI provider config — `BEDROCK_MODELS` / `ANTHROPIC_MODELS` / `GEMINI_MODELS`, `PROMPT_SUGGESTIONS`, the demo-model allowlist helper, and BYOK availability probes |

**Rules:**
- **New domain or API type** → add to `shared/types.ts`
- **New UI-only types + constants for a feature** → create `shared/<feature-name>.ts` (e.g. `shared/settings.ts`)
- **Never define types inline in a component file** if they are used by more than one file — move them to `shared/` first
- **Never put runtime logic** (functions, hooks, API calls) in `shared/` — only types, interfaces, enums, and plain data constants
- Import using the `@/shared/` alias: `import { Message } from '@/shared/types'`

---

## Before Adding a New Feature

1. Check `BACKLOG.md` — is it already tracked? Update the status entry when you implement it.
2. Check `shared/types.ts` and `shared/` — does the type or constant already exist?
3. Check `lib/api.ts` — does the API call already exist?
4. Check `app/components/common/`, `app/components/settings/`, and `lib/hooks.ts` for reusable pieces.
5. Run `graphify query "<what you're building>"` to find existing related nodes.

---

## graphify Knowledge Graph

This project has a graphify knowledge graph at `graphify-out/`.

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse EXTRACTED + INFERRED edges rather than scanning files.
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).
