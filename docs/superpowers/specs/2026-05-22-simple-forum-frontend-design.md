# Simple Forum — Frontend Design

**Status:** approved for implementation planning
**Date:** 2026-05-22
**Author:** Raven Gotz-Tier (with Claude)

## 1. Overview

A TypeScript single-page web app for a minimal Reddit-style forum. Built as a
personal learning project against an existing backend that already exposes a
REST API (`openapi.yaml`, sourced from the backend repo). The frontend lets a
"user" (identified by a `X-User-Id` header — no real auth yet) browse posts and
forums, create posts and forums, comment, vote, and subscribe.

## 2. Goals & non-goals

**Goals**
- Cover the full API surface (posts, forums, comments, votes, subscriptions) end-to-end.
- Feel Reddit-like in density and interaction model.
- Be a vehicle for learning modern React-stack tooling — TanStack Query, shadcn/ui,
  typed API codegen from OpenAPI.
- Deploy cleanly to a static host (Vercel / Netlify / Cloudflare Pages) when ready.

**Non-goals (v1)**
- Real authentication. Identity is a username string the user picks at "login".
- Server-side rendering. Pure SPA.
- Dark mode, i18n, PWA, search, comment threading.
- Merged "subscribed forums" feed (the API has no endpoint for it).

## 3. Tech stack

**Build & runtime**
- Vite 5, React 19, TypeScript 5 (strict).
- Tailwind CSS v4, shadcn/ui (copy-in components, owned in repo).

**Routing & data**
- React Router DOM v7.
- TanStack Query v5 — chosen over SWR because vote-button optimistic updates
  are a first-class use case and the mutation/invalidation story is richer.
- `openapi-typescript` (dev dep, generates types from `openapi.yaml`) +
  `openapi-fetch` (tiny typed runtime wrapper).

**Testing**
- Vitest + React Testing Library.
- API client stubbed in tests via `vi.mock('@/lib/api/client', …)`. No MSW for v1
  — backend will always be available locally during development. MSW remains a
  reasonable later addition if integration coverage grows.

**Explicitly NOT pulling in**
- Form library — only login, create-post, create-forum, and comment-form exist;
  plain `useState` + a tiny validation helper is enough.
- Global state library (Redux/Zustand) — TanStack Query owns server state,
  React context covers the single client-state slice (current user).
- SSR/SSG — no SEO needs.
- Toast library — errors render inline near the action that produced them.

## 4. Routes & information architecture

### Route table

| Path                                | Page                                         | Auth required |
|-------------------------------------|----------------------------------------------|---------------|
| `/login`                            | Fake login (enter a username)                | no            |
| `/`                                 | Home feed — `GET /api/posts`                 | no            |
| `/r/:forumName`                     | Forum view — header + its posts              | no            |
| `/r/:forumName/p/:postId`           | Single post + comments                       | no            |
| `/forums`                           | Forum directory                              | no            |
| `/forums/new`                       | Create forum form                            | yes           |
| `/submit?forum=<name>`              | Create post form                             | yes           |

URL convention `/r/:forumName` is intentional — Reddit-like, and matches the API
where forums are keyed by name.

### Auth gating

- **Reads are public.** The API does not require `X-User-Id` for GETs. First-time
  visitors browse everything without logging in.
- **Write actions require login** (create post, create forum, comment, vote,
  subscribe). Triggering one while logged out navigates to
  `/login?returnTo=<currentPath>` and bounces back after a username is entered.
- This mirrors Reddit's UX and avoids a hard login wall on first visit.

### Layout shell

Three persistent regions:

```
┌─────────────────────────────────────────────────────────┐
│  TOP NAV: simple-forum  [search placeholder]  [user ▾] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  My Subs     │  MAIN CONTENT                            │
│  ─ r/foo     │  (feed / post / forum / form)            │
│  ─ r/bar     │                                          │
│              │                                          │
│  Browse all  │                                          │
│  + Create    │                                          │
└──────────────┴──────────────────────────────────────────┘
```

- **Top nav** — logo + product name, a greyed-out search placeholder (no-op in
  v1), current-user dropdown with "Log out". Shows "Log in" link when logged out.
- **Left sidebar** — subscribed forums (fetched once via
  `GET /api/users/me/subscriptions`), "Browse all forums" link, "+ Create forum"
  link. Logged-out state shows "Log in to subscribe".
- **Right rail** — only on forum and post pages. Shows forum metadata
  (description, subscriber count, Subscribe / Subscribed toggle, "Create post"
  button).

### Visual direction

**Reddit Classic** — dense, info-heavy, vote arrows pinned to the left of each
post, byline above the title. Validated via mockup during brainstorming.

### Post page — comments region

Below the post body on `/r/:forumName/p/:postId`:

- Comment count + "Add a comment" textarea at the top. Logged-out users see a
  "Log in to comment" link instead of the textarea.
- Comment list below, server-ordered newest-first.
- Each comment: author, relative timestamp, body, vote arrows, and (if the
  comment is yours) inline Edit / Delete buttons. Edit replaces the body with a
  textarea in place. Delete shows a small confirmation.
- Comments are **flat** in v1 — `parentCommentId` is ignored on render until the
  API supports threaded creation (see §8 H1).

### Post list item

`PostListItem` (in `HomePage` and `ForumPage`) shows the title, byline,
vote score, and a `💬 N comments` indicator using `commentCount`. Clicking the
indicator navigates to `/r/:forumName/p/:postId#comments` and scrolls to the
comments region.

### Deliberate omission

**No merged "My Subscriptions" feed.** The API has no endpoint that returns
posts from multiple forums in one call, so a merged feed means N parallel
forum-post fetches plus client-side sort/dedupe. For v1 the sidebar *is* the
subscriptions UX — click a forum to see its posts. Revisit once the backend
exposes `/api/users/me/feed`.

## 5. Folder structure

```
simple-forum-frontend/
├─ api/
│  └─ openapi.yaml              # local copy, sync'd from backend repo
├─ scripts/
│  └─ sync-api.mjs              # copy spec + run openapi-typescript codegen
├─ src/
│  ├─ main.tsx                  # entry — mounts <App>
│  ├─ App.tsx                   # providers (Query, User, Router) + <RouterProvider>
│  ├─ router.tsx                # route table
│  │
│  ├─ pages/                    # one component per route
│  │   ├─ HomePage.tsx
│  │   ├─ LoginPage.tsx
│  │   ├─ ForumPage.tsx
│  │   ├─ PostPage.tsx
│  │   ├─ ForumsPage.tsx
│  │   ├─ CreateForumPage.tsx
│  │   ├─ CreatePostPage.tsx
│  │   └─ NotFoundPage.tsx
│  │
│  ├─ features/                 # feature-scoped UI + hooks
│  │   ├─ posts/                # PostListItem, VoteButtons, usePosts, useVotePost…
│  │   ├─ forums/               # ForumHeader, ForumListItem, useForums…
│  │   ├─ comments/             # CommentList, CommentItem, CommentForm, useComments,
│  │   │                        #   useCreateComment, useUpdateComment, useDeleteComment,
│  │   │                        #   useVoteComment
│  │   ├─ subscriptions/        # SubscribeButton, useSubscriptions…
│  │   └─ auth/                 # LoginForm, UserContext, useUser, useRequireUser
│  │
│  ├─ layout/                   # shell pieces
│  │   ├─ AppShell.tsx          # 3-region layout, used as a router layout route
│  │   ├─ TopNav.tsx
│  │   ├─ Sidebar.tsx
│  │   └─ RightRail.tsx
│  │
│  ├─ components/ui/            # shadcn copy-in primitives
│  │
│  ├─ lib/
│  │   ├─ api/
│  │   │   ├─ client.ts         # openapi-fetch client + X-User-Id middleware
│  │   │   └─ schema.ts         # generated types (committed)
│  │   ├─ queryClient.ts        # TanStack Query defaults
│  │   ├─ utils.ts              # cn() + small helpers
│  │   └─ relativeTime.ts       # "4h ago" formatting
│  │
│  └─ test/
│      └─ setup.ts              # Vitest setup
│
├─ .env.example                 # documents VITE_API_BASE_URL
├─ tailwind.config.ts
├─ tsconfig.json                # strict: true
├─ vite.config.ts
└─ package.json
```

### Conventions

- **Pages end in `Page`** — easy to grep, distinguishes route components from
  regular components.
- **Hooks live next to the feature they query** — `features/posts/usePosts.ts`
  not a global `hooks/` folder.
- **Generated `schema.ts` is committed**, not gitignored — keeps CI simple,
  reviewers see API shape changes in diffs.
- **`components/ui/`** is exclusively shadcn primitives (their convention).
  Project-specific UI lives under `features/` or `layout/`.
- **Path alias `@/`** → `src/` via Vite + tsconfig paths.
- **No `services/` layer** — TanStack Query hooks under `features/*` are the
  service layer; an extra abstraction would just shuffle code.
- **No top-level `types/` folder** — feature-local types stay in their feature
  folder; shared API types are the generated `schema.ts`.
- **No barrel `index.ts` re-exports** — they trip up tree-shaking and obscure
  import origins. Direct imports.

## 6. Data layer

### API client — `lib/api/client.ts`

```ts
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import { getCurrentUserId } from "@/features/auth/UserContext";

const userIdMiddleware: Middleware = {
  async onRequest({ request }) {
    const userId = getCurrentUserId();
    if (userId) request.headers.set("X-User-Id", userId);
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL, // e.g. http://localhost:8080
});
api.use(userIdMiddleware);
```

`getCurrentUserId()` is a module-level getter backed by the UserContext (not a
hook — middleware can't call hooks). The provider keeps a `useEffect` that
mirrors state into the module-level variable, so the middleware always sees the
current user.

### User identity — `features/auth/UserContext.tsx`

The typed-in username **is** the user ID — the validated string is written to
`localStorage` under `simple-forum:user-id` and is sent verbatim as the
`X-User-Id` header on every authenticated request. When real auth lands later,
this string becomes whatever the auth response provides (e.g. a JWT `sub`).

- `<UserProvider>` reads `simple-forum:user-id` from `localStorage` on mount.
- Exposes `{ userId, login(name), logout() }`. `login(name)` validates
  non-empty and sane chars (`^[a-zA-Z0-9_-]{2,32}$`) and stores the value;
  `userId` exposes the stored value (or `null` when logged out).
- `logout` clears localStorage and resets the TanStack Query cache
  (`queryClient.clear()`) so stale subscription data from the previous user
  doesn't leak.
- `useUser()` hook returns the context.
- `useRequireUser()` — if no `userId`, navigates to
  `/login?returnTo=<currentPath>`. Used by `CreatePostPage`, `CreateForumPage`,
  and the comment / vote / subscribe action handlers.

### TanStack Query setup — `lib/queryClient.ts`

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30s — forums/posts don't update that fast
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,  // annoying for a forum
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});
```

### Query key conventions

Hierarchical keys make invalidation easy:

```ts
["posts"]                          // GET /api/posts
["posts", postId]                  // GET /api/posts/:id
["forums"]                         // GET /api/forums
["forums", name]                   // GET /api/forums/:name
["forums", name, "posts"]          // GET /api/forums/:name/posts
["subscriptions", userId]          // GET /api/users/me/subscriptions
["comments", { postId }]           // GET /api/comments?postId=…
["comments", commentId]            // GET /api/comments/:id (rarely used)
```

After a mutation we invalidate the narrowest matching prefix — creating a post
in `r/foo` invalidates `["posts"]` and `["forums", "foo", "posts"]`; creating a
comment invalidates `["comments", { postId }]` and updates the cached
`PostResponse` to bump `commentCount`.

### Optimistic updates

- **Vote buttons (post and comment)** — instantly update the displayed count
  and highlight, mutate in background, rollback the cache snapshot on error.
- **Subscribe / unsubscribe** — instantly flip the button state and the sidebar
  list, rollback on error.
- **Create comment** — insert at top of the cached list with a temp ID and
  `userId = currentUser`; replace with server response on success; remove and
  show error on failure. Also bumps `commentCount` on the cached `PostResponse`.
- **Update comment** — optimistic body swap; rollback on error (incl. 403).
- **Delete comment** — optimistic removal; rollback on 403 / 404; decrements
  cached `commentCount`.
- **Create post / create forum** — no optimistic UI; navigate to the new
  resource after the mutation resolves (we need the server-assigned `id`).

### Vote state workaround

The API has three quirks that affect vote UX for both posts and comments:

1. Response schemas don't include the requesting user's vote (only counts).
2. No "remove vote" endpoint exists; you can't return to neutral.
3. The spec doesn't define whether `/upvote` is idempotent or how switching
   up→down is reconciled server-side.

**v1 approach.** Persist a `Record<string, "up" | "down">` per user in
localStorage:

```
simple-forum:votes:<userId>  →  {
  "post:abc123":    "up",
  "comment:xyz789": "down",
  …
}
```

- On vote click: optimistically update the cached count, write the new local
  vote state, fire the mutation.
- "Your vote" highlight is driven entirely by localStorage — survives refresh
  on this device, doesn't sync across devices or users.
- Clicking the same arrow again is a no-op (no toggle-off in v1).
- Switching up→down: fire `/downvote` and accept the backend may end up with
  both votes counted. Documented in §8 as the cleanest API fix to land first.

### Error handling

- **Mutation errors** — inline `<Alert variant="destructive">` near the action
  that triggered it.
- **Query errors** — inline error component with a "Retry" button (TanStack
  Query's `refetch()`). For full-page failures (post doesn't exist), render
  `NotFoundPage`.
- **403 on comment write** — frontend never shows Edit / Delete unless the
  comment is yours, so a 403 means client-side state drift (e.g. you logged
  out and back in as another user mid-session). Rollback the optimistic change,
  show "You no longer have permission to edit this comment" inline, refetch
  the comments list.
- **Network down** — same retry UI; the QueryClient's `retry: 1` handles
  transient blips.
- **No global error boundary in v1** — adding one is a small later task;
  route-level handling is sufficient.

## 7. Local dev, testing, deployment posture

### Local dev

- `npm run dev` — Vite on `http://localhost:5173`.
- Backend always runs locally on its own port (e.g. `http://localhost:8080`).
- Vite proxy in `vite.config.ts` forwards `/api/*` to the backend — same-origin
  requests in dev, no CORS dance.
- `.env.example` documents one variable: `VITE_API_BASE_URL` (used in production
  builds; dev relies on the proxy and ignores it).

### npm scripts

| Script        | What it does                                             |
|---------------|----------------------------------------------------------|
| `dev`         | Vite dev server                                          |
| `build`       | `tsc --noEmit` then `vite build`                         |
| `preview`     | Serve the production build locally                       |
| `test`        | Vitest, watch mode                                       |
| `test:run`    | Vitest single-run (for CI later)                         |
| `typecheck`   | `tsc --noEmit`                                           |
| `lint`        | ESLint                                                   |
| `sync-api`    | Copy `openapi.yaml` from backend repo, regenerate types  |

`sync-api` reads `BACKEND_REPO_PATH` from `.env` (default: a sibling-directory
guess), copies `openapi.yaml` into `api/`, and runs `openapi-typescript` to
refresh `src/lib/api/schema.ts`. Manual trigger — not on every dev startup.

### Testing scope for v1

- Unit / component tests for the non-trivial pieces: vote-button behavior
  (optimistic + rollback), `useRequireUser` redirect, `LoginForm` validation,
  sidebar rendering logged-in vs logged-out, comment edit / delete state.
- No E2E in v1 — Playwright adds setup; defer until the app stabilizes.
- Coverage target: pragmatic, not numeric. Test the parts where bugs would be
  embarrassing (votes, auth gating, optimistic rollback).

### Deployment posture

Cloud deployment is planned but out of scope for v1 implementation. The
architecture supports it without changes:

- Vite builds to `dist/` — static HTML + JS + CSS, no server required.
- Targets: Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.
- The dev proxy goes away in production; `VITE_API_BASE_URL` points at the
  deployed backend. CORS must be configured backend-side at that point.
- Single build env var: `VITE_API_BASE_URL`.

A dedicated deployment doc + CI build step gets added when the time comes.

## 8. Known API limitations & backend wishlist

Things the frontend lives with or works around in v1, grouped by severity. This
section is the canonical list for feeding back to the backend repo.

### High-impact — directly degrades v1 UX

| # | Limitation | UX effect | Suggested API change |
|---|------------|-----------|----------------------|
| H1 | `CommentRequest` doesn't accept `parentCommentId`, but `CommentResponse` exposes it | Threaded replies are impossible from the frontend even though the data model implies them | Add optional `parentCommentId` to `CommentRequest` |
| H2 | `PostResponse` and `CommentResponse` don't include the requesting user's vote | "Your vote" highlight has to be tracked in localStorage; doesn't sync across devices | Add `userVote: "up" \| "down" \| null` to both responses when `X-User-Id` is sent |
| H3 | No "remove vote" endpoint for posts or comments | Once you vote you're stuck; can't return to neutral | Add `DELETE /api/posts/:id/vote` and `DELETE /api/comments/:id/vote` |
| H4 | Ambiguous vote semantics | Unclear if `/upvote` is idempotent, or how switching up→down is reconciled server-side | Document, or replace with `PUT /api/posts/:id/vote { value: "up" \| "down" }` and the same for comments |
| H5 | No pagination on any list endpoint | `GET /api/posts` returns everything; can't scale past a few hundred posts | Add `?limit=&cursor=` to `/posts`, `/forums`, `/forums/:name/posts`, `/comments` |
| H6 | No sort/filter on post lists | Can't show "hot/new/top" tabs Reddit-style; backend's default order is all you get | `?sort=hot\|new\|top&since=24h` |
| H7 | No user resource | Can't display anything richer than `userId` strings; no avatars, no profile pages | `GET /api/users/:id` with `displayName`, `joinedAt`, etc. |
| H8 | No "feed of subscribed forums' posts" endpoint | Personalized feed requires N parallel requests + client-side merge; v1 skips it | `GET /api/users/me/feed` returning merged sorted posts |

### Medium-impact — annoying but workable

| # | Limitation | UX effect | Suggested API change |
|---|------------|-----------|----------------------|
| M1 | `GET /api/comments?postId=…` has no pagination or sort options (fixed newest-first) | A popular post with hundreds of comments returns all of them in one payload; can't show "top" or "controversial" | `?sort=new\|top&limit=&cursor=` |
| M2 | 403 documented on comment PUT/DELETE but not on post/forum PUT/DELETE | Same authorization logic presumably exists; frontend has to guess | Document 403 on post/forum write endpoints too |
| M3 | No way to fetch comments authored by a specific user | Can't build a "your comments" page | `GET /api/users/:id/comments` |
| M4 | No real auth — `X-User-Id` is plaintext, trivially impersonated | "Logging in" is fake; can't trust any action | Real auth (JWT, session cookie, OAuth — pick one) |
| M5 | No registration / first-login distinction | No "welcome, new user" flow; existing user vs new user is indistinguishable | `POST /api/users` to register; sessioned login flow |
| M6 | Forum primary key is `name` | Renaming a forum breaks every URL and inbound link | Use a stable `id`; expose `slug` separately |
| M7 | `DELETE /api/forums/:name` cascade-deletes everything | One wrong click destroys all posts, comments, votes, subscriptions | Soft-delete + admin-only restore, or strong confirmation + grace period |
| M8 | No search | Can't find old posts, comments, or forums by keyword | `GET /api/search?q=…&type=post\|comment\|forum` |
| M9 | No standardized error response | Frontend has to guess the shape of 4xx/5xx bodies | Document an error envelope: `{ error: { code, message, details? } }` |
| M10 | No `editedAt` distinct from `updatedAt` | Can't show an "edited 3h after posting" indicator | Add `editedAt`, or document that `updatedAt != createdAt` means edited |

### Low-impact — nice-to-have, not blocking

| # | Limitation | UX effect | Suggested API change |
|---|------------|-----------|----------------------|
| L1 | No forum metadata (icon, banner, color) | Every forum looks visually identical | Add `iconUrl`, `accentColor` to `ForumResponse` |
| L2 | No ETag / Last-Modified support | Every request transfers full payload; no cache validation | Add cache headers |
| L3 | No real-time push (no SSE / WS) | New posts, comments, and votes only appear on manual refresh | SSE for `/posts` and `/comments` streams, or a WS channel |
| L4 | No moderation concept | Any user can spam-create forums; no way to clean up | Moderator role + delete-as-mod endpoints |
| L5 | No vote-count consistency endpoint | If counts drift between client and server, no way to reconcile | Include canonical counts in vote response |
| L6 | No rate limiting documented | Frontend can't pre-emptively throttle; only reacts to errors | Document limits, return `Retry-After` |
| L7 | `X-User-Id` non-standard header | Most clients and proxies expect `Authorization` | Switch to `Authorization: Bearer …` once real auth lands |

### v1 frontend workarounds (papers over the gaps)

These exist purely because the corresponding API item hasn't shipped — each
goes away when the matching backend change lands.

- localStorage-backed vote state, posts and comments (papers over H2, H3, H4).
- Display raw `userId` strings as authors (papers over H7).
- Sidebar-as-subscriptions-UX, no merged feed (papers over H8).
- Comments rendered flat regardless of `parentCommentId` (papers over H1).
- Full comment list rendered with no pagination (papers over M1).
- No "edited" indicator on posts or comments (papers over M10).
- Search entirely skipped (papers over M8).
