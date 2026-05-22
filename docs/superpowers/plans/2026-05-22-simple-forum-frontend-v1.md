# Simple Forum Frontend v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript SPA forum (Reddit-lite) against the existing backend API — login (fake), browse/create forums and posts, vote, subscribe, comment.

**Architecture:** Pure SPA. Vite + React + TS. TanStack Query owns server state; React Context owns the one slice of client state (current user). `openapi-typescript` codegen + `openapi-fetch` for a fully typed API client. localStorage backs both "logged-in" and "your-vote" state (workarounds for the API's lack of real auth and vote-state response).

**Tech Stack:** Vite 5+, React 19, TypeScript 5 (strict), Tailwind CSS v4, shadcn/ui, React Router DOM v7, TanStack Query v5, openapi-typescript / openapi-fetch, Vitest + React Testing Library.

**Reference spec:** [docs/superpowers/specs/2026-05-22-simple-forum-frontend-design.md](../specs/2026-05-22-simple-forum-frontend-design.md)

---

## Conventions used in this plan

- Each task is a focused unit of work, roughly 5–15 minutes. Steps within a task are individually trackable.
- TDD where it earns its keep (logic, hooks, validation, optimistic updates). Pure presentational components get a single smoke test ("renders, shows expected elements"), not pixel-level assertions.
- Commit at the end of each task. Conventional Commits style (`feat(scope): …`, `chore: …`, `test(scope): …`).
- All paths POSIX-style. Commands assume Windows PowerShell or Bash — both work for `npm` and `git`.
- `npm run` is the entry point for everything; no `pnpm`/`yarn` mix.
- The backend is assumed running locally on `http://localhost:8080` for any task that needs it (no task requires it until after Phase 1).

## Phasing

| Phase | Outcome at end of phase | Tasks |
|-------|-------------------------|-------|
| P0 — Scaffolding | Vite dev server runs, Tailwind + shadcn ready, tests run | T01–T06 |
| P1 — API layer | Typed API client with X-User-Id header injection | T07–T09 |
| P2 — Utilities | Time formatting, vote-state helpers (logic-only) | T10–T11 |
| P3 — Identity | Login works, user persists, providers wired into root | T12–T15 |
| P4 — Routing + shell | All routes wired, empty pages render in app shell | T16–T21 |
| P5 — Forums (read) | Forum directory + single forum page render real data | T22–T26 |
| P6 — Posts (read) | Home feed + per-forum feed + single post page render | T27–T31 |
| P7 — Forums + posts (write) | Create forum, create post forms work | T32–T35 |
| P8 — Voting | Optimistic upvote/downvote on posts with rollback | T36–T38 |
| P9 — Subscriptions | Subscribe button + sidebar list of subscriptions | T39–T42 |
| P10 — Comments | Comment list, create, edit, delete, vote on PostPage | T43–T49 |
| P11 — Polish + production | Auth gating audit, production build verified | T50–T51 |

## File structure (target end-state)

```
simple-forum-frontend/
├─ api/
│  └─ openapi.yaml
├─ scripts/
│  └─ sync-api.mjs
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                                          # providers + RouterProvider
│  ├─ router.tsx                                       # route table
│  │
│  ├─ pages/
│  │   ├─ HomePage.tsx
│  │   ├─ LoginPage.tsx
│  │   ├─ ForumPage.tsx
│  │   ├─ PostPage.tsx
│  │   ├─ ForumsPage.tsx
│  │   ├─ CreateForumPage.tsx
│  │   ├─ CreatePostPage.tsx
│  │   └─ NotFoundPage.tsx
│  │
│  ├─ features/
│  │   ├─ posts/
│  │   │   ├─ usePosts.ts
│  │   │   ├─ usePost.ts
│  │   │   ├─ useForumPosts.ts
│  │   │   ├─ useCreatePost.ts
│  │   │   ├─ useVotePost.ts
│  │   │   ├─ PostListItem.tsx
│  │   │   └─ VoteButtons.tsx
│  │   ├─ forums/
│  │   │   ├─ useForums.ts
│  │   │   ├─ useForum.ts
│  │   │   ├─ useCreateForum.ts
│  │   │   ├─ ForumListItem.tsx
│  │   │   └─ ForumHeader.tsx
│  │   ├─ comments/
│  │   │   ├─ useComments.ts
│  │   │   ├─ useCreateComment.ts
│  │   │   ├─ useUpdateComment.ts
│  │   │   ├─ useDeleteComment.ts
│  │   │   ├─ useVoteComment.ts
│  │   │   ├─ CommentList.tsx
│  │   │   ├─ CommentItem.tsx
│  │   │   └─ CommentForm.tsx
│  │   ├─ subscriptions/
│  │   │   ├─ useSubscriptions.ts
│  │   │   ├─ useSubscribe.ts
│  │   │   ├─ useUnsubscribe.ts
│  │   │   └─ SubscribeButton.tsx
│  │   └─ auth/
│  │       ├─ UserContext.tsx
│  │       ├─ useUser.ts
│  │       ├─ useRequireUser.ts
│  │       └─ LoginForm.tsx
│  │
│  ├─ layout/
│  │   ├─ AppShell.tsx
│  │   ├─ TopNav.tsx
│  │   ├─ Sidebar.tsx
│  │   └─ RightRail.tsx
│  │
│  ├─ components/ui/                                   # shadcn primitives
│  │
│  ├─ lib/
│  │   ├─ api/
│  │   │   ├─ client.ts
│  │   │   ├─ userIdMiddleware.ts
│  │   │   └─ schema.ts                                # generated
│  │   ├─ queryClient.ts
│  │   ├─ utils.ts                                     # cn() etc.
│  │   ├─ relativeTime.ts
│  │   └─ voteState.ts
│  │
│  └─ test/
│      └─ setup.ts
│
├─ .env.example
├─ tailwind.config.ts
├─ tsconfig.json
├─ vite.config.ts
└─ package.json
```

---

## Phase 0 — Scaffolding

### Task 01: Initialize Vite + React + TypeScript project

**Files:**
- Create (via scaffold): `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `public/vite.svg`, `src/assets/react.svg`, `.gitignore` (additions)
- Modify after scaffold: `package.json` (project name)

The repo already exists with a README and the spec; we scaffold *into* the current directory.

- [ ] **Step 1: Scaffold Vite + React + TS into current directory**

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty… how would you like to proceed?" → choose **Ignore files and continue**. This keeps `README.md`, `.git/`, `docs/`, `.superpowers/`, and `.gitignore` intact.

- [ ] **Step 2: Install scaffolded dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite prints `Local:   http://localhost:5173/`. Open it; you should see the default Vite + React landing page. Stop the dev server (Ctrl+C).

- [ ] **Step 4: Rename project in package.json**

Open `package.json`, change `"name": "simple-forum-frontend-v1"` (or whatever the scaffold produced) to `"name": "simple-forum-frontend"`.

- [ ] **Step 5: Update .gitignore for the Node project**

Append to existing `.gitignore` (do not overwrite — `.superpowers/` already there):

```
# Node
node_modules/
dist/
dist-ssr/
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Env
.env
.env.local
.env.*.local
!.env.example
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 02: Enable strict TS + path alias `@/` → `src/`

**Files:**
- Modify: `tsconfig.json`, `tsconfig.app.json` (created by Vite scaffold), `vite.config.ts`

- [ ] **Step 1: Tighten `tsconfig.app.json` compiler options**

Open `tsconfig.app.json`. Ensure these are present under `compilerOptions` (add or set):

```jsonc
{
  "compilerOptions": {
    // …existing options…
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 2: Add path alias to `vite.config.ts`**

Replace `vite.config.ts` contents:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Verify TS still typechecks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Add a typecheck script**

In `package.json`, under `"scripts"`, add:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Verify the alias works end-to-end**

Edit `src/App.tsx`, replace its imports of `./assets/react.svg` to use the alias. (Just one line change to prove the alias resolves.)

Run:

```bash
npm run dev
```

Expected: page renders without console errors. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.app.json vite.config.ts package.json src/App.tsx
git commit -m "chore: enable strict TS and @/ → src/ path alias"
```

---

### Task 03: Install + configure Tailwind CSS v4

**Files:**
- Modify: `package.json`, `vite.config.ts`, `src/index.css`
- Create: `tailwind.config.ts` (only if not auto-created)

- [ ] **Step 1: Install Tailwind v4 + the Vite plugin**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Wire the Tailwind plugin into Vite**

Open `vite.config.ts` and add the plugin:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Replace `src/index.css` with the Tailwind v4 entry**

Replace contents:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Smoke-test Tailwind**

Replace `src/App.tsx` contents:

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <h1 className="text-3xl font-bold text-slate-900">Simple Forum</h1>
    </div>
  );
}
```

Run `npm run dev`. Expected: centered bold black heading on light gray background. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/index.css src/App.tsx
git commit -m "chore: install and configure Tailwind CSS v4"
```

---

### Task 04: Install shadcn/ui + initial primitives

**Files:**
- Modify: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `components.json` (created), `src/index.css`, `src/lib/utils.ts` (created)
- Create: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/alert.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/label.tsx`

shadcn requires `baseUrl` and `paths` at the root `tsconfig.json` level too (not just `tsconfig.app.json`).

- [ ] **Step 1: Add path alias to root `tsconfig.json`**

Open `tsconfig.json` (the root one, not `tsconfig.app.json`). Add at top level (alongside `references`):

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 2: Initialize shadcn**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

This creates `components.json`, updates `src/index.css` with theme tokens, and creates `src/lib/utils.ts` containing `cn()`.

- [ ] **Step 3: Install primitives we need**

```bash
npx shadcn@latest add button input alert dialog textarea label
```

This drops six files into `src/components/ui/`.

- [ ] **Step 4: Smoke-test a Button**

Replace `src/App.tsx`:

```tsx
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Button>Simple Forum</Button>
    </div>
  );
}
```

Run `npm run dev`. Expected: styled button in the page center.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: install shadcn/ui and add base primitives"
```

---

### Task 05: Install Vitest + React Testing Library

**Files:**
- Modify: `package.json`, `vite.config.ts`, `tsconfig.app.json`
- Create: `src/test/setup.ts`, `src/lib/utils.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Add test config to `vite.config.ts`**

Replace `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
```

- [ ] **Step 3: Add Vitest globals to TS**

Open `tsconfig.app.json`. Under `compilerOptions`, add:

```jsonc
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 4: Create the test setup file**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

- [ ] **Step 5: Add npm scripts**

In `package.json`, under `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Write a sanity test**

Create `src/lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("dedupes tailwind conflicts", () => {
    // tailwind-merge keeps the latter when same utility class group
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
```

- [ ] **Step 7: Run the test**

```bash
npm run test:run
```

Expected: 2 tests pass.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: configure Vitest + React Testing Library"
```

---

### Task 06: Vite dev proxy + env config

**Files:**
- Modify: `vite.config.ts`
- Create: `.env.example`, `src/vite-env.d.ts` (modify existing)

- [ ] **Step 1: Add a proxy block to `vite.config.ts`**

Replace `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
```

- [ ] **Step 2: Create `.env.example`**

```bash
# Where the deployed backend lives. In dev, the Vite proxy handles /api/* and
# this value is unused. Set in deployed builds.
VITE_API_BASE_URL=
```

- [ ] **Step 3: Type the env**

Replace `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 4: Verify build + tests still work**

```bash
npm run typecheck
npm run test:run
npm run build
```

Expected: all three pass cleanly. (Build will produce `dist/`.)

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts .env.example src/vite-env.d.ts
git commit -m "chore: add /api Vite dev proxy and env type definitions"
```

---

## Phase 1 — API layer

### Task 07: Vendor the OpenAPI spec + add codegen tooling

**Files:**
- Create: `api/openapi.yaml`, `scripts/sync-api.mjs`
- Modify: `package.json`

- [ ] **Step 1: Install codegen + client deps**

```bash
npm install openapi-fetch
npm install -D openapi-typescript
```

- [ ] **Step 2: Copy the spec into the repo**

Save the **current** `openapi.yaml` (the second one the user provided — the one with the comments resource) to `api/openapi.yaml`. Use the exact text supplied in the brainstorming conversation as the source of truth.

- [ ] **Step 3: Create the sync script**

Create `scripts/sync-api.mjs`:

```js
#!/usr/bin/env node
// Sync openapi.yaml from the backend repo and regenerate TS types.
// Usage:  npm run sync-api
// Env:    BACKEND_REPO_PATH (defaults to ../simple-forum-backend)

import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const localSpec = path.join(repoRoot, "api/openapi.yaml");

const backendPath = process.env.BACKEND_REPO_PATH
  ?? path.resolve(repoRoot, "../simple-forum-backend");
const backendSpec = path.join(backendPath, "openapi.yaml");

if (existsSync(backendSpec)) {
  copyFileSync(backendSpec, localSpec);
  console.log(`✓ Copied ${backendSpec} → ${localSpec}`);
} else {
  console.warn(`⚠ ${backendSpec} not found — regenerating from existing ${localSpec}`);
}

execSync(
  `npx openapi-typescript "${localSpec}" --output src/lib/api/schema.ts`,
  { stdio: "inherit", cwd: repoRoot }
);
console.log("✓ Regenerated src/lib/api/schema.ts");
```

- [ ] **Step 4: Add the script to `package.json`**

In `package.json`, under `"scripts"`:

```json
"sync-api": "node scripts/sync-api.mjs"
```

- [ ] **Step 5: Commit**

```bash
git add api/openapi.yaml scripts/sync-api.mjs package.json package-lock.json
git commit -m "chore(api): vendor openapi.yaml and add sync-api codegen script"
```

---

### Task 08: Generate API types + build the typed client

**Files:**
- Create: `src/lib/api/schema.ts` (generated), `src/lib/api/client.ts`

- [ ] **Step 1: Generate the schema**

```bash
mkdir -p src/lib/api
npm run sync-api
```

Expected: prints `✓ Regenerated src/lib/api/schema.ts`. The file should be ~hundreds of lines of typed `paths` and `components`.

- [ ] **Step 2: Create the API client**

Create `src/lib/api/client.ts`:

```ts
import createClient from "openapi-fetch";
import type { paths } from "./schema";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const api = createClient<paths>({ baseUrl });
```

(Note: empty baseUrl means requests go to same-origin — i.e. through the Vite dev proxy. In production builds `VITE_API_BASE_URL` must be set.)

- [ ] **Step 3: Verify it typechecks**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/schema.ts src/lib/api/client.ts
git commit -m "feat(api): generate schema types and add openapi-fetch client"
```

---

### Task 09: X-User-Id middleware (TDD)

**Files:**
- Create: `src/lib/api/userIdMiddleware.ts`, `src/lib/api/userIdMiddleware.test.ts`
- Modify: `src/lib/api/client.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/api/userIdMiddleware.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { userIdMiddleware, setCurrentUserId } from "./userIdMiddleware";

function makeCtx(): { request: Request } {
  return { request: new Request("https://example.com/api/test") };
}

describe("userIdMiddleware", () => {
  beforeEach(() => setCurrentUserId(null));

  it("sets X-User-Id when a user is set", async () => {
    setCurrentUserId("alice");
    const { request } = makeCtx();
    const result = (await userIdMiddleware.onRequest!({
      request,
      schemaPath: "/api/test",
      params: {},
      options: {},
    } as any)) as Request;
    expect(result.headers.get("X-User-Id")).toBe("alice");
  });

  it("omits X-User-Id when no user is set", async () => {
    const { request } = makeCtx();
    const result = (await userIdMiddleware.onRequest!({
      request,
      schemaPath: "/api/test",
      params: {},
      options: {},
    } as any)) as Request;
    expect(result.headers.has("X-User-Id")).toBe(false);
  });

  it("reflects updates to setCurrentUserId across calls", async () => {
    setCurrentUserId("alice");
    let result = (await userIdMiddleware.onRequest!({
      request: new Request("https://example.com"), schemaPath: "/", params: {}, options: {},
    } as any)) as Request;
    expect(result.headers.get("X-User-Id")).toBe("alice");

    setCurrentUserId("bob");
    result = (await userIdMiddleware.onRequest!({
      request: new Request("https://example.com"), schemaPath: "/", params: {}, options: {},
    } as any)) as Request;
    expect(result.headers.get("X-User-Id")).toBe("bob");
  });
});
```

- [ ] **Step 2: Run the test (should fail)**

```bash
npm run test:run -- src/lib/api/userIdMiddleware.test.ts
```

Expected: FAIL — "Cannot find module './userIdMiddleware'".

- [ ] **Step 3: Implement the middleware**

Create `src/lib/api/userIdMiddleware.ts`:

```ts
import type { Middleware } from "openapi-fetch";

let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export const userIdMiddleware: Middleware = {
  async onRequest({ request }) {
    if (currentUserId) request.headers.set("X-User-Id", currentUserId);
    return request;
  },
};
```

- [ ] **Step 4: Run the test (should pass)**

```bash
npm run test:run -- src/lib/api/userIdMiddleware.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Wire the middleware into the client**

Replace `src/lib/api/client.ts`:

```ts
import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { userIdMiddleware } from "./userIdMiddleware";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const api = createClient<paths>({ baseUrl });
api.use(userIdMiddleware);
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/userIdMiddleware.ts src/lib/api/userIdMiddleware.test.ts src/lib/api/client.ts
git commit -m "feat(api): add X-User-Id header injection middleware (TDD)"
```

---

## Phase 2 — Utilities

### Task 10: `relativeTime` formatter (TDD)

**Files:**
- Create: `src/lib/relativeTime.ts`, `src/lib/relativeTime.test.ts`

Used in `PostListItem`, `CommentItem`, `ForumHeader`, etc.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/relativeTime.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { relativeTime } from "./relativeTime";

const NOW = new Date("2026-05-22T12:00:00Z").getTime();

describe("relativeTime", () => {
  it("'just now' for under a minute", () => {
    expect(relativeTime(new Date(NOW - 30_000), NOW)).toBe("just now");
  });

  it("minutes", () => {
    expect(relativeTime(new Date(NOW - 5 * 60_000), NOW)).toBe("5m ago");
  });

  it("hours", () => {
    expect(relativeTime(new Date(NOW - 3 * 3600_000), NOW)).toBe("3h ago");
  });

  it("days", () => {
    expect(relativeTime(new Date(NOW - 2 * 86400_000), NOW)).toBe("2d ago");
  });

  it("weeks", () => {
    expect(relativeTime(new Date(NOW - 14 * 86400_000), NOW)).toBe("2w ago");
  });

  it("falls back to a date for >= 1 year", () => {
    expect(relativeTime(new Date("2024-01-15T00:00:00Z"), NOW))
      .toMatch(/^Jan 15, 2024$/);
  });

  it("accepts ISO strings", () => {
    expect(relativeTime("2026-05-22T11:55:00Z", NOW)).toBe("5m ago");
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/lib/relativeTime.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/relativeTime.ts`:

```ts
export function relativeTime(input: Date | string, now: number = Date.now()): string {
  const then = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const diffMs = now - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (day < 365) return `${wk}w ago`;
  return new Date(then).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
```

- [ ] **Step 4: Run (should pass)**

```bash
npm run test:run -- src/lib/relativeTime.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/relativeTime.ts src/lib/relativeTime.test.ts
git commit -m "feat(lib): add relativeTime formatter (TDD)"
```

---

### Task 11: Vote state localStorage helpers (TDD)

**Files:**
- Create: `src/lib/voteState.ts`, `src/lib/voteState.test.ts`

Spec §6 "Vote state workaround" — per-user, per-entity localStorage record.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/voteState.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { getVote, setVote, getAllVotes, clearVotesForUser } from "./voteState";

describe("voteState", () => {
  beforeEach(() => localStorage.clear());

  it("returns null for unknown post", () => {
    expect(getVote("alice", "post", "p1")).toBeNull();
  });

  it("round-trips a post upvote", () => {
    setVote("alice", "post", "p1", "up");
    expect(getVote("alice", "post", "p1")).toBe("up");
  });

  it("round-trips a comment downvote", () => {
    setVote("alice", "comment", "c1", "down");
    expect(getVote("alice", "comment", "c1")).toBe("down");
  });

  it("isolates votes per user", () => {
    setVote("alice", "post", "p1", "up");
    expect(getVote("bob", "post", "p1")).toBeNull();
  });

  it("isolates posts and comments with the same id", () => {
    setVote("alice", "post", "x", "up");
    setVote("alice", "comment", "x", "down");
    expect(getVote("alice", "post", "x")).toBe("up");
    expect(getVote("alice", "comment", "x")).toBe("down");
  });

  it("returns all votes for a user", () => {
    setVote("alice", "post", "p1", "up");
    setVote("alice", "comment", "c1", "down");
    expect(getAllVotes("alice")).toEqual({ "post:p1": "up", "comment:c1": "down" });
  });

  it("returns empty object for user with no votes", () => {
    expect(getAllVotes("ghost")).toEqual({});
  });

  it("clears votes for a user", () => {
    setVote("alice", "post", "p1", "up");
    setVote("bob", "post", "p2", "up");
    clearVotesForUser("alice");
    expect(getVote("alice", "post", "p1")).toBeNull();
    expect(getVote("bob", "post", "p2")).toBe("up");
  });

  it("gracefully handles corrupt JSON", () => {
    localStorage.setItem("simple-forum:votes:alice", "{not json");
    expect(getVote("alice", "post", "p1")).toBeNull();
    expect(getAllVotes("alice")).toEqual({});
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/lib/voteState.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/voteState.ts`:

```ts
export type VoteValue = "up" | "down";
export type VoteEntity = "post" | "comment";
export type VoteMap = Record<string, VoteValue>;

const key = (userId: string) => `simple-forum:votes:${userId}`;
const entityKey = (entity: VoteEntity, id: string) => `${entity}:${id}`;

function read(userId: string): VoteMap {
  const raw = localStorage.getItem(key(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as VoteMap) : {};
  } catch {
    return {};
  }
}

function write(userId: string, map: VoteMap): void {
  localStorage.setItem(key(userId), JSON.stringify(map));
}

export function getVote(userId: string, entity: VoteEntity, id: string): VoteValue | null {
  return read(userId)[entityKey(entity, id)] ?? null;
}

export function setVote(
  userId: string,
  entity: VoteEntity,
  id: string,
  value: VoteValue,
): void {
  const map = read(userId);
  map[entityKey(entity, id)] = value;
  write(userId, map);
}

export function getAllVotes(userId: string): VoteMap {
  return read(userId);
}

export function clearVotesForUser(userId: string): void {
  localStorage.removeItem(key(userId));
}
```

- [ ] **Step 4: Run (should pass)**

```bash
npm run test:run -- src/lib/voteState.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/voteState.ts src/lib/voteState.test.ts
git commit -m "feat(lib): add per-user vote state localStorage helpers (TDD)"
```

---

## Phase 3 — Identity

### Task 12: `UserContext` + `UserProvider` + `useUser` (TDD)

**Files:**
- Create: `src/features/auth/UserContext.tsx`, `src/features/auth/useUser.ts`, `src/features/auth/UserContext.test.tsx`

The provider:
- Reads `simple-forum:user-id` from localStorage on mount
- Mirrors the userId into the API middleware via `setCurrentUserId`
- Validates `login(name)` with `/^[a-zA-Z0-9_-]{2,32}$/`, throws on invalid
- Clears localStorage **and** the TanStack Query cache on `logout` (the cache reset happens in Task 15 once we have a QueryClient; for now logout just nulls state + middleware)

- [ ] **Step 1: Write failing tests**

Create `src/features/auth/UserContext.test.tsx`:

```tsx
import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { UserProvider } from "./UserContext";
import { useUser } from "./useUser";
import { getCurrentUserId } from "@/lib/api/userIdMiddleware";

function wrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

describe("UserProvider / useUser", () => {
  beforeEach(() => localStorage.clear());

  it("starts with no user", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.userId).toBeNull();
    expect(getCurrentUserId()).toBeNull();
  });

  it("login stores the username and updates the middleware", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => result.current.login("alice"));
    expect(result.current.userId).toBe("alice");
    expect(localStorage.getItem("simple-forum:user-id")).toBe("alice");
    expect(getCurrentUserId()).toBe("alice");
  });

  it("logout clears the user and the middleware", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => result.current.login("alice"));
    act(() => result.current.logout());
    expect(result.current.userId).toBeNull();
    expect(localStorage.getItem("simple-forum:user-id")).toBeNull();
    expect(getCurrentUserId()).toBeNull();
  });

  it("rejects invalid usernames", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(() => act(() => result.current.login(""))).toThrow();
    expect(() => act(() => result.current.login("a"))).toThrow();        // < 2 chars
    expect(() => act(() => result.current.login("a".repeat(33)))).toThrow(); // > 32
    expect(() => act(() => result.current.login("bad name"))).toThrow();    // space
    expect(() => act(() => result.current.login("bad!"))).toThrow();        // symbol
  });

  it("rehydrates from localStorage on mount", () => {
    localStorage.setItem("simple-forum:user-id", "carol");
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.userId).toBe("carol");
    expect(getCurrentUserId()).toBe("carol");
  });

  it("throws if useUser is called outside the provider", () => {
    // Suppress React's expected console.error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useUser())).toThrow();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/features/auth/UserContext.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `UserContext.tsx`**

Create `src/features/auth/UserContext.tsx`:

```tsx
import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setCurrentUserId } from "@/lib/api/userIdMiddleware";

const STORAGE_KEY = "simple-forum:user-id";
const NAME_RE = /^[a-zA-Z0-9_-]{2,32}$/;

export type UserContextValue = {
  userId: string | null;
  login: (name: string) => void;
  logout: () => void;
};

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && NAME_RE.test(stored) ? stored : null;
  });

  useEffect(() => {
    setCurrentUserId(userId);
  }, [userId]);

  const value = useMemo<UserContextValue>(() => ({
    userId,
    login(name: string) {
      if (!NAME_RE.test(name)) {
        throw new Error("Username must be 2–32 chars: letters, digits, _ or -");
      }
      localStorage.setItem(STORAGE_KEY, name);
      setUserId(name);
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      setUserId(null);
    },
  }), [userId]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
```

- [ ] **Step 4: Implement `useUser.ts`**

Create `src/features/auth/useUser.ts`:

```ts
import { useContext } from "react";
import { UserContext } from "./UserContext";

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
```

- [ ] **Step 5: Run tests (should pass)**

```bash
npm run test:run -- src/features/auth/UserContext.test.tsx
```

Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/
git commit -m "feat(auth): add UserContext, UserProvider, and useUser (TDD)"
```

---

### Task 13: `useRequireUser` hook (TDD)

**Files:**
- Create: `src/features/auth/useRequireUser.ts`, `src/features/auth/useRequireUser.test.tsx`

Calls `useUser()` and, if `userId` is null, calls `navigate('/login?returnTo=…')`. Returns the userId (asserted non-null) when present.

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/useRequireUser.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { UserProvider } from "./UserContext";
import { useUser } from "./useUser";
import { useRequireUser } from "./useRequireUser";

function Wrapper({ initialPath, children }: { initialPath: string; children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <UserProvider>
        <Routes>
          <Route path="*" element={<>{children}</>} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );
}

describe("useRequireUser", () => {
  beforeEach(() => localStorage.clear());

  it("returns userId when logged in", () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    const { result } = renderHook(() => useRequireUser(), {
      wrapper: ({ children }) => <Wrapper initialPath="/submit">{children}</Wrapper>,
    });
    expect(result.current).toBe("alice");
  });

  it("navigates to /login with returnTo when logged out", () => {
    let observed = "";
    function Probe() {
      observed = useLocation().pathname + useLocation().search;
      return null;
    }
    function Caller() {
      useRequireUser();
      return null;
    }
    // Render both inside the same router so we can observe the redirect.
    renderHook(() => null, {
      wrapper: () => (
        <MemoryRouter initialEntries={["/submit"]}>
          <UserProvider>
            <Routes>
              <Route path="/submit" element={<Caller />} />
              <Route path="/login" element={<Probe />} />
            </Routes>
          </UserProvider>
        </MemoryRouter>
      ),
    });
    expect(observed).toBe("/login?returnTo=%2Fsubmit");
  });
});
```

(`react-router-dom` is not yet installed; the run in step 2 will fail twice — once for that, once for the missing implementation. We install it before implementing.)

- [ ] **Step 2: Install React Router**

```bash
npm install react-router-dom
```

- [ ] **Step 3: Run the test (should still fail — module missing)**

```bash
npm run test:run -- src/features/auth/useRequireUser.test.tsx
```

Expected: FAIL — `Cannot find module './useRequireUser'`.

- [ ] **Step 4: Implement**

Create `src/features/auth/useRequireUser.ts`:

```ts
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "./useUser";

export function useRequireUser(): string {
  const { userId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userId === null) {
      const returnTo = location.pathname + location.search;
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    }
  }, [userId, navigate, location.pathname, location.search]);

  // Callers must guard rendering on a userId being present (e.g. via `if (!userId) return null;`).
  // Returning empty string instead of throwing avoids a render-time crash during the redirect.
  return userId ?? "";
}
```

- [ ] **Step 5: Run the test (should pass)**

```bash
npm run test:run -- src/features/auth/useRequireUser.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/useRequireUser.ts src/features/auth/useRequireUser.test.tsx package.json package-lock.json
git commit -m "feat(auth): add useRequireUser redirect hook (TDD)"
```

---

### Task 14: `LoginForm` + `LoginPage`

**Files:**
- Create: `src/features/auth/LoginForm.tsx`, `src/features/auth/LoginForm.test.tsx`, `src/pages/LoginPage.tsx`

- [ ] **Step 1: Write failing tests for LoginForm**

Create `src/features/auth/LoginForm.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
import { UserProvider } from "./UserContext";

function setup(onSuccess?: () => void) {
  return render(
    <MemoryRouter>
      <UserProvider>
        <LoginForm onSuccess={onSuccess} />
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => localStorage.clear());

  it("logs in with a valid username", async () => {
    const onSuccess = vi.fn();
    setup(onSuccess);
    await userEvent.type(screen.getByLabelText(/username/i), "alice");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(localStorage.getItem("simple-forum:user-id")).toBe("alice");
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("shows an error message for an invalid username", async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/username/i), "bad name");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/2.{1,3}32 chars/i);
    expect(localStorage.getItem("simple-forum:user-id")).toBeNull();
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/features/auth/LoginForm.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `LoginForm.tsx`**

Create `src/features/auth/LoginForm.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useUser } from "./useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useUser();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      login(name.trim());
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <div className="space-y-1">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoFocus
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="alice"
        />
      </div>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full">Log in</Button>
    </form>
  );
}
```

- [ ] **Step 4: Run the test (should pass)**

```bash
npm run test:run -- src/features/auth/LoginForm.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Implement `LoginPage.tsx`**

Create `src/pages/LoginPage.tsx`:

```tsx
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const returnTo = search.get("returnTo") || "/";

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-semibold mb-2">Log in</h1>
      <p className="text-sm text-slate-600 mb-6">
        No password. Pick a username — it identifies you to the server.
      </p>
      <LoginForm onSuccess={() => navigate(returnTo, { replace: true })} />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/LoginForm.tsx src/features/auth/LoginForm.test.tsx src/pages/LoginPage.tsx
git commit -m "feat(auth): add LoginForm + LoginPage"
```

---

### Task 15: Wire QueryClient + UserProvider + Router into `App`

**Files:**
- Create: `src/lib/queryClient.ts`, `src/router.tsx`
- Modify: `src/App.tsx`, `src/features/auth/UserContext.tsx` (add cache reset on logout)

- [ ] **Step 1: Install TanStack Query**

```bash
npm install @tanstack/react-query
```

- [ ] **Step 2: Create the QueryClient**

Create `src/lib/queryClient.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});
```

- [ ] **Step 3: Have `logout()` reset the cache**

Modify `src/features/auth/UserContext.tsx`. Add an import and update the `logout` body:

```tsx
import { queryClient } from "@/lib/queryClient";
// …inside value's logout:
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      setUserId(null);
      queryClient.clear();
    },
```

- [ ] **Step 4: Create a router skeleton**

Create `src/router.tsx`:

```tsx
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

export const router = createBrowserRouter([
  { path: "/", element: <div className="p-8">Home (placeholder)</div> },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <div className="p-8">Not found (placeholder)</div> },
]);
```

- [ ] **Step 5: Wire providers into `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Re-run UserContext tests to confirm `queryClient.clear()` doesn't break them**

```bash
npm run test:run -- src/features/auth/UserContext.test.tsx
```

Expected: PASS (6 tests). The `queryClient` import is a real module — tests rely on it existing.

- [ ] **Step 7: Smoke-test in the browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected:
- Home shows "Home (placeholder)".
- Navigating to `/login` shows the login form.
- Logging in stores `simple-forum:user-id` in DevTools → Application → Local Storage; the page redirects to `/`.
- Reload `/` — still logged in (localStorage persists).

Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(app): wire QueryClient, UserProvider, and Router into App"
```

---

## Phase 4 — Routing + layout shell

### Task 16: Full route table + placeholder pages

**Files:**
- Modify: `src/router.tsx`
- Create: `src/pages/HomePage.tsx`, `src/pages/ForumPage.tsx`, `src/pages/PostPage.tsx`, `src/pages/ForumsPage.tsx`, `src/pages/CreateForumPage.tsx`, `src/pages/CreatePostPage.tsx`, `src/pages/NotFoundPage.tsx`

Each page is a temporary placeholder. We replace bodies in later phases; this gets the routing skeleton in place so navigation works.

- [ ] **Step 1: Create placeholder pages**

For each file below, write the content shown (one heading + the route's URL displayed for debug):

`src/pages/HomePage.tsx`
```tsx
export default function HomePage() {
  return <div className="p-6"><h1 className="text-xl font-semibold">Home</h1></div>;
}
```

`src/pages/ForumsPage.tsx`
```tsx
export default function ForumsPage() {
  return <div className="p-6"><h1 className="text-xl font-semibold">Forums</h1></div>;
}
```

`src/pages/ForumPage.tsx`
```tsx
import { useParams } from "react-router-dom";
export default function ForumPage() {
  const { forumName } = useParams();
  return <div className="p-6"><h1 className="text-xl font-semibold">r/{forumName}</h1></div>;
}
```

`src/pages/PostPage.tsx`
```tsx
import { useParams } from "react-router-dom";
export default function PostPage() {
  const { forumName, postId } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Post {postId}</h1>
      <p className="text-sm text-slate-600">in r/{forumName}</p>
    </div>
  );
}
```

`src/pages/CreateForumPage.tsx`
```tsx
export default function CreateForumPage() {
  return <div className="p-6"><h1 className="text-xl font-semibold">New forum</h1></div>;
}
```

`src/pages/CreatePostPage.tsx`
```tsx
export default function CreatePostPage() {
  return <div className="p-6"><h1 className="text-xl font-semibold">New post</h1></div>;
}
```

`src/pages/NotFoundPage.tsx`
```tsx
import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link className="text-blue-600 hover:underline" to="/">Back to home</Link>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/router.tsx` with the full route table**

```tsx
import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ForumsPage from "@/pages/ForumsPage";
import ForumPage from "@/pages/ForumPage";
import PostPage from "@/pages/PostPage";
import CreateForumPage from "@/pages/CreateForumPage";
import CreatePostPage from "@/pages/CreatePostPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "forums", element: <ForumsPage /> },
      { path: "forums/new", element: <CreateForumPage /> },
      { path: "submit", element: <CreatePostPage /> },
      { path: "r/:forumName", element: <ForumPage /> },
      { path: "r/:forumName/p/:postId", element: <PostPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
```

- [ ] **Step 3: Manually verify every route renders**

```bash
npm run dev
```

Visit each path; each shows its placeholder heading:
- `/`
- `/login`
- `/forums`
- `/forums/new`
- `/submit`
- `/r/programming`
- `/r/programming/p/abc123`
- `/totally-bogus` (should render NotFoundPage)

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ src/router.tsx
git commit -m "feat(router): add placeholder pages for the full route table"
```

---

### Task 17: `AppShell` layout component + integrate as router layout route

**Files:**
- Create: `src/layout/AppShell.tsx`, `src/layout/AppShell.test.tsx`
- Modify: `src/router.tsx`

The shell is a 3-region grid: top nav, left sidebar, main content `<Outlet/>`. RightRail is opt-in per page (rendered inside the page, not by the shell).

- [ ] **Step 1: Write the smoke test**

Create `src/layout/AppShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

describe("AppShell", () => {
  it("renders top nav, sidebar, and the routed child via <Outlet/>", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<div>routed child</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </UserProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();         // <header>
    expect(screen.getByRole("complementary")).toBeInTheDocument();  // <aside>
    expect(screen.getByText("routed child")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/layout/AppShell.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Stub `TopNav` and `Sidebar`**

To make AppShell renderable now, create minimal stubs. We'll replace them in T18 and T19.

Create `src/layout/TopNav.tsx`:

```tsx
export function TopNav() {
  return <header className="h-12 border-b bg-white flex items-center px-4">simple-forum</header>;
}
```

Create `src/layout/Sidebar.tsx`:

```tsx
export function Sidebar() {
  return <aside className="w-56 border-r p-4 text-sm text-slate-600">Sidebar</aside>;
}
```

- [ ] **Step 4: Implement `AppShell.tsx`**

Create `src/layout/AppShell.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test (should pass)**

```bash
npm run test:run -- src/layout/AppShell.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Use AppShell as the layout route**

Modify `src/router.tsx`:

```tsx
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/layout/AppShell";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ForumsPage from "@/pages/ForumsPage";
import ForumPage from "@/pages/ForumPage";
import PostPage from "@/pages/PostPage";
import CreateForumPage from "@/pages/CreateForumPage";
import CreatePostPage from "@/pages/CreatePostPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/forums", element: <ForumsPage /> },
      { path: "/forums/new", element: <CreateForumPage /> },
      { path: "/submit", element: <CreatePostPage /> },
      { path: "/r/:forumName", element: <ForumPage /> },
      { path: "/r/:forumName/p/:postId", element: <PostPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
```

- [ ] **Step 7: Smoke-test in browser**

```bash
npm run dev
```

Expected: every route now renders inside the shell (top nav + sidebar visible everywhere, including `/login`). Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add src/layout/ src/router.tsx
git commit -m "feat(layout): add AppShell with TopNav + Sidebar stubs"
```

---

### Task 18: Real `TopNav` (logo, search placeholder, user dropdown)

**Files:**
- Modify: `src/layout/TopNav.tsx`
- Create: `src/layout/TopNav.test.tsx`
- Possibly add: `npx shadcn@latest add dropdown-menu`

- [ ] **Step 1: Install the dropdown primitive**

```bash
npx shadcn@latest add dropdown-menu
```

- [ ] **Step 2: Write the smoke tests**

Create `src/layout/TopNav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { TopNav } from "./TopNav";
import { UserProvider } from "@/features/auth/UserContext";

function setup() {
  return render(
    <MemoryRouter>
      <UserProvider><TopNav /></UserProvider>
    </MemoryRouter>,
  );
}

describe("TopNav", () => {
  beforeEach(() => localStorage.clear());

  it("shows a Log in link when logged out", () => {
    setup();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows the username trigger when logged in", () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    setup();
    expect(screen.getByRole("button", { name: /alice/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run (should fail — implementation still the stub)**

```bash
npm run test:run -- src/layout/TopNav.test.tsx
```

Expected: FAIL — no Log in link, no username button.

- [ ] **Step 4: Implement the real TopNav**

Replace `src/layout/TopNav.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const { userId, logout } = useUser();
  return (
    <header className="h-12 border-b bg-white flex items-center px-4 gap-4">
      <Link to="/" className="font-semibold tracking-tight">simple-forum</Link>
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search (coming soon)"
          disabled
          aria-label="Search"
          className="h-8"
        />
      </div>
      <div>
        {userId ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">u/{userId}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Run the tests (should pass)**

```bash
npm run test:run -- src/layout/TopNav.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/layout/TopNav.tsx src/layout/TopNav.test.tsx src/components/ui/dropdown-menu.tsx
git commit -m "feat(layout): real TopNav with user dropdown and search placeholder"
```

---

### Task 19: Real `Sidebar` (logged-out state + structure for subscriptions)

**Files:**
- Modify: `src/layout/Sidebar.tsx`
- Create: `src/layout/Sidebar.test.tsx`

The subscriptions list comes from `useSubscriptions` (Task 39). For now, render an empty list when logged in and a "log in to subscribe" message when logged out. We'll wire data in Phase 9.

- [ ] **Step 1: Write the smoke tests**

Create `src/layout/Sidebar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

function setup() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><UserProvider><Sidebar /></UserProvider></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => { localStorage.clear(); queryClient.clear(); });

  it("always shows the Browse all and Create forum links", () => {
    setup();
    expect(screen.getByRole("link", { name: /browse all forums/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create forum/i })).toBeInTheDocument();
  });

  it("prompts to log in when logged out", () => {
    setup();
    expect(screen.getByText(/log in to subscribe/i)).toBeInTheDocument();
  });

  it("shows 'No subscriptions yet' when logged in with none", () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    setup();
    expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/layout/Sidebar.test.tsx
```

Expected: FAIL — the current stub has none of these strings.

- [ ] **Step 3: Implement the real Sidebar**

Replace `src/layout/Sidebar.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";

export function Sidebar() {
  const { userId } = useUser();
  return (
    <aside className="w-56 border-r bg-white p-4 text-sm flex flex-col gap-4">
      <section>
        <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          My Subscriptions
        </h2>
        {userId
          ? <p className="text-slate-500">No subscriptions yet</p>          // replaced in Task 42
          : <p className="text-slate-500">Log in to subscribe to forums</p>}
      </section>
      <section className="border-t pt-4 space-y-1">
        <Link to="/forums" className="block text-slate-700 hover:underline">
          Browse all forums
        </Link>
        <Link to="/forums/new" className="block text-slate-700 hover:underline">
          + Create forum
        </Link>
      </section>
    </aside>
  );
}
```

- [ ] **Step 4: Run the tests (should pass)**

```bash
npm run test:run -- src/layout/Sidebar.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/layout/Sidebar.tsx src/layout/Sidebar.test.tsx
git commit -m "feat(layout): real Sidebar with structure for subscriptions"
```

---

### Task 20: `RightRail` placeholder

**Files:**
- Create: `src/layout/RightRail.tsx`

RightRail is opt-in per page (used by ForumPage and PostPage), not in AppShell. We create a generic container that pages compose with their own content. Body is supplied by the consuming page in Phase 5+.

- [ ] **Step 1: Implement**

Create `src/layout/RightRail.tsx`:

```tsx
import type { ReactNode } from "react";

export function RightRail({ children }: { children: ReactNode }) {
  return (
    <aside className="w-72 shrink-0 border-l bg-white p-4 hidden lg:block">
      {children}
    </aside>
  );
}
```

No test in v1 — purely structural.

- [ ] **Step 2: Commit**

```bash
git add src/layout/RightRail.tsx
git commit -m "feat(layout): add RightRail container"
```

---

### Task 21: Polish `NotFoundPage`

**Files:**
- Modify: `src/pages/NotFoundPage.tsx`

Already exists from T16; this just makes it presentable inside the shell.

- [ ] **Step 1: Update**

Replace `src/pages/NotFoundPage.tsx`:

```tsx
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-24 text-center space-y-3">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-slate-600">That page doesn't exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">Back to home</Link>
    </div>
  );
}
```

- [ ] **Step 2: Visual check**

```bash
npm run dev
```

Visit `/nope`. Expected: centered 404 in the app shell. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/NotFoundPage.tsx
git commit -m "chore: polish NotFoundPage"
```

---

## Phase 5 — Forums (read)

### Task 22: `useForums` and `useForum` query hooks

**Files:**
- Create: `src/features/forums/useForums.ts`, `src/features/forums/useForum.ts`, `src/features/forums/useForums.test.ts`

We use TanStack Query directly; the api client is mocked in tests.

- [ ] **Step 1: Write failing tests**

Create `src/features/forums/useForums.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForums } from "./useForums";
import { useForum } from "./useForum";

vi.mock("@/lib/api/client", () => ({
  api: {
    GET: vi.fn(),
  },
}));

const { api } = await import("@/lib/api/client");
const mockedGet = vi.mocked(api.GET);

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => mockedGet.mockReset());

describe("useForums", () => {
  it("fetches and returns the forum list", async () => {
    mockedGet.mockResolvedValueOnce({
      data: [{ name: "programming", description: "code", createdBy: "alice",
              createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
              subscriberCount: 3 }],
      error: undefined,
      response: new Response(),
    } as any);

    const { result } = renderHook(() => useForums(), {
      wrapper: wrapperFor(new QueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(mockedGet).toHaveBeenCalledWith("/api/forums", {});
  });
});

describe("useForum", () => {
  it("fetches a single forum by name", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { name: "programming", description: "code", createdBy: "alice",
              createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
              subscriberCount: 0 },
      error: undefined,
      response: new Response(),
    } as any);

    const { result } = renderHook(() => useForum("programming"), {
      wrapper: wrapperFor(new QueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("programming");
    expect(mockedGet).toHaveBeenCalledWith("/api/forums/{name}", {
      params: { path: { name: "programming" } },
    });
  });
});
```

- [ ] **Step 2: Run (should fail)**

```bash
npm run test:run -- src/features/forums/useForums.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `useForums.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useForums() {
  return useQuery({
    queryKey: ["forums"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/forums", {});
      if (error) throw new Error("Failed to load forums");
      return data!;
    },
  });
}
```

- [ ] **Step 4: Implement `useForum.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useForum(name: string) {
  return useQuery({
    queryKey: ["forums", name],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/forums/{name}", {
        params: { path: { name } },
      });
      if (error) throw new Error("Failed to load forum");
      return data!;
    },
    enabled: Boolean(name),
  });
}
```

- [ ] **Step 5: Run (should pass)**

```bash
npm run test:run -- src/features/forums/useForums.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/forums/
git commit -m "feat(forums): add useForums and useForum query hooks (TDD)"
```

---

### Task 23: `ForumListItem` component

**Files:**
- Create: `src/features/forums/ForumListItem.tsx`, `src/features/forums/ForumListItem.test.tsx`

- [ ] **Step 1: Write the smoke test**

Create `src/features/forums/ForumListItem.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ForumListItem } from "./ForumListItem";

const forum = {
  name: "programming",
  description: "Code, code, and more code.",
  createdBy: "alice",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  subscriberCount: 42,
};

describe("ForumListItem", () => {
  it("renders the forum name, description, and subscriber count", () => {
    render(<MemoryRouter><ForumListItem forum={forum} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /programming/i })).toHaveAttribute(
      "href", "/r/programming",
    );
    expect(screen.getByText(/code, code, and more code/i)).toBeInTheDocument();
    expect(screen.getByText(/42 subscribers/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/forums/ForumListItem.test.tsx
```

- [ ] **Step 3: Implement**

Create `src/features/forums/ForumListItem.tsx`:

```tsx
import { Link } from "react-router-dom";
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function ForumListItem({ forum }: { forum: Forum }) {
  return (
    <article className="border-b border-slate-200 py-3 px-2 hover:bg-slate-50">
      <Link to={`/r/${forum.name}`} className="font-semibold text-slate-900 hover:underline">
        r/{forum.name}
      </Link>
      {forum.description && (
        <p className="text-sm text-slate-600 mt-1">{forum.description}</p>
      )}
      <p className="text-xs text-slate-500 mt-1">
        {forum.subscriberCount ?? 0} subscribers
      </p>
    </article>
  );
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/forums/ForumListItem.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/features/forums/ForumListItem.tsx src/features/forums/ForumListItem.test.tsx
git commit -m "feat(forums): add ForumListItem component"
```

---

### Task 24: `ForumsPage` (directory)

**Files:**
- Modify: `src/pages/ForumsPage.tsx`

- [ ] **Step 1: Implement**

Replace `src/pages/ForumsPage.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useForums } from "@/features/forums/useForums";
import { ForumListItem } from "@/features/forums/ForumListItem";
import { Button } from "@/components/ui/button";

export default function ForumsPage() {
  const { data, isLoading, isError, refetch } = useForums();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Forums</h1>
        <Button asChild><Link to="/forums/new">+ Create forum</Link></Button>
      </div>

      {isLoading && <p className="text-slate-500">Loading forums…</p>}
      {isError && (
        <div className="text-slate-600 space-y-2">
          <p>Couldn't load forums.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {data && data.length === 0 && <p className="text-slate-500">No forums yet — be the first to create one.</p>}
      {data && data.length > 0 && (
        <div>
          {data.map((forum) => <ForumListItem key={forum.name} forum={forum} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders with the real backend**

```bash
npm run dev
```

Visit `/forums`. Expected (with backend running): list of forums, or "No forums yet". Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ForumsPage.tsx
git commit -m "feat(forums): wire ForumsPage to useForums + ForumListItem"
```

---

### Task 25: `ForumHeader` component

**Files:**
- Create: `src/features/forums/ForumHeader.tsx`, `src/features/forums/ForumHeader.test.tsx`

Displays the forum name, description, created-by, and a "Subscribe" button stub (real button comes in T40).

- [ ] **Step 1: Smoke test**

Create `src/features/forums/ForumHeader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ForumHeader } from "./ForumHeader";

const forum = {
  name: "programming", description: "Code-land.", createdBy: "alice",
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  subscriberCount: 100,
};

describe("ForumHeader", () => {
  it("renders forum metadata", () => {
    render(<ForumHeader forum={forum} />);
    expect(screen.getByRole("heading", { name: /r\/programming/i })).toBeInTheDocument();
    expect(screen.getByText(/code-land/i)).toBeInTheDocument();
    expect(screen.getByText(/created by u\/alice/i)).toBeInTheDocument();
    expect(screen.getByText(/100 subscribers/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/forums/ForumHeader.test.tsx
```

- [ ] **Step 3: Implement**

Create `src/features/forums/ForumHeader.tsx`:

```tsx
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function ForumHeader({ forum }: { forum: Forum }) {
  return (
    <header className="bg-white border-b border-slate-200 p-6">
      <h1 className="text-2xl font-semibold">r/{forum.name}</h1>
      {forum.description && (
        <p className="text-slate-700 mt-2">{forum.description}</p>
      )}
      <p className="text-xs text-slate-500 mt-3">
        Created by u/{forum.createdBy} · {forum.subscriberCount ?? 0} subscribers
      </p>
    </header>
  );
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/forums/ForumHeader.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/features/forums/ForumHeader.tsx src/features/forums/ForumHeader.test.tsx
git commit -m "feat(forums): add ForumHeader component"
```

---

### Task 26: `ForumPage` skeleton (header only, posts wired in T31)

**Files:**
- Modify: `src/pages/ForumPage.tsx`

- [ ] **Step 1: Implement**

Replace `src/pages/ForumPage.tsx`:

```tsx
import { useParams } from "react-router-dom";
import { useForum } from "@/features/forums/useForum";
import { ForumHeader } from "@/features/forums/ForumHeader";
import NotFoundPage from "./NotFoundPage";

export default function ForumPage() {
  const { forumName } = useParams<{ forumName: string }>();
  const { data: forum, isLoading, isError, error } = useForum(forumName ?? "");

  if (!forumName) return <NotFoundPage />;
  if (isLoading) return <p className="p-6 text-slate-500">Loading forum…</p>;
  if (isError && /not found/i.test(String(error))) return <NotFoundPage />;
  if (isError || !forum) return <p className="p-6 text-slate-600">Couldn't load r/{forumName}.</p>;

  return (
    <div>
      <ForumHeader forum={forum} />
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-slate-500">Posts list — coming in Task 31.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Browser check**

```bash
npm run dev
```

Visit `/r/<some-real-forum>` (backend running). Expected: header + placeholder. Visit `/r/nonexistent`. Expected: NotFoundPage. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ForumPage.tsx
git commit -m "feat(forums): wire ForumPage to useForum + ForumHeader"
```

---

## Phase 6 — Posts (read)

### Task 27: `usePosts`, `usePost`, `useForumPosts` query hooks

**Files:**
- Create: `src/features/posts/usePosts.ts`, `src/features/posts/usePost.ts`, `src/features/posts/useForumPosts.ts`, `src/features/posts/usePosts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/posts/usePosts.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePosts } from "./usePosts";
import { usePost } from "./usePost";
import { useForumPosts } from "./useForumPosts";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedGet = vi.mocked(api.GET);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

beforeEach(() => mockedGet.mockReset());

const samplePost = {
  id: "p1", title: "Hi", content: "Body", userId: "alice",
  forumName: "general", createdAt: "2026-05-22T11:00:00Z",
  updatedAt: "2026-05-22T11:00:00Z",
  upvoteCount: 1, downvoteCount: 0, commentCount: 0,
};

describe("post query hooks", () => {
  it("usePosts calls /api/posts", async () => {
    mockedGet.mockResolvedValueOnce({ data: [samplePost], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => usePosts(), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith("/api/posts", {});
  });

  it("usePost calls /api/posts/{id}", async () => {
    mockedGet.mockResolvedValueOnce({ data: samplePost, error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => usePost("p1"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith("/api/posts/{id}", { params: { path: { id: "p1" } } });
  });

  it("useForumPosts calls /api/forums/{name}/posts", async () => {
    mockedGet.mockResolvedValueOnce({ data: [samplePost], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useForumPosts("general"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith("/api/forums/{name}/posts", {
      params: { path: { name: "general" } },
    });
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/posts/usePosts.test.ts
```

- [ ] **Step 3: Implement the three hooks**

`src/features/posts/usePosts.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/posts", {});
      if (error) throw new Error("Failed to load posts");
      return data!;
    },
  });
}
```

`src/features/posts/usePost.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function usePost(id: string) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/posts/{id}", { params: { path: { id } } });
      if (error) throw new Error("Failed to load post");
      return data!;
    },
    enabled: Boolean(id),
  });
}
```

`src/features/posts/useForumPosts.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useForumPosts(name: string) {
  return useQuery({
    queryKey: ["forums", name, "posts"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/forums/{name}/posts", {
        params: { path: { name } },
      });
      if (error) throw new Error("Failed to load posts");
      return data!;
    },
    enabled: Boolean(name),
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/posts/usePosts.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/posts/usePosts.ts src/features/posts/usePost.ts src/features/posts/useForumPosts.ts src/features/posts/usePosts.test.ts
git commit -m "feat(posts): add usePosts, usePost, useForumPosts query hooks (TDD)"
```

---

### Task 28: `PostListItem` component (no vote interaction yet, comment count visible)

**Files:**
- Create: `src/features/posts/PostListItem.tsx`, `src/features/posts/PostListItem.test.tsx`, `src/features/posts/VoteScore.tsx`

Reddit-Classic feed item: vote score on the left (read-only for now), byline + title + snippet + comment count to the right. The `VoteButtons` interactive component lands in T37; for now we render a `VoteScore` stub.

- [ ] **Step 1: Smoke test**

Create `src/features/posts/PostListItem.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PostListItem } from "./PostListItem";

const post = {
  id: "p1", title: "Just shipped my first OSS lib", content: "After six months…",
  userId: "alice", forumName: "programming",
  createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  updatedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  upvoteCount: 142, downvoteCount: 3, commentCount: 12,
};

describe("PostListItem", () => {
  it("renders the score (up - down), byline, title, snippet, and comment count", () => {
    render(<MemoryRouter><PostListItem post={post} /></MemoryRouter>);
    expect(screen.getByText("139")).toBeInTheDocument();          // 142 - 3
    expect(screen.getByText(/r\/programming/i)).toBeInTheDocument();
    expect(screen.getByText(/u\/alice/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /just shipped my first oss lib/i }))
      .toHaveAttribute("href", "/r/programming/p/p1");
    expect(screen.getByText(/12 comments/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/posts/PostListItem.test.tsx
```

- [ ] **Step 3: Implement `VoteScore.tsx`**

Create `src/features/posts/VoteScore.tsx`:

```tsx
export function VoteScore({ score }: { score: number }) {
  return (
    <div className="w-10 flex flex-col items-center text-xs text-slate-500">
      <span aria-hidden>▲</span>
      <span className="font-bold text-sm text-slate-800 my-0.5">{score}</span>
      <span aria-hidden>▼</span>
    </div>
  );
}
```

- [ ] **Step 4: Implement `PostListItem.tsx`**

Create `src/features/posts/PostListItem.tsx`:

```tsx
import { Link } from "react-router-dom";
import { relativeTime } from "@/lib/relativeTime";
import type { components } from "@/lib/api/schema";
import { VoteScore } from "./VoteScore";

type Post = components["schemas"]["PostResponse"];

export function PostListItem({ post }: { post: Post }) {
  const score = (post.upvoteCount ?? 0) - (post.downvoteCount ?? 0);
  return (
    <article className="flex border-b border-slate-200 bg-white px-2 py-2 hover:bg-slate-50">
      <VoteScore score={score} />
      <div className="flex-1 pl-2 min-w-0">
        <div className="text-xs text-slate-500">
          <Link to={`/r/${post.forumName}`} className="hover:underline">
            r/{post.forumName}
          </Link>
          {" · posted by "}
          <span>u/{post.userId}</span>
          {post.createdAt && ` · ${relativeTime(post.createdAt)}`}
        </div>
        <Link
          to={`/r/${post.forumName}/p/${post.id}`}
          className="block font-medium text-slate-900 hover:underline truncate"
        >
          {post.title}
        </Link>
        {post.content && (
          <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{post.content}</p>
        )}
        <div className="mt-1 text-xs text-slate-500">
          <Link
            to={`/r/${post.forumName}/p/${post.id}#comments`}
            className="hover:underline"
          >
            💬 {post.commentCount ?? 0} comments
          </Link>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Run (passes)**

```bash
npm run test:run -- src/features/posts/PostListItem.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/features/posts/PostListItem.tsx src/features/posts/PostListItem.test.tsx src/features/posts/VoteScore.tsx
git commit -m "feat(posts): add PostListItem with VoteScore + comment count badge"
```

---

### Task 29: `HomePage` — wire the feed

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Implement**

Replace `src/pages/HomePage.tsx`:

```tsx
import { usePosts } from "@/features/posts/usePosts";
import { PostListItem } from "@/features/posts/PostListItem";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data, isLoading, isError, refetch } = usePosts();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="sr-only">Home</h1>
      {isLoading && <p className="text-slate-500">Loading posts…</p>}
      {isError && (
        <div className="text-slate-600 space-y-2">
          <p>Couldn't load posts.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {data && data.length === 0 && (
        <p className="text-slate-500">No posts yet — visit a forum and create one.</p>
      )}
      {data && data.length > 0 && (
        <div className="bg-white rounded border border-slate-200 divide-y">
          {data.map((post) => <PostListItem key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Browser check**

```bash
npm run dev
```

Visit `/`. Expected: real posts (if any) from the backend. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(posts): wire HomePage to usePosts + PostListItem"
```

---

### Task 30: `PostPage` skeleton (post body only — comments wired in T48)

**Files:**
- Modify: `src/pages/PostPage.tsx`

- [ ] **Step 1: Implement**

Replace `src/pages/PostPage.tsx`:

```tsx
import { useParams } from "react-router-dom";
import { usePost } from "@/features/posts/usePost";
import { useForum } from "@/features/forums/useForum";
import { ForumHeader } from "@/features/forums/ForumHeader";
import { VoteScore } from "@/features/posts/VoteScore";
import { relativeTime } from "@/lib/relativeTime";
import { RightRail } from "@/layout/RightRail";
import NotFoundPage from "./NotFoundPage";

export default function PostPage() {
  const { forumName, postId } = useParams<{ forumName: string; postId: string }>();
  const post = usePost(postId ?? "");
  const forum = useForum(forumName ?? "");

  if (!postId || !forumName) return <NotFoundPage />;
  if (post.isLoading) return <p className="p-6 text-slate-500">Loading post…</p>;
  if (post.isError || !post.data) return <NotFoundPage />;

  const score = (post.data.upvoteCount ?? 0) - (post.data.downvoteCount ?? 0);

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 max-w-3xl mx-auto p-6">
        <article className="bg-white border rounded p-4">
          <div className="flex">
            <VoteScore score={score} />
            <div className="pl-3 flex-1 min-w-0">
              <p className="text-xs text-slate-500">
                r/{post.data.forumName} · posted by u/{post.data.userId}
                {post.data.createdAt && ` · ${relativeTime(post.data.createdAt)}`}
              </p>
              <h1 className="text-2xl font-semibold mt-1">{post.data.title}</h1>
              <p className="mt-3 whitespace-pre-wrap text-slate-800">{post.data.content}</p>
            </div>
          </div>
        </article>
        <section id="comments" className="mt-6">
          <p className="text-slate-500">{post.data.commentCount ?? 0} comments — coming in Task 48.</p>
        </section>
      </div>
      <RightRail>
        {forum.data && <ForumHeader forum={forum.data} />}
      </RightRail>
    </div>
  );
}
```

- [ ] **Step 2: Browser check**

```bash
npm run dev
```

Visit `/r/<forum>/p/<postId>` for a real post. Expected: post body + RightRail with forum header. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PostPage.tsx
git commit -m "feat(posts): wire PostPage skeleton (body + RightRail)"
```

---

### Task 31: Wire `useForumPosts` into `ForumPage`

**Files:**
- Modify: `src/pages/ForumPage.tsx`

- [ ] **Step 1: Replace the placeholder**

Update `src/pages/ForumPage.tsx`:

```tsx
import { Link, useParams } from "react-router-dom";
import { useForum } from "@/features/forums/useForum";
import { ForumHeader } from "@/features/forums/ForumHeader";
import { useForumPosts } from "@/features/posts/useForumPosts";
import { PostListItem } from "@/features/posts/PostListItem";
import { Button } from "@/components/ui/button";
import NotFoundPage from "./NotFoundPage";

export default function ForumPage() {
  const { forumName } = useParams<{ forumName: string }>();
  const forum = useForum(forumName ?? "");
  const posts = useForumPosts(forumName ?? "");

  if (!forumName) return <NotFoundPage />;
  if (forum.isLoading) return <p className="p-6 text-slate-500">Loading forum…</p>;
  if (forum.isError || !forum.data) return <NotFoundPage />;

  return (
    <div>
      <ForumHeader forum={forum.data} />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-end mb-3">
          <Button asChild><Link to={`/submit?forum=${forumName}`}>+ New post</Link></Button>
        </div>
        {posts.isLoading && <p className="text-slate-500">Loading posts…</p>}
        {posts.isError && <p className="text-slate-600">Couldn't load posts.</p>}
        {posts.data && posts.data.length === 0 && (
          <p className="text-slate-500">No posts in r/{forumName} yet.</p>
        )}
        {posts.data && posts.data.length > 0 && (
          <div className="bg-white rounded border border-slate-200 divide-y">
            {posts.data.map((post) => <PostListItem key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Browser check**

```bash
npm run dev
```

Visit `/r/<forum>`. Expected: header + posts list + "New post" button. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ForumPage.tsx
git commit -m "feat(posts): wire forum posts list into ForumPage"
```

---

## Phase 7 — Forums + posts (write)

### Task 32: `useCreateForum` mutation

**Files:**
- Create: `src/features/forums/useCreateForum.ts`, `src/features/forums/useCreateForum.test.ts`

- [ ] **Step 1: Failing test**

Create `src/features/forums/useCreateForum.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateForum } from "./useCreateForum";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);

beforeEach(() => mockedPost.mockReset());

describe("useCreateForum", () => {
  it("POSTs body and invalidates forums query", async () => {
    const qc = new QueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const created = {
      name: "rust", description: "Rustaceans",
      createdBy: "alice", createdAt: "x", updatedAt: "x", subscriberCount: 0,
    };
    mockedPost.mockResolvedValueOnce({ data: created, error: undefined, response: new Response() } as any);

    const { result } = renderHook(() => useCreateForum(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    const promise = result.current.mutateAsync({ name: "rust", description: "Rustaceans" });
    const returned = await promise;

    expect(mockedPost).toHaveBeenCalledWith("/api/forums", {
      body: { name: "rust", description: "Rustaceans" },
    });
    expect(returned).toEqual(created);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["forums"] }));
  });

  it("throws on API error", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: { message: "Conflict" }, response: new Response() } as any);
    const { result } = renderHook(() => useCreateForum(), {
      wrapper: ({ children }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>,
    });
    await expect(result.current.mutateAsync({ name: "x", description: "y" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/forums/useCreateForum.test.ts
```

- [ ] **Step 3: Implement**

Create `src/features/forums/useCreateForum.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Req = components["schemas"]["ForumRequest"];

export function useCreateForum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Req) => {
      const { data, error } = await api.POST("/api/forums", { body });
      if (error) throw new Error("Failed to create forum");
      return data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forums"] });
    },
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/forums/useCreateForum.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/forums/useCreateForum.ts src/features/forums/useCreateForum.test.ts
git commit -m "feat(forums): add useCreateForum mutation hook (TDD)"
```

---

### Task 33: `CreateForumPage` with form

**Files:**
- Modify: `src/pages/CreateForumPage.tsx`

Form has `name` (3-30 chars, `[a-zA-Z0-9_-]`) and `description` (required, ≤ 200 chars). Auth-gated via `useRequireUser`. On success: navigate to `/r/<name>`.

- [ ] **Step 1: Implement**

Replace `src/pages/CreateForumPage.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireUser } from "@/features/auth/useRequireUser";
import { useCreateForum } from "@/features/forums/useCreateForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const NAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export default function CreateForumPage() {
  const userId = useRequireUser();
  const navigate = useNavigate();
  const create = useCreateForum();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!userId) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!NAME_RE.test(name)) {
      setValidationError("Name: 3-30 chars, letters/digits/_/-");
      return;
    }
    if (!description.trim()) {
      setValidationError("Description is required");
      return;
    }
    if (description.length > 200) {
      setValidationError("Description must be 200 characters or fewer");
      return;
    }
    create.mutate(
      { name, description: description.trim() },
      { onSuccess: (forum) => navigate(`/r/${forum.name}`) },
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create a new forum</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forum-name">Name</Label>
          <Input
            id="forum-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="programming"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="forum-desc">Description</Label>
          <Textarea
            id="forum-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this forum about?"
            rows={3}
          />
          <p className="text-xs text-slate-500">{description.length}/200</p>
        </div>
        {(validationError || create.isError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {validationError ?? "Couldn't create the forum (name may be taken)."}
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create forum"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Browser smoke test**

```bash
npm run dev
```

Log in, visit `/forums/new`, fill the form, submit. Expected: redirected to `/r/<your-forum>`. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CreateForumPage.tsx
git commit -m "feat(forums): implement CreateForumPage with form + validation"
```

---

### Task 34: `useCreatePost` mutation

**Files:**
- Create: `src/features/posts/useCreatePost.ts`, `src/features/posts/useCreatePost.test.ts`

- [ ] **Step 1: Failing test**

Create `src/features/posts/useCreatePost.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreatePost } from "./useCreatePost";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);

beforeEach(() => mockedPost.mockReset());

describe("useCreatePost", () => {
  it("POSTs body and invalidates posts + that forum's posts", async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const created = {
      id: "p1", title: "Hi", content: "Body", userId: "alice",
      forumName: "programming",
      createdAt: "x", updatedAt: "x",
      upvoteCount: 0, downvoteCount: 0, commentCount: 0,
    };
    mockedPost.mockResolvedValueOnce({ data: created, error: undefined, response: new Response() } as any);

    const { result } = renderHook(() => useCreatePost(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });

    const returned = await result.current.mutateAsync({
      title: "Hi", content: "Body", forumName: "programming",
    });

    expect(mockedPost).toHaveBeenCalledWith("/api/posts", {
      body: { title: "Hi", content: "Body", forumName: "programming" },
    });
    expect(returned.id).toBe("p1");
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ["posts"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["forums", "programming", "posts"] });
    });
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/posts/useCreatePost.test.ts
```

- [ ] **Step 3: Implement**

Create `src/features/posts/useCreatePost.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Req = components["schemas"]["PostRequest"];

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Req) => {
      const { data, error } = await api.POST("/api/posts", { body });
      if (error) throw new Error("Failed to create post");
      return data!;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["forums", created.forumName, "posts"] });
    },
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/posts/useCreatePost.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/posts/useCreatePost.ts src/features/posts/useCreatePost.test.ts
git commit -m "feat(posts): add useCreatePost mutation hook (TDD)"
```

---

### Task 35: `CreatePostPage` with form

**Files:**
- Modify: `src/pages/CreatePostPage.tsx`

Pre-selects `forum` from `?forum=` query param. Forum chooser: simple `<select>` populated from `useForums()`.

- [ ] **Step 1: Implement**

Replace `src/pages/CreatePostPage.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRequireUser } from "@/features/auth/useRequireUser";
import { useForums } from "@/features/forums/useForums";
import { useCreatePost } from "@/features/posts/useCreatePost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreatePostPage() {
  const userId = useRequireUser();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const forums = useForums();
  const create = useCreatePost();

  const initialForum = search.get("forum") ?? "";
  const [forumName, setForumName] = useState(initialForum);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!forumName && initialForum) setForumName(initialForum);
  }, [forumName, initialForum]);

  if (!userId) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!forumName) return setValidationError("Pick a forum");
    if (title.trim().length < 3 || title.length > 300) {
      return setValidationError("Title must be 3-300 characters");
    }
    if (!content.trim()) return setValidationError("Content is required");
    create.mutate(
      { title: title.trim(), content: content.trim(), forumName },
      { onSuccess: (p) => navigate(`/r/${p.forumName}/p/${p.id}`) },
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create a new post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forum">Forum</Label>
          <select
            id="forum"
            value={forumName}
            onChange={(e) => setForumName(e.target.value)}
            className="border rounded h-9 w-full px-2 bg-white"
          >
            <option value="">— pick a forum —</option>
            {forums.data?.map((f) => (
              <option key={f.name} value={f.name}>r/{f.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        {(validationError || create.isError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {validationError ?? "Couldn't create the post."}
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Posting…" : "Post"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Browser smoke test**

```bash
npm run dev
```

Log in, visit `/submit?forum=<existing>` (or `/submit`), fill form, submit. Expected: redirected to the new post's page. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CreatePostPage.tsx
git commit -m "feat(posts): implement CreatePostPage with form + validation"
```

---

## Phase 8 — Voting on posts

### Task 36: `useVotePost` mutation with optimistic updates (TDD)

**Files:**
- Create: `src/features/posts/useVotePost.ts`, `src/features/posts/useVotePost.test.ts`

The mutation:
1. Pre-flight: read current `getVote("post", id)` — if same direction, **no-op** (no API call, no state change).
2. Optimistic: write `setVote(userId, "post", id, direction)`; patch the cached `PostResponse`(s) for this post.
3. On success: leave optimistic state.
4. On error: rollback the localStorage and cache changes.

- [ ] **Step 1: Failing tests**

Create `src/features/posts/useVotePost.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVotePost } from "./useVotePost";
import { setVote, getVote } from "@/lib/voteState";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);

const post = {
  id: "p1", title: "Hi", content: "x", userId: "bob",
  forumName: "general", createdAt: "x", updatedAt: "x",
  upvoteCount: 5, downvoteCount: 1, commentCount: 0,
};

function setup(userId = "alice") {
  const qc = new QueryClient();
  qc.setQueryData(["posts", "p1"], post);
  qc.setQueryData(["posts"], [post]);
  qc.setQueryData(["forums", "general", "posts"], [post]);
  const { result } = renderHook(() => useVotePost(userId), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  return { qc, result };
}

beforeEach(() => {
  mockedPost.mockReset();
  localStorage.clear();
});

describe("useVotePost", () => {
  it("optimistic upvote: bumps cached count and saves local vote", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => {
      expect((qc.getQueryData(["posts", "p1"]) as any).upvoteCount).toBe(6);
    });
    expect(getVote("alice", "post", "p1")).toBe("up");
    expect(mockedPost).toHaveBeenCalledWith("/api/posts/{id}/upvote", {
      params: { path: { id: "p1" } },
    });
  });

  it("no-op when clicking same direction twice", async () => {
    setVote("alice", "post", "p1", "up");
    const { result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    // Yield a tick — no api call should occur
    await new Promise((r) => setTimeout(r, 0));
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("downvote after upvote: decrements up, increments down", async () => {
    setVote("alice", "post", "p1", "up");
    mockedPost.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "down" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(4);
      expect(p.downvoteCount).toBe(2);
    });
    expect(getVote("alice", "post", "p1")).toBe("down");
  });

  it("rolls back optimistic update on API error", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: { message: "boom" }, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(5);   // back to original
    });
    expect(getVote("alice", "post", "p1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/posts/useVotePost.test.ts
```

- [ ] **Step 3: Implement `useVotePost.ts`**

Create `src/features/posts/useVotePost.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getVote, setVote } from "@/lib/voteState";
import type { components } from "@/lib/api/schema";
import type { VoteValue } from "@/lib/voteState";

type Post = components["schemas"]["PostResponse"];
type Variables = { postId: string; forumName: string; direction: VoteValue };

type Snapshot = {
  post: Post | undefined;
  posts: Post[] | undefined;
  forumPosts: Post[] | undefined;
  prevVote: VoteValue | null;
};

function applyDelta(post: Post, prev: VoteValue | null, next: VoteValue): Post {
  let up = post.upvoteCount ?? 0;
  let down = post.downvoteCount ?? 0;
  if (prev === "up") up -= 1;
  if (prev === "down") down -= 1;
  if (next === "up") up += 1;
  if (next === "down") down += 1;
  return { ...post, upvoteCount: up, downvoteCount: down };
}

export function useVotePost(userId: string | null) {
  const qc = useQueryClient();

  return useMutation<void, Error, Variables, Snapshot>({
    async mutationFn(vars) {
      const path = vars.direction === "up" ? "/api/posts/{id}/upvote" : "/api/posts/{id}/downvote";
      const { error } = await api.POST(path, { params: { path: { id: vars.postId } } });
      if (error) throw new Error("Vote failed");
    },
    async onMutate(vars) {
      if (!userId) throw new Error("Must be logged in to vote");
      const prevVote = getVote(userId, "post", vars.postId);
      if (prevVote === vars.direction) {
        // Cancel the mutation by throwing — TanStack treats it as an error.
        // We use a sentinel error and swallow it in the component.
        throw new Error("__noop__");
      }
      await qc.cancelQueries({ queryKey: ["posts"] });
      await qc.cancelQueries({ queryKey: ["forums", vars.forumName, "posts"] });

      const snap: Snapshot = {
        post: qc.getQueryData<Post>(["posts", vars.postId]),
        posts: qc.getQueryData<Post[]>(["posts"]),
        forumPosts: qc.getQueryData<Post[]>(["forums", vars.forumName, "posts"]),
        prevVote,
      };

      const patchOne = (p: Post) => p.id === vars.postId ? applyDelta(p, prevVote, vars.direction) : p;
      if (snap.post) qc.setQueryData(["posts", vars.postId], applyDelta(snap.post, prevVote, vars.direction));
      if (snap.posts) qc.setQueryData(["posts"], snap.posts.map(patchOne));
      if (snap.forumPosts) qc.setQueryData(["forums", vars.forumName, "posts"], snap.forumPosts.map(patchOne));

      setVote(userId, "post", vars.postId, vars.direction);
      return snap;
    },
    onError(_err, vars, snap) {
      if (!snap) return;
      if (snap.post !== undefined) qc.setQueryData(["posts", vars.postId], snap.post);
      if (snap.posts !== undefined) qc.setQueryData(["posts"], snap.posts);
      if (snap.forumPosts !== undefined)
        qc.setQueryData(["forums", vars.forumName, "posts"], snap.forumPosts);
      if (userId) {
        if (snap.prevVote === null) {
          // Remove the just-written vote (overwrite map directly).
          const raw = localStorage.getItem(`simple-forum:votes:${userId}`);
          if (raw) {
            try {
              const map = JSON.parse(raw) as Record<string, VoteValue>;
              delete map[`post:${vars.postId}`];
              localStorage.setItem(`simple-forum:votes:${userId}`, JSON.stringify(map));
            } catch { /* ignore */ }
          }
        } else {
          setVote(userId, "post", vars.postId, snap.prevVote);
        }
      }
    },
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/posts/useVotePost.test.ts
```

Expected: PASS (4 tests). The "no-op when clicking same direction twice" test relies on the `__noop__` error not triggering the API call — the implementation throws *before* `mutationFn` runs (in `onMutate`), so `api.POST` is never called.

- [ ] **Step 5: Commit**

```bash
git add src/features/posts/useVotePost.ts src/features/posts/useVotePost.test.ts
git commit -m "feat(posts): add useVotePost with optimistic updates and rollback (TDD)"
```

---

### Task 37: `VoteButtons` component (post version)

**Files:**
- Create: `src/features/posts/VoteButtons.tsx`, `src/features/posts/VoteButtons.test.tsx`

Replaces `VoteScore` in the click-able post contexts. Reads the local vote to highlight the active arrow. Auth-gated (logged-out users get redirected to `/login`).

- [ ] **Step 1: Smoke test**

Create `src/features/posts/VoteButtons.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { VoteButtons } from "./VoteButtons";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

function setup(loggedIn = true) {
  if (loggedIn) localStorage.setItem("simple-forum:user-id", "alice");
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserProvider>
          <VoteButtons postId="p1" forumName="general" score={5} />
        </UserProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VoteButtons", () => {
  beforeEach(() => { localStorage.clear(); queryClient.clear(); });

  it("renders both arrows and the score", () => {
    setup();
    expect(screen.getByRole("button", { name: /upvote/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /downvote/i })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders disabled-looking arrows when logged out (Link to /login)", () => {
    setup(false);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href")?.startsWith("/login"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/posts/VoteButtons.test.tsx
```

- [ ] **Step 3: Implement**

Create `src/features/posts/VoteButtons.tsx`:

```tsx
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";
import { useVotePost } from "./useVotePost";
import { getVote } from "@/lib/voteState";

export function VoteButtons({
  postId, forumName, score,
}: { postId: string; forumName: string; score: number }) {
  const { userId } = useUser();
  const location = useLocation();
  const mutation = useVotePost(userId);
  const myVote = userId ? getVote(userId, "post", postId) : null;

  if (!userId) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return (
      <div className="w-10 flex flex-col items-center text-xs text-slate-400">
        <Link to={`/login?returnTo=${returnTo}`} aria-label="Log in to upvote">▲</Link>
        <span className="font-bold text-sm text-slate-700 my-0.5">{score}</span>
        <Link to={`/login?returnTo=${returnTo}`} aria-label="Log in to downvote">▼</Link>
      </div>
    );
  }

  function vote(direction: "up" | "down") {
    mutation.mutate({ postId, forumName, direction }, {
      onError(err) {
        if (err.message === "__noop__") return; // expected: already voted that way
        // Real errors silently swallowed here; the cache rollback already happened.
      },
    });
  }

  return (
    <div className="w-10 flex flex-col items-center text-xs">
      <button
        type="button"
        aria-label="Upvote"
        onClick={() => vote("up")}
        className={myVote === "up" ? "text-orange-500" : "text-slate-500 hover:text-orange-500"}
      >▲</button>
      <span className="font-bold text-sm text-slate-800 my-0.5">{score}</span>
      <button
        type="button"
        aria-label="Downvote"
        onClick={() => vote("down")}
        className={myVote === "down" ? "text-blue-500" : "text-slate-500 hover:text-blue-500"}
      >▼</button>
    </div>
  );
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/posts/VoteButtons.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/features/posts/VoteButtons.tsx src/features/posts/VoteButtons.test.tsx
git commit -m "feat(posts): add VoteButtons component (logged-in interactive, logged-out → /login)"
```

---

### Task 38: Wire `VoteButtons` into `PostListItem` and `PostPage`

**Files:**
- Modify: `src/features/posts/PostListItem.tsx`, `src/pages/PostPage.tsx`

- [ ] **Step 1: Update `PostListItem`**

Edit `src/features/posts/PostListItem.tsx` — replace the `<VoteScore />` with `<VoteButtons />`:

```tsx
// at top:
import { VoteButtons } from "./VoteButtons";

// in the JSX, replace <VoteScore score={score} /> with:
<VoteButtons postId={post.id!} forumName={post.forumName!} score={score} />
```

Remove the now-unused `VoteScore` import.

- [ ] **Step 2: Update `PostPage`**

Edit `src/pages/PostPage.tsx` — replace `<VoteScore score={score} />` with `<VoteButtons postId={postId} forumName={forumName} score={score} />`. Remove the unused `VoteScore` import.

- [ ] **Step 3: Update `PostListItem` test**

The existing test in `src/features/posts/PostListItem.test.tsx` asserts the score is visible — but rendering `VoteButtons` requires the `UserProvider` + `QueryClient` + `MemoryRouter` wrappers. Update the test wrapper:

```tsx
// imports
import { QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

// replace the render() body:
render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      <UserProvider><PostListItem post={post} /></UserProvider>
    </MemoryRouter>
  </QueryClientProvider>,
);
```

- [ ] **Step 4: Run both affected test files**

```bash
npm run test:run -- src/features/posts/PostListItem.test.tsx src/features/posts/useVotePost.test.ts src/features/posts/VoteButtons.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Browser smoke test**

```bash
npm run dev
```

Log in. On the home feed, click upvote on a post — arrow turns orange, score increments. Click again — no-op. Click downvote — toggles to blue, score decrements. Refresh — colors persist (localStorage). Log out — arrows become greyed links to `/login`. Stop dev.

- [ ] **Step 6: Commit**

```bash
git add src/features/posts/PostListItem.tsx src/features/posts/PostListItem.test.tsx src/pages/PostPage.tsx
git commit -m "feat(posts): wire VoteButtons into PostListItem and PostPage"
```

---

## Phase 9 — Subscriptions

### Task 39: Subscription query + mutations

**Files:**
- Create: `src/features/subscriptions/useSubscriptions.ts`, `useSubscribe.ts`, `useUnsubscribe.ts`, `useSubscriptions.test.ts`

- [ ] **Step 1: Failing tests**

Create `src/features/subscriptions/useSubscriptions.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubscriptions } from "./useSubscriptions";
import { useSubscribe } from "./useSubscribe";
import { useUnsubscribe } from "./useUnsubscribe";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const get = vi.mocked(api.GET);
const post = vi.mocked(api.POST);
const del = vi.mocked(api.DELETE);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

beforeEach(() => { get.mockReset(); post.mockReset(); del.mockReset(); });

describe("subscription hooks", () => {
  it("useSubscriptions fetches when userId is set", async () => {
    get.mockResolvedValueOnce({ data: [], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useSubscriptions("alice"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/api/users/me/subscriptions", {});
  });

  it("useSubscriptions stays idle when userId is null", () => {
    const { result } = renderHook(() => useSubscriptions(null), { wrapper: w(new QueryClient()) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(get).not.toHaveBeenCalled();
  });

  it("useSubscribe POSTs and invalidates", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSubscribe("alice"), { wrapper: w(qc) });
    await result.current.mutateAsync("programming");
    expect(post).toHaveBeenCalledWith("/api/forums/{name}/subscribe", {
      params: { path: { name: "programming" } },
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["subscriptions", "alice"] });
  });

  it("useUnsubscribe DELETEs and invalidates", async () => {
    del.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUnsubscribe("alice"), { wrapper: w(qc) });
    await result.current.mutateAsync("programming");
    expect(del).toHaveBeenCalledWith("/api/forums/{name}/subscribe", {
      params: { path: { name: "programming" } },
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["subscriptions", "alice"] });
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/subscriptions/useSubscriptions.test.ts
```

- [ ] **Step 3: Implement the three hooks**

`src/features/subscriptions/useSubscriptions.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: ["subscriptions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/users/me/subscriptions", {});
      if (error) throw new Error("Failed to load subscriptions");
      return data!;
    },
  });
}
```

`src/features/subscriptions/useSubscribe.ts`:
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useSubscribe(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (forumName: string) => {
      const { error } = await api.POST("/api/forums/{name}/subscribe", {
        params: { path: { name: forumName } },
      });
      if (error) throw new Error("Failed to subscribe");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", userId] }),
  });
}
```

`src/features/subscriptions/useUnsubscribe.ts`:
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useUnsubscribe(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (forumName: string) => {
      const { error } = await api.DELETE("/api/forums/{name}/subscribe", {
        params: { path: { name: forumName } },
      });
      if (error) throw new Error("Failed to unsubscribe");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", userId] }),
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/subscriptions/useSubscriptions.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/subscriptions/
git commit -m "feat(subs): add subscription query + mutation hooks (TDD)"
```

---

### Task 40: `SubscribeButton` with optimistic toggle

**Files:**
- Create: `src/features/subscriptions/SubscribeButton.tsx`

Optimistic: flips the cached subscription list immediately; rollback on error. Logged-out users see a `Log in to subscribe` link.

- [ ] **Step 1: Implement**

Create `src/features/subscriptions/SubscribeButton.tsx`:

```tsx
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/features/auth/useUser";
import { useSubscriptions } from "./useSubscriptions";
import { useSubscribe } from "./useSubscribe";
import { useUnsubscribe } from "./useUnsubscribe";
import { Button } from "@/components/ui/button";
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function SubscribeButton({ forum }: { forum: Forum }) {
  const { userId } = useUser();
  const location = useLocation();
  const qc = useQueryClient();
  const subs = useSubscriptions(userId);
  const subscribe = useSubscribe(userId);
  const unsubscribe = useUnsubscribe(userId);

  if (!userId) {
    return (
      <Button variant="outline" asChild>
        <Link to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>
          Log in to subscribe
        </Link>
      </Button>
    );
  }

  const isSubscribed = subs.data?.some((f) => f.name === forum.name) ?? false;
  const pending = subscribe.isPending || unsubscribe.isPending;

  function toggle() {
    const key = ["subscriptions", userId];
    const prev = qc.getQueryData<Forum[]>(key);
    if (isSubscribed) {
      qc.setQueryData(key, (prev ?? []).filter((f) => f.name !== forum.name));
      unsubscribe.mutate(forum.name, {
        onError() { if (prev !== undefined) qc.setQueryData(key, prev); },
      });
    } else {
      qc.setQueryData(key, [...(prev ?? []), forum]);
      subscribe.mutate(forum.name, {
        onError() { if (prev !== undefined) qc.setQueryData(key, prev); },
      });
    }
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      onClick={toggle}
      disabled={pending}
    >
      {pending ? "…" : isSubscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/subscriptions/SubscribeButton.tsx
git commit -m "feat(subs): add SubscribeButton with optimistic toggle"
```

---

### Task 41: Wire `SubscribeButton` + create-post into `RightRail` on ForumPage and PostPage

**Files:**
- Create: `src/features/forums/ForumRightRail.tsx`
- Modify: `src/pages/ForumPage.tsx`, `src/pages/PostPage.tsx`

- [ ] **Step 1: Create the RightRail body component**

Create `src/features/forums/ForumRightRail.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/features/subscriptions/SubscribeButton";
import { relativeTime } from "@/lib/relativeTime";
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function ForumRightRail({ forum }: { forum: Forum }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">r/{forum.name}</h2>
        {forum.description && (
          <p className="text-sm text-slate-600 mt-1">{forum.description}</p>
        )}
      </div>
      <dl className="text-xs text-slate-500 space-y-1">
        <div>{forum.subscriberCount ?? 0} subscribers</div>
        {forum.createdAt && <div>Created {relativeTime(forum.createdAt)}</div>}
      </dl>
      <div className="flex flex-col gap-2">
        <SubscribeButton forum={forum} />
        <Button variant="outline" asChild>
          <Link to={`/submit?forum=${forum.name}`}>Create post</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `ForumPage.tsx` to render the right rail**

Modify `src/pages/ForumPage.tsx` — wrap the existing layout in a flex container with the RightRail:

```tsx
// add imports
import { RightRail } from "@/layout/RightRail";
import { ForumRightRail } from "@/features/forums/ForumRightRail";

// replace the outer return JSX:
return (
  <div className="flex">
    <div className="flex-1 min-w-0">
      <ForumHeader forum={forum.data} />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-end mb-3">
          <Button asChild><Link to={`/submit?forum=${forumName}`}>+ New post</Link></Button>
        </div>
        {posts.isLoading && <p className="text-slate-500">Loading posts…</p>}
        {posts.isError && <p className="text-slate-600">Couldn't load posts.</p>}
        {posts.data && posts.data.length === 0 && (
          <p className="text-slate-500">No posts in r/{forumName} yet.</p>
        )}
        {posts.data && posts.data.length > 0 && (
          <div className="bg-white rounded border border-slate-200 divide-y">
            {posts.data.map((post) => <PostListItem key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
    <RightRail><ForumRightRail forum={forum.data} /></RightRail>
  </div>
);
```

- [ ] **Step 3: Update `PostPage.tsx` to use `ForumRightRail`**

Replace the existing `<RightRail>{forum.data && <ForumHeader forum={forum.data} />}</RightRail>` with:

```tsx
<RightRail>{forum.data && <ForumRightRail forum={forum.data} />}</RightRail>
```

Remove the now-unused `ForumHeader` import from `PostPage.tsx`.

- [ ] **Step 4: Browser smoke test**

```bash
npm run dev
```

Visit a forum or post page. Right rail shows Subscribe button. Click it — flips to Subscribed. Refresh — still Subscribed. Click again — back to Subscribe. Stop dev.

- [ ] **Step 5: Commit**

```bash
git add src/features/forums/ForumRightRail.tsx src/pages/ForumPage.tsx src/pages/PostPage.tsx
git commit -m "feat(subs): wire SubscribeButton + create-post into the RightRail"
```

---

### Task 42: Wire subscriptions list into `Sidebar`

**Files:**
- Modify: `src/layout/Sidebar.tsx`, `src/layout/Sidebar.test.tsx`

- [ ] **Step 1: Update tests to cover the subscribed state**

Modify `src/layout/Sidebar.test.tsx`. Add a test that pre-seeds the subscriptions cache and confirms forum links appear. Append:

```tsx
import { QueryClient } from "@tanstack/react-query";

it("shows subscribed forum links when data is available", async () => {
  localStorage.setItem("simple-forum:user-id", "alice");
  const qc = new QueryClient();
  qc.setQueryData(["subscriptions", "alice"], [
    { name: "programming", description: "", createdBy: "x", createdAt: "x", updatedAt: "x", subscriberCount: 1 },
    { name: "rust",        description: "", createdBy: "x", createdAt: "x", updatedAt: "x", subscriberCount: 1 },
  ]);

  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><UserProvider><Sidebar /></UserProvider></MemoryRouter>
    </QueryClientProvider>,
  );

  expect(screen.getByRole("link", { name: /r\/programming/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /r\/rust/i })).toBeInTheDocument();
});
```

Add the `QueryClient` import at the top.

- [ ] **Step 2: Update `Sidebar` to consume subscriptions**

Replace `src/layout/Sidebar.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";
import { useSubscriptions } from "@/features/subscriptions/useSubscriptions";

export function Sidebar() {
  const { userId } = useUser();
  const subs = useSubscriptions(userId);

  return (
    <aside className="w-56 border-r bg-white p-4 text-sm flex flex-col gap-4">
      <section>
        <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          My Subscriptions
        </h2>
        {!userId && <p className="text-slate-500">Log in to subscribe to forums</p>}
        {userId && subs.isLoading && <p className="text-slate-500">Loading…</p>}
        {userId && subs.data && subs.data.length === 0 && (
          <p className="text-slate-500">No subscriptions yet</p>
        )}
        {userId && subs.data && subs.data.length > 0 && (
          <ul className="space-y-1">
            {subs.data.map((f) => (
              <li key={f.name}>
                <Link to={`/r/${f.name}`} className="text-slate-700 hover:underline">
                  r/{f.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="border-t pt-4 space-y-1">
        <Link to="/forums" className="block text-slate-700 hover:underline">
          Browse all forums
        </Link>
        <Link to="/forums/new" className="block text-slate-700 hover:underline">
          + Create forum
        </Link>
      </section>
    </aside>
  );
}
```

- [ ] **Step 3: Run tests (should pass)**

```bash
npm run test:run -- src/layout/Sidebar.test.tsx
```

- [ ] **Step 4: Browser smoke test**

```bash
npm run dev
```

Log in, subscribe to a forum from the RightRail. Sidebar should immediately list it (cache invalidation triggered by `useSubscribe.onSuccess`). Unsubscribe — it disappears. Stop dev.

- [ ] **Step 5: Commit**

```bash
git add src/layout/Sidebar.tsx src/layout/Sidebar.test.tsx
git commit -m "feat(subs): show subscribed forums in Sidebar"
```

---

## Phase 10 — Comments

### Task 43: `useComments` + `useCreateComment`

**Files:**
- Create: `src/features/comments/useComments.ts`, `useCreateComment.ts`, `useComments.test.ts`

- [ ] **Step 1: Failing tests**

Create `src/features/comments/useComments.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useComments } from "./useComments";
import { useCreateComment } from "./useCreateComment";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn(), POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const get = vi.mocked(api.GET);
const post = vi.mocked(api.POST);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

beforeEach(() => { get.mockReset(); post.mockReset(); });

describe("comment hooks", () => {
  it("useComments fetches by postId", async () => {
    get.mockResolvedValueOnce({ data: [], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useComments("p1"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/api/comments", { params: { query: { postId: "p1" } } });
  });

  it("useCreateComment POSTs and invalidates the comment list", async () => {
    const created = {
      id: "c1", postId: "p1", parentCommentId: null, content: "hi", userId: "alice",
      createdAt: "x", updatedAt: "x", upvoteCount: 0, downvoteCount: 0,
    };
    post.mockResolvedValueOnce({ data: created, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    qc.setQueryData(["posts", "p1"], {
      id: "p1", title: "x", content: "y", userId: "u", forumName: "f",
      createdAt: "x", updatedAt: "x",
      upvoteCount: 0, downvoteCount: 0, commentCount: 0,
    });
    const { result } = renderHook(() => useCreateComment("p1"), { wrapper: w(qc) });
    await result.current.mutateAsync({ content: "hi" });
    expect(post).toHaveBeenCalledWith("/api/comments", { body: { postId: "p1", content: "hi" } });
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ["comments", { postId: "p1" }] }));
    expect((qc.getQueryData(["posts", "p1"]) as any).commentCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/comments/useComments.test.ts
```

- [ ] **Step 3: Implement `useComments.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", { postId }],
    enabled: Boolean(postId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/comments", {
        params: { query: { postId } },
      });
      if (error) throw new Error("Failed to load comments");
      return data!;
    },
  });
}
```

- [ ] **Step 4: Implement `useCreateComment.ts`**

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Post = components["schemas"]["PostResponse"];

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { content: string }) => {
      const { data, error } = await api.POST("/api/comments", {
        body: { postId, content: body.content },
      });
      if (error) throw new Error("Failed to create comment");
      return data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", { postId }] });
      const post = qc.getQueryData<Post>(["posts", postId]);
      if (post) {
        qc.setQueryData(["posts", postId], {
          ...post, commentCount: (post.commentCount ?? 0) + 1,
        });
      }
    },
  });
}
```

- [ ] **Step 5: Run (passes)**

```bash
npm run test:run -- src/features/comments/useComments.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/features/comments/useComments.ts src/features/comments/useCreateComment.ts src/features/comments/useComments.test.ts
git commit -m "feat(comments): add useComments + useCreateComment (TDD)"
```

---

### Task 44: `useUpdateComment` + `useDeleteComment`

**Files:**
- Create: `src/features/comments/useUpdateComment.ts`, `useDeleteComment.ts`, `useUpdateDeleteComment.test.ts`

- [ ] **Step 1: Failing tests**

Create `src/features/comments/useUpdateDeleteComment.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateComment } from "./useUpdateComment";
import { useDeleteComment } from "./useDeleteComment";

vi.mock("@/lib/api/client", () => ({ api: { PUT: vi.fn(), DELETE: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const put = vi.mocked(api.PUT);
const del = vi.mocked(api.DELETE);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

beforeEach(() => { put.mockReset(); del.mockReset(); });

describe("useUpdateComment", () => {
  it("PUTs and invalidates the post's comment list", async () => {
    put.mockResolvedValueOnce({ data: { id: "c1", postId: "p1", content: "edited",
      userId: "alice", createdAt: "x", updatedAt: "y", upvoteCount: 0, downvoteCount: 0,
      parentCommentId: null }, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateComment("p1"), { wrapper: w(qc) });
    await result.current.mutateAsync({ commentId: "c1", content: "edited" });
    expect(put).toHaveBeenCalledWith("/api/comments/{id}", {
      params: { path: { id: "c1" } },
      body: { postId: "p1", content: "edited" },
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["comments", { postId: "p1" }] });
  });
});

describe("useDeleteComment", () => {
  it("DELETEs, invalidates the comment list, decrements commentCount", async () => {
    del.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    qc.setQueryData(["posts", "p1"], {
      id: "p1", title: "x", content: "y", userId: "u", forumName: "f",
      createdAt: "x", updatedAt: "x",
      upvoteCount: 0, downvoteCount: 0, commentCount: 5,
    });
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteComment("p1"), { wrapper: w(qc) });
    await result.current.mutateAsync("c1");
    expect(del).toHaveBeenCalledWith("/api/comments/{id}", { params: { path: { id: "c1" } } });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["comments", { postId: "p1" }] });
    expect((qc.getQueryData(["posts", "p1"]) as any).commentCount).toBe(4);
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/comments/useUpdateDeleteComment.test.ts
```

- [ ] **Step 3: Implement `useUpdateComment.ts`**

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useUpdateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await api.PUT("/api/comments/{id}", {
        params: { path: { id: commentId } },
        body: { postId, content },
      });
      if (error) throw new Error("Failed to update comment");
      return data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", { postId }] }),
  });
}
```

- [ ] **Step 4: Implement `useDeleteComment.ts`**

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Post = components["schemas"]["PostResponse"];

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await api.DELETE("/api/comments/{id}", {
        params: { path: { id: commentId } },
      });
      if (error) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", { postId }] });
      const post = qc.getQueryData<Post>(["posts", postId]);
      if (post && (post.commentCount ?? 0) > 0) {
        qc.setQueryData(["posts", postId], { ...post, commentCount: (post.commentCount ?? 0) - 1 });
      }
    },
  });
}
```

- [ ] **Step 5: Run (passes)**

```bash
npm run test:run -- src/features/comments/useUpdateDeleteComment.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/features/comments/useUpdateComment.ts src/features/comments/useDeleteComment.ts src/features/comments/useUpdateDeleteComment.test.ts
git commit -m "feat(comments): add useUpdateComment + useDeleteComment (TDD)"
```

---

### Task 45: `useVoteComment` (mirrors `useVotePost`)

**Files:**
- Create: `src/features/comments/useVoteComment.ts`, `src/features/comments/useVoteComment.test.ts`

Same optimistic logic as `useVotePost` but patches the cached `["comments", { postId }]` list and uses the `comment` entity in `voteState`. Implementation is structurally identical — the differences are: the cache shape (a list keyed differently), the entity type passed to `voteState`, and the API path.

- [ ] **Step 1: Failing tests**

Create `src/features/comments/useVoteComment.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVoteComment } from "./useVoteComment";
import { getVote, setVote } from "@/lib/voteState";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const post = vi.mocked(api.POST);

const comment = {
  id: "c1", postId: "p1", parentCommentId: null, content: "hi", userId: "x",
  createdAt: "x", updatedAt: "x", upvoteCount: 3, downvoteCount: 1,
};

function setup(userId = "alice") {
  const qc = new QueryClient();
  qc.setQueryData(["comments", { postId: "p1" }], [comment]);
  const { result } = renderHook(() => useVoteComment(userId, "p1"), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  return { qc, result };
}

beforeEach(() => { post.mockReset(); localStorage.clear(); });

describe("useVoteComment", () => {
  it("optimistically upvotes a comment and records local vote", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => {
      const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[];
      expect(list[0].upvoteCount).toBe(4);
    });
    expect(getVote("alice", "comment", "c1")).toBe("up");
    expect(post).toHaveBeenCalledWith("/api/comments/{id}/upvote", { params: { path: { id: "c1" } } });
  });

  it("rolls back on API error", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: { message: "boom" }, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => {
      const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[];
      expect(list[0].upvoteCount).toBe(3);
    });
    expect(getVote("alice", "comment", "c1")).toBeNull();
  });

  it("no-ops on same-direction click", async () => {
    setVote("alice", "comment", "c1", "up");
    const { result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await new Promise((r) => setTimeout(r, 0));
    expect(post).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
npm run test:run -- src/features/comments/useVoteComment.test.ts
```

- [ ] **Step 3: Implement**

Create `src/features/comments/useVoteComment.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getVote, setVote } from "@/lib/voteState";
import type { components } from "@/lib/api/schema";
import type { VoteValue } from "@/lib/voteState";

type Comment = components["schemas"]["CommentResponse"];
type Variables = { commentId: string; direction: VoteValue };

type Snapshot = { list: Comment[] | undefined; prevVote: VoteValue | null };

function applyDelta(c: Comment, prev: VoteValue | null, next: VoteValue): Comment {
  let up = c.upvoteCount ?? 0;
  let down = c.downvoteCount ?? 0;
  if (prev === "up") up -= 1;
  if (prev === "down") down -= 1;
  if (next === "up") up += 1;
  if (next === "down") down += 1;
  return { ...c, upvoteCount: up, downvoteCount: down };
}

export function useVoteComment(userId: string | null, postId: string) {
  const qc = useQueryClient();
  const key = ["comments", { postId }] as const;

  return useMutation<void, Error, Variables, Snapshot>({
    async mutationFn(vars) {
      const path = vars.direction === "up"
        ? "/api/comments/{id}/upvote"
        : "/api/comments/{id}/downvote";
      const { error } = await api.POST(path, { params: { path: { id: vars.commentId } } });
      if (error) throw new Error("Vote failed");
    },
    async onMutate(vars) {
      if (!userId) throw new Error("Must be logged in to vote");
      const prevVote = getVote(userId, "comment", vars.commentId);
      if (prevVote === vars.direction) throw new Error("__noop__");
      await qc.cancelQueries({ queryKey: key });
      const list = qc.getQueryData<Comment[]>(key);
      if (list) {
        qc.setQueryData(key, list.map((c) => c.id === vars.commentId
          ? applyDelta(c, prevVote, vars.direction) : c));
      }
      setVote(userId, "comment", vars.commentId, vars.direction);
      return { list, prevVote };
    },
    onError(_err, vars, snap) {
      if (!snap) return;
      if (snap.list !== undefined) qc.setQueryData(key, snap.list);
      if (userId) {
        if (snap.prevVote === null) {
          const raw = localStorage.getItem(`simple-forum:votes:${userId}`);
          if (raw) {
            try {
              const map = JSON.parse(raw) as Record<string, VoteValue>;
              delete map[`comment:${vars.commentId}`];
              localStorage.setItem(`simple-forum:votes:${userId}`, JSON.stringify(map));
            } catch { /* ignore */ }
          }
        } else {
          setVote(userId, "comment", vars.commentId, snap.prevVote);
        }
      }
    },
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
npm run test:run -- src/features/comments/useVoteComment.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/comments/useVoteComment.ts src/features/comments/useVoteComment.test.ts
git commit -m "feat(comments): add useVoteComment with optimistic updates (TDD)"
```

---

### Task 46: `CommentForm` (used for both create and edit)

**Files:**
- Create: `src/features/comments/CommentForm.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CommentForm({
  initialValue = "",
  submitLabel = "Comment",
  onSubmit,
  onCancel,
  isPending = false,
  errorMessage = null,
}: {
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
}) {
  const [value, setValue] = useState(initialValue);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const trimmed = value.trim();
    if (trimmed.length === 0) return setLocalError("Comment cannot be empty");
    if (trimmed.length > 4000) return setLocalError("Comment must be 4000 characters or fewer");
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write a comment…"
      />
      {(localError || errorMessage) && (
        <Alert variant="destructive">
          <AlertDescription>{localError ?? errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? "…" : submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/CommentForm.tsx
git commit -m "feat(comments): add CommentForm (used for create + edit)"
```

---

### Task 47: `CommentItem` + `CommentList`

**Files:**
- Create: `src/features/comments/CommentItem.tsx`, `src/features/comments/CommentList.tsx`

`CommentItem` handles its own edit/delete state. Vote arrows mirror the post version but smaller. Edit/Delete buttons appear only if `comment.userId === currentUser`.

- [ ] **Step 1: Implement `CommentItem.tsx`**

```tsx
import { useState } from "react";
import { useUser } from "@/features/auth/useUser";
import { useUpdateComment } from "./useUpdateComment";
import { useDeleteComment } from "./useDeleteComment";
import { useVoteComment } from "./useVoteComment";
import { CommentForm } from "./CommentForm";
import { getVote } from "@/lib/voteState";
import { relativeTime } from "@/lib/relativeTime";
import { Button } from "@/components/ui/button";
import type { components } from "@/lib/api/schema";

type Comment = components["schemas"]["CommentResponse"];

export function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const { userId } = useUser();
  const isMine = userId !== null && userId === comment.userId;
  const update = useUpdateComment(postId);
  const del = useDeleteComment(postId);
  const vote = useVoteComment(userId, postId);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const score = (comment.upvoteCount ?? 0) - (comment.downvoteCount ?? 0);
  const myVote = userId ? getVote(userId, "comment", comment.id!) : null;

  function doVote(direction: "up" | "down") {
    if (!userId) return; // logged-out vote button is a no-op visual (full link in v1.1)
    vote.mutate({ commentId: comment.id!, direction }, {
      onError(err) { if (err.message === "__noop__") return; },
    });
  }

  return (
    <article className="border-b border-slate-200 py-3 px-2 flex">
      <div className="w-8 flex flex-col items-center text-xs select-none">
        <button
          aria-label="Upvote comment"
          onClick={() => doVote("up")}
          className={myVote === "up" ? "text-orange-500" : "text-slate-400 hover:text-orange-500"}
        >▲</button>
        <span className="font-bold text-slate-800 my-0.5">{score}</span>
        <button
          aria-label="Downvote comment"
          onClick={() => doVote("down")}
          className={myVote === "down" ? "text-blue-500" : "text-slate-400 hover:text-blue-500"}
        >▼</button>
      </div>
      <div className="flex-1 pl-2 min-w-0">
        <p className="text-xs text-slate-500">
          u/{comment.userId}
          {comment.createdAt && ` · ${relativeTime(comment.createdAt)}`}
        </p>
        {editing ? (
          <div className="mt-2">
            <CommentForm
              initialValue={comment.content ?? ""}
              submitLabel="Save"
              isPending={update.isPending}
              errorMessage={update.isError ? "Couldn't save the edit." : null}
              onCancel={() => setEditing(false)}
              onSubmit={(content) =>
                update.mutate({ commentId: comment.id!, content }, {
                  onSuccess: () => setEditing(false),
                })
              }
            />
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-slate-800 text-sm">{comment.content}</p>
        )}
        {isMine && !editing && (
          <div className="mt-2 flex gap-2 text-xs">
            <button onClick={() => setEditing(true)} className="text-slate-500 hover:underline">Edit</button>
            {confirmDelete ? (
              <>
                <span className="text-slate-500">Delete?</span>
                <button
                  onClick={() => del.mutate(comment.id!, { onSettled: () => setConfirmDelete(false) })}
                  className="text-red-600 hover:underline"
                  disabled={del.isPending}
                >Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-slate-500 hover:underline">No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:underline">Delete</button>
            )}
          </div>
        )}
        {del.isError && (
          <p className="text-xs text-red-600 mt-1">You no longer have permission to delete this comment.</p>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Implement `CommentList.tsx`**

```tsx
import { useUser } from "@/features/auth/useUser";
import { useComments } from "./useComments";
import { useCreateComment } from "./useCreateComment";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Link, useLocation } from "react-router-dom";

export function CommentList({ postId }: { postId: string }) {
  const { userId } = useUser();
  const location = useLocation();
  const comments = useComments(postId);
  const create = useCreateComment(postId);

  return (
    <section className="bg-white border rounded">
      <div className="p-3 border-b">
        <h2 className="text-sm font-semibold mb-2">
          {comments.data?.length ?? 0} comments
        </h2>
        {userId ? (
          <CommentForm
            isPending={create.isPending}
            errorMessage={create.isError ? "Couldn't post the comment." : null}
            onSubmit={(content) => create.mutate({ content })}
          />
        ) : (
          <Link
            to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Log in to comment
          </Link>
        )}
      </div>
      <div>
        {comments.isLoading && <p className="p-3 text-slate-500 text-sm">Loading comments…</p>}
        {comments.isError && <p className="p-3 text-slate-600 text-sm">Couldn't load comments.</p>}
        {comments.data && comments.data.length === 0 && (
          <p className="p-3 text-slate-500 text-sm">No comments yet.</p>
        )}
        {comments.data && comments.data.map((c) => (
          <CommentItem key={c.id} comment={c} postId={postId} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/comments/CommentItem.tsx src/features/comments/CommentList.tsx
git commit -m "feat(comments): add CommentItem and CommentList components"
```

---

### Task 48: Wire `CommentList` into `PostPage`

**Files:**
- Modify: `src/pages/PostPage.tsx`

- [ ] **Step 1: Replace the comments placeholder**

In `src/pages/PostPage.tsx`, replace:

```tsx
<section id="comments" className="mt-6">
  <p className="text-slate-500">{post.data.commentCount ?? 0} comments — coming in Task 48.</p>
</section>
```

with:

```tsx
import { CommentList } from "@/features/comments/CommentList";
// …
<section id="comments" className="mt-6">
  <CommentList postId={postId} />
</section>
```

- [ ] **Step 2: Browser smoke test**

```bash
npm run dev
```

Visit a post. Expected: comments section renders, you can add/edit/delete comments while logged in, vote up/down with optimistic + rollback, comment count badge in the home feed reflects changes. Stop dev.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PostPage.tsx
git commit -m "feat(comments): wire CommentList into PostPage"
```

---

## Phase 11 — Polish + production verification

### Task 49: Auth-gating audit

**Files:** any page that takes a write action.

Walk through these scenarios in the browser with the backend running:

| Scenario | Expected |
|----------|----------|
| Logged out, click an upvote arrow on the home feed | Lands on `/login?returnTo=/` |
| Logged out, click "Subscribe" in the right rail of a forum page | Lands on `/login?returnTo=/r/<name>` |
| Logged out, click "+ New post" link | Lands on `/login?returnTo=/submit?forum=<name>` (URL-encoded) |
| Logged out, click "+ Create forum" link | Lands on `/login?returnTo=/forums/new` |
| Logged out, on a post page, the comment form area shows a "Log in to comment" link | ✓ |
| Logged in as `alice`, view your own comment | Edit + Delete buttons visible |
| Logged in as `alice`, view someone else's comment | No Edit/Delete buttons |
| After logging out, then back in as a different user, vote highlights are now from the new user's localStorage | ✓ |

- [ ] **Step 1: Run the audit**

For any scenario that fails, fix the corresponding component (typically by replacing a hard-coded action with `useRequireUser()` or a logged-in guard, mirroring `VoteButtons`).

- [ ] **Step 2: Run the full test suite + typecheck + lint**

```bash
npm run test:run
npm run typecheck
npm run lint
```

Expected: all clean. Fix anything that broke during the audit.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(auth): close auth-gating gaps found in v1 audit"
```

(If there were no changes, skip the commit.)

---

### Task 50: Production build verification

**Files:** `.env.example`, `package.json` (if missing the `preview` script), `vite.config.ts` (only if needed).

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: `dist/` produced, no TS errors. Warnings about chunk size are OK for v1.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

Vite serves `dist/` on `http://localhost:4173` (default). The production build has **no dev proxy** — every request goes straight to whatever `VITE_API_BASE_URL` was set to at build time. Since we built with an empty value, API calls will 404.

This is **expected**. The point of the preview here is to confirm the static bundle loads, the router works, and login/UI renders. Backend connectivity is a deploy-time concern.

- [ ] **Step 3: Rebuild against a real backend URL to fully verify**

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run build
npm run preview
```

(On Windows PowerShell: `$env:VITE_API_BASE_URL="http://localhost:8080"; npm run build; npm run preview`)

Expected: with the backend running, the preview build behaves identically to dev. Stop preview.

- [ ] **Step 4: Run the whole verification suite one last time**

```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

Expected: everything passes.

- [ ] **Step 5: Final commit + tag (optional)**

```bash
git tag v1.0.0
git commit --allow-empty -m "chore: v1 complete — feature audit + production build verified"
```

---

## Done

At this point you have a working Reddit-lite SPA:

- Login (fake) with localStorage persistence
- Browse posts and forums (read-only without login)
- Create posts and forums (login-gated)
- Vote on posts and comments with optimistic UI + rollback
- Subscribe/unsubscribe to forums; sidebar reflects subscriptions
- Comment on posts, edit/delete your own, vote on comments
- Reddit-Classic dense layout
- Production build verified

The full list of known API gaps documented in the spec (§8) is your wishlist for the backend.








