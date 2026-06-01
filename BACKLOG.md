# Backlog — Hardcoded Data, Unimplemented Features & Backend Gaps

This file tracks everything that is currently stubbed, hardcoded, disabled, or dependent on a backend change that hasn't happened yet.
Update this file whenever a feature is implemented or a backend contract changes.

---

## Frontend Features — Disabled / Not Yet Implemented

### AI Pick
**Status:** Disabled (button visible but non-functional)
**Location:** `app/components/branch/modal/MessageSelector.tsx`, `lib/store.ts:autoSelectMessages`
**Idea:** When clicked, POST all messages from the active branch to a dedicated API endpoint. The AI selects the most relevant messages, optionally guided by a user preference string (e.g. "focus on the auth discussion"). Returns a list of message IDs to pre-select in the branch modal.
**Needs:**
- New Lambda / API route (`POST /branches/ai-pick` or similar)
- Prompt design for the selection logic
- Optional preference text input in `MessageSelector`

---

### Session Title Generation
**Status:** Hardcoded fallback — title defaults to the first 45 characters of the user's first message (set client-side in `lib/store.ts:onMetadata`)
**Location:** `lib/store.ts:sendMessage` (title set in the `onMetadata` callback as `prompt.slice(0, 45)`), `app/components/sidebar/SessionItem.tsx` (`DEFAULT_SESSION_TITLE = 'New Conversation'`)
**Idea:** After the first AI response is complete, call an API that generates a short, descriptive title for the session using the first user message and AI reply as context.
**Needs:**
- New Lambda / API route (`POST /sessions/:id/generate-title` or via streaming metadata)
- Update `onDone` in `streamChat` to trigger title generation
- Update session in store once title returns

---

### General Settings — Save Changes
**Status:** Disabled — Save Changes button is non-functional pending a user profile API
**Location:** `app/components/settings/GeneralTab.tsx`
**Note:** Name updates could go via Cognito (`updateName` exists in `authStore`), but bio and timezone have no API at all. Re-enable the button once a unified profile update endpoint exists.
**Needs:** `PATCH /users/me` (or equivalent) returning updated name, bio, and timezone; wire into `handleSave`

---

### Export CSV (Usage Tab)
**Status:** Disabled — Export CSV button has no handler
**Location:** `app/components/settings/UsageTab.tsx` (Model Breakdown section)
**Needs:** `GET /usage/export?format=csv` endpoint or client-side CSV generation from `stats.dailyUsage`

---

### Spending Tab — Billing Data Still Hardcoded
**Status:** Partially implemented — usage stats (`estimatedCostUsd`, token counts, model breakdown) now come from `api.getUsageStats()`. The following remain hardcoded:
**Location:** `app/components/settings/SpendingTab.tsx`
**Breakdown:**
- `INVOICES` — hardcoded invoice list; needs `GET /billing/invoices`
- `PLANS` — hardcoded plan definitions with `current` flag baked in; `current` should derive from `user.plan` via `useAuthStore`; plan catalogue should come from `GET /billing/plans` or config
- Payment method (`Visa ending in 4242`, `Expires 08/2028`) — hardcoded; needs `GET /billing/payment-methods`
- Renewal date (`June 1, 2026`) — hardcoded; should come from subscription API
**Needs:** Billing API endpoints; wire into component on mount

---

### Spending Tab — Non-functional Buttons
**Status:** Stubbed — buttons present but have no handlers
**Location:** `app/components/settings/SpendingTab.tsx`
**Breakdown:**
- `Cancel plan` — needs `DELETE /billing/subscription` + confirmation dialog
- `Update` (payment method) — needs payment method update flow (Stripe hosted page or custom)
- `Add payment method` — same as above
- `Download` (invoice) — needs `GET /billing/invoices/:id/pdf`
- `Upgrade` / `Downgrade` plan buttons — needs `POST /billing/subscription` with new plan ID

---

### Theme Persistence
**Status:** Local-only — theme (accent color, dark mode) is stored in local state/context only, not persisted to the database
**Location:** `app/context/ThemeContext.tsx`, `app/components/settings/AppearanceTab.tsx`
**Idea:** Save the user's selected theme (preset ID or custom hex, dark mode toggle) to the backend on change. Load it on login so the theme is consistent across devices.
**Needs:** `theme` field on the user profile API (`PATCH /users/me`); load on auth, apply before first render to avoid flash

---

### User Bio (General Settings)
**Status:** Hardcoded — `bio` state initialises as `''` and is never loaded from or saved to the API
**Location:** `app/components/settings/GeneralTab.tsx` (`bio` state, textarea)
**Needs:** `bio` field on the user profile API response; load on mount, save via the profile update endpoint above

---

### Suggestion Chips
**Status:** Hardcoded — three static suggestions shown on the empty chat screen
**Location:** `app/components/chat/SuggestionChips.tsx` (`SUGGESTIONS` constant)
**Idea:** Read the most recent session from the sidebar (title + last few messages) and POST to an API that returns contextually relevant follow-up suggestions for the user.
**Needs:**
- New API route (`POST /suggestions` or similar) that accepts recent session context
- `SuggestionChips` updated to accept `suggestions: { title: string; prompt: string }[]` as a prop
- Parent component fetches suggestions when the empty state is shown (lazy, non-blocking)

---

### Settings Tabs Hidden from Nav
**Status:** Denav-ed — `SpendingTab` and `AppearanceTab` components exist but are commented out of `SETTINGS_TABS` in `app/(app)/layout.tsx`, so they are unreachable from the settings nav. This is intentional: both are gated behind incomplete backends (billing API for Spending, theme-persistence API for Appearance — see entries above). Components are kept, not deleted.
**Location:** `app/(app)/layout.tsx` (`SETTINGS_TABS`, commented entries), `app/components/settings/SpendingTab.tsx`, `app/components/settings/AppearanceTab.tsx`
**Fix:** Re-add the tab entries to `SETTINGS_TABS` once their respective backends land.

---

## Backend Gaps — API Changes Required

### Branch Count in Session List
**Status:** `branchCount` on `Session` is local-only — populated only after `loadBranches()` is called when the user opens a session. Sidebar never shows branch counts on initial load.
**Location:** `shared/types.ts:Session.branchCount` (the sidebar reads `session.branchCount` after `loadBranches()` populates it client-side)
**Fix:** Include `branch_count` in the `GET /sessions` list response. Wire it into `PaginatedSessions` → `Session` on the frontend once available.

---

## Hardcoded / Local-Only Data

### User Profile Fallbacks in Sidebar
**Status:** Resolved — `SidebarUserFooter` renders `user.initials` / `user.name` / `user.email` directly with no fake fallbacks (`user` is non-null asserted, guaranteed by the auth guard in `app/(app)/layout.tsx`). The blank-user fallback in `authStore.restoreSession` (deriving a name from an empty email) has been removed — restore now fails closed (signed out) when no email is present.
**Location:** `app/components/sidebar/SidebarUserFooter.tsx`, `lib/authStore.ts:restoreSession`

### `Branch.description`
**Status:** Local-only field, not returned by the API
**Location:** `shared/types.ts:Branch.description`
**Fix:** Add `description` to the branch schema and return it from `GET /branches/session/:id` if the field is needed in the UI.

### `Branch.messageCount`
**Status:** Removed — `selectedMsgIds` has been removed; message count no longer displayed in branch tree/versions table.

---

## Auth Flows — Not Yet Wired

### Google OAuth
**Status:** Not implemented
**Location:** `app/login/page.tsx` (button not present, no handler)

### GitHub OAuth
**Status:** Not implemented
**Location:** `app/login/page.tsx` — add a button calling `signInWithRedirect({ provider: 'Github' })` following the same pattern as Google

### Forgot Password
**Status:** Not implemented
**Location:** `app/login/page.tsx` (link present, no handler)
