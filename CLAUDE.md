# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack personal health management app: Vue 3 SPA frontend + Node.js/Express API backend, with MySQL + Redis storage and optional Ollama local LLM for AI chat.

## Commands

```bash
# Infrastructure (from project root)
docker compose up -d              # Start MySQL (3307) + Redis (6379)

# Backend (cd backend)
npm run dev                       # nodemon hot-reload on port 3000
npm start                         # Production mode
npm test                          # Jest with coverage

# Frontend (cd frontend)
npm run dev                       # Vite dev server on port 5173
npm run build                     # Production build
npm run preview                   # Preview production build
```

Vite proxies `/api/*` requests to `localhost:3000` in dev mode — no CORS issues locally.

## Architecture

**Backend** follows a strict layered pattern: `routes → controllers → services → (db/redis/ollama)`. Every module (auth, users, health, analysis, reminders, chat, export) has its own route/controller/service files. No business logic in controllers or routes.

**Frontend** uses Vue 3 Composition API with Pinia stores. Each view is lazy-loaded via the router. `AppLayout.vue` wraps authenticated pages with sidebar + bottom nav + mobile header. The `axios.js` instance auto-attaches JWT tokens and handles 401 → token refresh → retry.

**Backend middleware chain** (in order): `helmet → cors → generalLimiter(200/15min) → express.json → routes → errorHandler`. Auth uses two JWT middleware variants: `auth` (sync, chat/read ops) and `authStrict` (async, checks Redis blacklist, sensitive ops). Chat messages have an additional `chatLimiter` (15/60s).

**API response shape** is always `{ success: boolean, data?, error?: { code, message } }`. Use the `success(res, data, message?, status?)` and `error(res, code, message, status?)` helpers from `utils/helpers.js`.

**Database** (MySQL 8.0, InnoDB, utf8mb4): Schema is in `backend/src/models/schema.sql` which auto-runs on first `docker compose up`. There's no migration system — schema changes go through one-off scripts like `backend/src/models/migrate.js`.

**Redis** key prefix is `ha:`. Keys: `chat_ctx:{conversationId}` (TTL 30min), `daily_stats:{userId}:{date}`, `summary:{userId}:{period}`, `jwt_blacklist:{jti}`, `refresh:{userId}:{jti}`, `reminders_due` (sorted set).

**Chat module**: Multi-conversation design. Each user can have many conversations. Messages stored in `chat_history` with FK to `conversations`. Redis caches per-conversation context (last 20 messages). Ollama integration in `chat.service.js` — calls `qwen3.5:9b` model at `http://localhost:11434/api/chat` with 30s timeout, falls back to keyword matching if unreachable.

**Frontend routing** (all lazy-loaded):

| Path | Name | Auth |
|------|------|------|
| `/login` | Login | guest only |
| `/` | Dashboard | requiresAuth |
| `/record` | Record | requiresAuth |
| `/analysis` | Analysis | requiresAuth |
| `/chat` | Chat | requiresAuth |
| `/profile` | Profile | requiresAuth |

The router guard reads `accessToken` from localStorage. `axios.js` handles 401 by attempting token refresh, clearing auth on failure.

**Key frontend patterns**:
- `App.vue` is just `<router-view>` with `<keep-alive>`
- Each view wraps itself in `<AppLayout>` (not global)
- Sidebar/BottomNav active state matches `route.name.toLowerCase() === 'chat'` etc.
- CSS: variables in `variables.css`, component styles in `components.css`, responsive in `responsive.css`
- Chat uses Pinia store (`chat.store.js`) with conversation list + current conversation + messages state

## Constraints

- No TypeScript — plain JavaScript only
- No migration system — schema changes need manual scripts
- Frontend imports use `@/` alias for `src/`
- `docker-compose.yml` mounts `schema.sql` for initial DB setup only; changes to existing tables need separate migration scripts
- `DB_PORT` is 3307 (mapped from container 3306)
- Ollama model default is `qwen3.5:9b` (configurable via `OLLAMA_MODEL` env var)
- Temperature is 0.5, top_p is 0.9

---

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
