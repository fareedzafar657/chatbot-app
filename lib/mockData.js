/* eslint-disable */
// Reference only — not imported anywhere in production code.

const now = new Date();
const t = (offsetMs: number) => new Date(now.getTime() - offsetMs);
const h = 3600000;
const d = 86400000;

export const initialSessions: Session[] = [
  {
    id: 'session-1',
    title: 'React TypeScript Setup',
    activeBranchId: 'branch-1-main',
    createdAt: t(2 * d),
    updatedAt: t(1 * h),
    branches: [
      {
        id: 'branch-1-main',
        name: 'main',
        parentBranchId: null,
        messageIds: ['m1', 'm2', 'm3', 'm4'],
        createdAt: t(2 * d),
      },
      {
        id: 'branch-1-vite',
        name: 'vite-monorepo',
        parentBranchId: 'branch-1-main',
        messageIds: ['m1', 'm2', 'm5', 'm6'],
        createdAt: t(1 * d),
      },
      {
        id: 'branch-1-cra',
        name: 'cra-approach',
        parentBranchId: 'branch-1-main',
        messageIds: ['m1', 'm2', 'm7', 'm8'],
        createdAt: t(2 * h),
      },
    ],
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'How do I set up a new React project with TypeScript?',
        timestamp: t(2 * d),
      },
      {
        id: 'm2',
        role: 'assistant',
        content: `There are a few popular ways to bootstrap a React + TypeScript project. The most recommended approach today is **Vite**:

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
\`\`\`

This gives you a fully configured project with:
- TypeScript configured with strict mode enabled
- Vite for lightning-fast HMR and builds
- ESLint pre-configured out of the box

Alternatively, you can use **Create React App**:
\`\`\`bash
npx create-react-app my-app --template typescript
\`\`\`

Vite is strongly preferred for new projects due to its significantly faster dev server and build times. Would you like me to walk through either approach in more detail?`,
        timestamp: t(2 * d - 30000),
      },
      {
        id: 'm3',
        role: 'user',
        content: "Let's go with Vite. How do I add ESLint and Prettier to the project?",
        timestamp: t(1 * d),
      },
      {
        id: 'm4',
        role: 'assistant',
        content: `Great choice! Here's how to add **ESLint** and **Prettier** to your Vite + React + TypeScript setup:

**1. Install dependencies**
\`\`\`bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks
\`\`\`

**2. Create \`.eslintrc.json\`**
\`\`\`json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react-hooks"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
\`\`\`

**3. Create \`.prettierrc\`**
\`\`\`json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
\`\`\`

Add these scripts to your \`package.json\`:
\`\`\`json
{
  "scripts": {
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives",
    "format": "prettier --write src"
  }
}
\`\`\``,
        timestamp: t(1 * d - 30000),
      },
      {
        id: 'm5',
        role: 'user',
        content: 'How do I configure Vite for a monorepo setup?',
        timestamp: t(1 * d - 1 * h),
      },
      {
        id: 'm6',
        role: 'assistant',
        content: `Setting up Vite in a monorepo requires a few extra configurations. Here's the recommended approach using **pnpm workspaces**:

**1. Root \`pnpm-workspace.yaml\`**
\`\`\`yaml
packages:
  - 'apps/*'
  - 'packages/*'
\`\`\`

**2. Configure path aliases in \`vite.config.ts\`**
\`\`\`typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
\`\`\`

**3. Update \`tsconfig.json\`**
\`\`\`json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../packages/shared/src/*"],
      "@ui/*": ["../../packages/ui/src/*"]
    }
  }
}
\`\`\`

This lets you import shared utilities cleanly across all apps in the monorepo.`,
        timestamp: t(1 * d - 1 * h - 30000),
      },
      {
        id: 'm7',
        role: 'user',
        content: 'Can you explain how CRA handles TypeScript differently from Vite?',
        timestamp: t(2 * h),
      },
      {
        id: 'm8',
        role: 'assistant',
        content: `Great question! **Create React App (CRA)** and **Vite** handle TypeScript quite differently under the hood:

**Create React App**
- Uses **Babel** to strip TypeScript types at build time
- Type checking is separate via \`tsc --noEmit\`
- Configuration is hidden behind \`react-scripts\` (ejecting required to change)
- Slower dev server due to Webpack

**Vite**
- Uses **esbuild** to transpile TypeScript (much faster than Babel)
- Also strips types without checking — same philosophy
- Config fully exposed in \`vite.config.ts\`
- Near-instant HMR regardless of project size

**The critical insight**: Neither CRA nor Vite performs type checking during the build. Both treat TypeScript as "typed JavaScript with type stripping."

You should always run type checking separately:
\`\`\`bash
# In CI/CD or pre-commit hooks
tsc --noEmit

# Or with stricter settings
tsc --noEmit --strict
\`\`\`

The practical difference is purely **speed and configurability** — Vite wins on both fronts.`,
        timestamp: t(2 * h - 30000),
      },
    ],
  },
  {
    id: 'session-2',
    title: 'Python Async Patterns',
    activeBranchId: 'branch-2-main',
    createdAt: t(1 * d),
    updatedAt: t(3 * h),
    branches: [
      {
        id: 'branch-2-main',
        name: 'main',
        parentBranchId: null,
        messageIds: ['m9', 'm10', 'm11', 'm12'],
        createdAt: t(1 * d),
      },
      {
        id: 'branch-2-deep',
        name: 'asyncio-internals',
        parentBranchId: 'branch-2-main',
        messageIds: ['m9', 'm10', 'm13', 'm14'],
        createdAt: t(3 * h),
      },
    ],
    messages: [
      {
        id: 'm9',
        role: 'user',
        content: "What's the difference between async/await and threading in Python?",
        timestamp: t(1 * d),
      },
      {
        id: 'm10',
        role: 'assistant',
        content: `The key difference is the **concurrency model** each uses:

**Threading (concurrent.futures / threading)**
- OS-managed threads with a shared memory space
- Subject to the **GIL** (Global Interpreter Lock) — prevents true CPU parallelism in CPython
- Better for I/O-bound tasks but with more overhead
- Requires synchronization primitives (locks, semaphores)

**Async/Await (asyncio)**
- Single-threaded **cooperative multitasking** via an event loop
- Tasks yield control voluntarily at \`await\` points
- Excellent for I/O-bound workloads (HTTP, DB, file I/O)
- No shared state issues — no locks needed

\`\`\`python
import asyncio
import aiohttp

async def fetch_data(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as response:
        return await response.json()

async def main(urls: list[str]) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_data(session, url) for url in urls]
        return await asyncio.gather(*tasks)
\`\`\`

**Rule of thumb**: Use **asyncio** for I/O-bound concurrency, **multiprocessing** for CPU-bound parallelism.`,
        timestamp: t(1 * d - 30000),
      },
      {
        id: 'm11',
        role: 'user',
        content: 'How do I handle errors properly in async Python code?',
        timestamp: t(4 * h),
      },
      {
        id: 'm12',
        role: 'assistant',
        content: `Error handling in async code has some important nuances. Here are the key patterns:

**1. Basic try/except in coroutines**
\`\`\`python
async def safe_fetch(url: str) -> dict | None:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                resp.raise_for_status()
                return await resp.json()
    except aiohttp.ClientResponseError as e:
        logger.error(f"HTTP error {e.status}: {url}")
        return None
    except asyncio.TimeoutError:
        logger.error(f"Timeout fetching: {url}")
        return None
\`\`\`

**2. Using gather with exception capture**
\`\`\`python
results = await asyncio.gather(
    *[fetch(url) for url in urls],
    return_exceptions=True  # Don't cancel all tasks on single failure
)

for i, result in enumerate(results):
    if isinstance(result, Exception):
        logger.error(f"Task {i} failed: {result}")
    else:
        process(result)
\`\`\`

**3. TaskGroup (Python 3.11+)**
\`\`\`python
async with asyncio.TaskGroup() as tg:
    task1 = tg.create_task(fetch(url1))
    task2 = tg.create_task(fetch(url2))
# Exceptions from any task are re-raised here
\`\`\`

The golden rule: **never silently swallow exceptions** in async code — they're easy to lose.`,
        timestamp: t(4 * h - 30000),
      },
      {
        id: 'm13',
        role: 'user',
        content: 'Can you explain asyncio event loop internals in depth?',
        timestamp: t(3 * h),
      },
      {
        id: 'm14',
        role: 'assistant',
        content: `The asyncio event loop is a selector-based I/O multiplexer. Here's how it works internally:

**Core Architecture**
\`\`\`
Event Loop
├── Ready Queue   (callbacks ready to execute immediately)
├── I/O Polling   (epoll/kqueue/select on file descriptors)
├── Scheduled     (heap of time-delayed callbacks)
└── Running Task  (currently executing coroutine)
\`\`\`

**Execution cycle (simplified)**
\`\`\`python
while True:
    # 1. Run all ready callbacks
    for callback in ready_queue:
        callback()

    # 2. Poll I/O with timeout
    timeout = next_scheduled_time - now()
    events = selector.select(timeout)

    # 3. Dispatch I/O callbacks
    for key, mask in events:
        key.data(mask)

    # 4. Run scheduled callbacks that are due
    for callback in scheduled:
        if callback.when <= now():
            ready_queue.append(callback)
\`\`\`

**When you \`await\` something:**
1. Coroutine suspends and returns a \`Future\` to the loop
2. Loop registers I/O interest with the OS selector
3. OS notifies when I/O is ready
4. Loop resumes the coroutine with the result

This is why asyncio is efficient — it never blocks waiting for I/O.`,
        timestamp: t(3 * h - 30000),
      },
    ],
  },
  {
    id: 'session-3',
    title: 'TypeScript Generics Deep Dive',
    activeBranchId: 'branch-3-main',
    createdAt: t(2 * h),
    updatedAt: t(30 * 60000),
    branches: [
      {
        id: 'branch-3-main',
        name: 'main',
        parentBranchId: null,
        messageIds: ['m15', 'm16'],
        createdAt: t(2 * h),
      },
    ],
    messages: [
      {
        id: 'm15',
        role: 'user',
        content: 'Can you explain conditional types in TypeScript with practical examples?',
        timestamp: t(2 * h),
      },
      {
        id: 'm16',
        role: 'assistant',
        content: `Conditional types are one of TypeScript's most powerful meta-programming features. They follow this syntax:

\`\`\`typescript
type Result = A extends B ? TrueType : FalseType;
\`\`\`

**Basic examples**
\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsString<'hello'>;  // true (literal extends string)
\`\`\`

**The \`infer\` keyword — extract types from structure**
\`\`\`typescript
// Unwrap a Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type R1 = Awaited<Promise<string>>;          // string
type R2 = Awaited<Promise<Promise<number>>>; // number

// Extract return type of a function
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = (x: number, y: string) => boolean;
type FnReturn = ReturnType<Fn>; // boolean
\`\`\`

**Distributive conditional types**
\`\`\`typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type T = NonNullable<string | null | undefined | number>;
// Distributes over union: string | number
\`\`\`

**Real-world utility: DeepReadonly**
\`\`\`typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};
\`\`\`

Conditional types are the foundation of most TypeScript utility types in the standard library.`,
        timestamp: t(2 * h - 30000),
      },
    ],
  },
  {
    id: 'session-new',
    title: 'New Conversation',
    activeBranchId: 'branch-new-main',
    createdAt: now,
    updatedAt: now,
    branches: [
      {
        id: 'branch-new-main',
        name: 'main',
        parentBranchId: null,
        messageIds: [],
        createdAt: now,
      },
    ],
    messages: [],
  },
];

export const AI_RESPONSES = [
  `That's a great question! Let me break this down clearly.

**Overview**
The core concept here involves understanding both the theoretical foundations and practical implementation details. Here's what you need to know:

- **Performance**: Modern approaches are optimized for both throughput and latency
- **Correctness**: Edge cases are handled at the type level where possible
- **Maintainability**: The pattern scales well as your codebase grows

**Example Implementation**
\`\`\`typescript
interface Config<T extends Record<string, unknown>> {
  data: T;
  transform: (input: T) => Partial<T>;
  validate: (result: Partial<T>) => boolean;
}

function process<T extends Record<string, unknown>>(
  config: Config<T>
): T | null {
  const transformed = config.transform(config.data);
  if (!config.validate(transformed)) return null;
  return { ...config.data, ...transformed };
}
\`\`\`

**Key Takeaways**
1. Always consider the type safety of your implementation
2. Prefer composition over inheritance for flexibility
3. Write tests for edge cases from the beginning

Would you like me to elaborate on any specific aspect of this?`,

  `Here's a comprehensive breakdown:

**The Short Answer**
This is fundamentally about tradeoffs between simplicity and power. The right approach depends on your specific constraints.

**Detailed Explanation**
When working with this pattern, you'll encounter three main scenarios:

1. **Simple case**: Use the built-in utilities directly
2. **Complex case**: Compose primitives to build higher-level abstractions
3. **Edge case**: Fall back to more explicit control flow

\`\`\`bash
# Install required dependencies
npm install -D typescript @types/node

# Initialize TypeScript config
npx tsc --init --strict --target ES2022 --module NodeNext
\`\`\`

**Configuration Example**
\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler"
  }
}
\`\`\`

The configuration above enables the strictest possible type checking, which catches the most bugs at compile time.

Let me know if you'd like me to show a more concrete example for your specific use case!`,
];
