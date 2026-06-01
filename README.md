# K-AI — Branching AI Chat

> An open-source AI chat interface with branching conversations. Explore parallel threads, compare responses, and cherry-pick the best ideas — all in one place.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

---

## Features

- **Branching conversations** — fork any message into a parallel thread and explore different directions simultaneously
- **Branch tree view** — visualise your entire conversation graph and navigate between branches
- **Cherry-pick** — select individual messages from any branch and merge them into your current thread
- **Compact view** — collapse long exchange sequences into summarised cards to keep context manageable
- **AI config per session** — set a custom system prompt, model, and API key for each conversation
- **Usage stats** — track token consumption and estimated cost across sessions
- **Dark mode + accent theming** — personalise the interface via Settings → Appearance
- **AWS Cognito auth** — email/password sign-up and sign-in out of the box

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + `cn()` utility |
| State | Zustand 5 |
| Auth | AWS Cognito via AWS Amplify 6 |
| Streaming | AWS Lambda Function URL (NDJSON over response streaming, parsed via `fetch` + `ReadableStream`) |
| Charts | Recharts |
| Branch graph | React Flow |
| Markdown | react-markdown + remark-gfm |

---

## Quick Start

### Prerequisites

- Node.js ≥ 18.17
- An AWS account with a Cognito User Pool configured
- A backend API (streaming Lambda + REST API) — see [Backend Setup](#backend-setup)

### 1. Clone and install

```bash
git clone https://github.com/fareedzafar657/k-ai.git
cd k-ai
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STREAMING_LAMBDA_URL=https://<your-lambda-url>.lambda-url.<region>.on.aws
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<region>_<pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Backend Setup

K-AI requires two backend services, both open-sourced separately:

| Service | Repo | Purpose | Environment variable |
|---|---|---|---|
| REST API | [chatbot-fast-api-lambda](https://github.com/fareedzafar657/chatbot-fast-api-lambda) | Sessions, branches, messages, usage stats | `NEXT_PUBLIC_API_URL` |
| Streaming Lambda | [chatbot-streaming-lambda](https://github.com/fareedzafar657/chatbot-streaming-lambda) | Real-time token streaming (NDJSON) | `NEXT_PUBLIC_STREAMING_LAMBDA_URL` |

Both repos include their own deployment and setup instructions. You will also need an **AWS Cognito User Pool** — create one in the AWS console and copy the User Pool ID, App Client ID, and region into your `.env.local`.

All calls to the K-AI **REST API** go through `lib/api.ts` (axios). **Streaming Lambda** calls go through `lib/stream.ts` (raw `fetch` + `ReadableStream` for NDJSON). The only other direct outbound HTTP is the BYOK key probe in `shared/ai-config.ts`, which hits Anthropic / Google directly to check model availability with the user's own key.

---

## Project Structure

```
app/
├── (app)/              # Authenticated route group (layout with sidebar)
│   ├── chat/[sessionId]/
│   ├── new/
│   └── settings/
├── login/
├── components/
│   ├── branch/         # Branch tree, modal, cherry-pick, compact views
│   ├── chat/           # Message list, bubble, input, AI config popover
│   ├── common/         # Shared UI (Spinner, PageLoader, ConfirmDialog, KaiLogo)
│   ├── settings/       # Settings tabs (General, Appearance, Security, Spending, Usage)
│   └── sidebar/        # Session list, sidebar shell, user footer
├── context/            # ThemeContext
└── layout.tsx          # Root layout + metadata

lib/
├── api.ts              # All backend API calls
├── stream.ts           # NDJSON streaming reader (fetch + ReadableStream)
├── store.ts            # Chat + session Zustand store
├── authStore.ts        # Auth Zustand store
├── amplify.ts          # AWS Amplify config
├── cn.ts               # Tailwind class merge utility
└── hooks.ts            # Shared React hooks

shared/
├── types.ts            # All domain + API types
├── branch-modal.ts     # Branch modal UI types + constants
└── ai-config.ts        # AI provider model lists, prompt suggestions, BYOK availability probes
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for the REST API |
| `NEXT_PUBLIC_STREAMING_LAMBDA_URL` | Yes | URL for the streaming Lambda function |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Yes | AWS Cognito User Pool ID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Yes | AWS Cognito App Client ID |
| `NEXT_PUBLIC_COGNITO_REGION` | Yes | AWS region (e.g. `us-east-1`) |

---

## Contributing

Contributions are welcome on the frontend, the [REST API](https://github.com/fareedzafar657/chatbot-fast-api-lambda), and the [streaming Lambda](https://github.com/fareedzafar657/chatbot-streaming-lambda).

For this repo:

1. Fork and create a feature branch: `git checkout -b feature/my-feature`
2. Keep PRs focused — one feature or fix per PR
3. Open an issue first for significant changes

Before submitting, run:

```bash
npm run lint
npm run build
```

---

## Known Limitations / Roadmap

See [`BACKLOG.md`](./BACKLOG.md) for a full list of features that are currently stubbed, hardcoded, or pending a backend implementation (billing, OAuth, title generation, theme persistence, etc.).

---

## License

[MIT](./LICENSE) © Fareed Z.
