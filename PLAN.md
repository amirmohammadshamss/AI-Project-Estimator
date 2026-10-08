# AI Project Estimator — Implementation Plan

Derived from `doc.md` (Full Project Specification). This plan expands the 10-phase
strategy in section 41 into concrete, ordered engineering tasks, file/module
layout, and per-phase "done" criteria so the project can be built incrementally
without losing architectural coherence.

Guiding constraints carried through every phase (see doc.md §39, §42):
- Deterministic logic (auth, cost math, persistence, versioning, permissions)
  lives in the backend. The LLM only produces features/complexity/hours/risks/
  stack suggestions/confidence — never cost totals or access decisions.
- All OpenAI calls go through a single `AiService` abstraction (§38). No
  controller or frontend code talks to OpenAI directly.
- No feature ships without validation (Zod/class-validator) and no business
  logic ships without a test.

---

## Progress — 2026-10-08

- Phases 1–2: existing setup and authentication implementation.
- Phase 3: project CRUD/archive, activity feed, forms, and ownership unit tests
  are implemented. Full browser/database acceptance remains to be verified.
- Phase 4: implemented Estimate/EstimateItem migration, validated manual creation,
  ownership-scoped list/detail endpoints, decimal cost calculation, project-scoped
  version allocation, and frontend creation/history/detail pages with inline hour
  editing and manual-edit badges. Creation, status changes, and activity logs are
  transactional. Hour edits copy the latest estimate to a new version; older
  versions remain immutable. Archived projects reject new estimates/edits.
- Phase 4 verification: unit tests cover cost arithmetic, input validation,
  ownership, version increments, manual flags, and stale-version rejection.
  Frontend tests cover history links, archived state, and manual form validation.
- Remaining before Phase 4 acceptance: apply migrations to a running PostgreSQL
  instance and exercise create → view → edit → history in the browser, including
  concurrent version creation. PostgreSQL was unavailable at localhost:5432.
- Phase 5: implemented AiService with injectable AiProvider/OpenAI SDK adapter,
  shared strict Zod output validation, configurable model/timeout, and generated
  estimates persisted with backend-calculated costs, risks, and stack suggestions.
  `POST /projects/:id/estimates` now generates from the saved description;
  manual creation remains at `POST /projects/:id/estimates/manual`.
  AI requests run outside transactions; ownership/archive/description are rechecked
  before saving. Invalid output, missing configuration, refusals, timeout, and
  provider failures produce a sanitized `AI_GENERATION_FAILED` response.
  The UI provides rate/currency inputs, a pending state, accessible failure feedback,
  and navigation to the generated version. Embedding/explanation/risk methods are
  implemented behind the same abstraction for later phases.
- Phase 5 verification: mocked-provider/SDK tests cover schema rejection, generated
  versioning/costs, preservation of risks/stack, ownership checks, project changes,
  provider failures, and frontend generation states; all 74 tests pass without live
  API calls. Type checking, lint (four existing auth-test warnings), and both app
  builds pass. No API key is needed for tests.
  Live OpenAI generation and database/browser acceptance remain unverified.
- Phase 6: implemented FeatureKnowledge with a pgvector migration, validated
  1536-dimensional embeddings, model-scoped exact cosine search, five-minute
  Redis retrieval caching, and description → embedding → retrieval → AI context
  generation. Redis outages fall back to fresh search; embedding/database errors
  are handled as safe generation failures. The idempotent seed embeds the 14
  reference features and atomically upserts by feature name/embedding model.
- Phase 6 verification: tests cover vector validation, parameterized cosine SQL,
  cache normalization/model separation/TTL/outage behavior, seed atomicity, and
  a full service pipeline with mocked AiProvider proving retrieved feature names
  reach the prompt and change the resulting hours/costs. A real pgvector nearest
  neighbor test is opt-in via VECTOR_TEST_DATABASE_URL; it remains unrun here.
  Verification: 89 tests pass; the real-database test is skipped. Type checking,
  Prisma schema validation, lint (four existing warnings), and app builds pass.
  Live migrations, embedding seeding, and browser acceptance remain pending.
- Phase 7: implemented authenticated GET /dashboard/stats with owner-scoped
  Prisma aggregations and a repeatable-read snapshot. Each project contributes
  only its latest estimate (including archived projects); costs stay separated
  by currency and are grouped by estimate creation month in UTC. The dashboard
  includes five KPIs, responsive hours/status/cost charts, accessible text data,
  recent project/version links, and loading/empty/error/retry states.
  A 60-second per-user Redis cache uses revision keys; every project/estimate
  mutation invalidates it after persistence, and frontend mutations invalidate
  dashboard queries. Old in-flight readers cannot refill the new cache revision.
- Phase 7 verification: unit tests cover ownership filters, latest-version
  aggregation, exact decimal sums, empty states, cache isolation/races/outages,
  mutation invalidation, and overview links. Browser tests use mocked API data
  to check mobile/tablet/desktop layouts and error recovery. Live database-backed
  dashboard acceptance remains pending.
- Next implementation phase: Phase 8 (explanation/risk panels and PDF export).

## 0. Repository & Tooling Baseline

```text
apps/
  web/            Next.js app
  api/            NestJS app
packages/
  shared/         cross-cutting utilities
  types/          shared TS types + Zod schemas (estimate JSON contract)
  config/         shared eslint/tsconfig/prettier base configs
```

- Package manager: pnpm workspaces (+ Turborepo only if build-graph caching
  becomes a real pain point — don't add it speculatively).
- Root configs: `tsconfig.base.json` (strict: true), `.eslintrc`, `.prettierrc`,
  `.editorconfig`, `.nvmrc`.
- `packages/types` owns the `EstimateResult` Zod schema (features, risks,
  suggestedStack, summary) so frontend and backend validate against the exact
  same contract — this is the single most important shared artifact in the repo.

**Done when:** `pnpm install` succeeds at the root; both apps boot with a
placeholder route; lint/typecheck run clean from the root.

---

## Phase 1 — Project Setup

1. Scaffold monorepo (`pnpm-workspace.yaml`, root `package.json`, Turborepo optional).
2. `apps/api`: NestJS project, module skeletons per doc.md §4 (`auth, users,
   projects, estimates, features, ai, embeddings, search, activity, health`).
3. `apps/web`: Next.js (App Router) + TypeScript + Tailwind, base layout.
4. Prisma init in `apps/api` pointed at Postgres; add `pgvector` extension
   plan now (migration will enable it in Phase 6).
5. `docker-compose.yml` with `web`, `api`, `postgres`, `redis` services and a
   `docker-compose.override.yml` or `.env` for local dev convenience.
6. `.env.example` at root (DATABASE_URL, REDIS_URL, JWT_SECRET,
   JWT_REFRESH_SECRET, OPENAI_API_KEY, NEXT_PUBLIC_API_URL).
7. Health module: `GET /health` checks DB + Redis connectivity.

**Done when:** `docker compose up` brings up all four services and `/health`
returns 200 from a container-to-container DB/Redis check.

---

## Phase 2 — Authentication & Authorization

1. **Prisma**: `User` model (doc.md §5).
2. **Backend (`auth` + `users` modules)**:
   - Password hashing with `argon2` or `bcrypt` (never plaintext).
   - `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`,
     `GET /auth/me`.
   - JWT access token (short-lived) + refresh token (longer-lived, rotated on
     use, stored hashed or in Redis for revocation).
   - `JwtAuthGuard` + `CurrentUser` decorator; a reusable
     `OwnershipGuard`/service check so users can only touch their own
     projects/estimates (§6).
   - class-validator DTOs for register/login payloads.
3. **Frontend**: `/login`, `/register` pages, auth state via TanStack Query +
   httpOnly cookies (preferred over localStorage for the refresh token),
   `AuthProvider`, route guards for protected pages.
4. Tests: registration/login happy paths, wrong-password rejection, refresh
   rotation, guard blocks cross-user access to another user's project.

**Done when:** a user can register, log in, refresh silently, log out, and
cannot fetch another user's project via direct ID manipulation (covered by a test).

---

## Phase 3 — Project Management (CRUD) & Activity Log

1. **Prisma**: `Project`, `ActivityLog` models (§5, §18).
2. **Backend (`projects`, `activity` modules)**:
   - `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, archive action.
   - Every mutation writes an `ActivityLog` row (`PROJECT_CREATED`,
     `PROJECT_UPDATED`, `PROJECT_ARCHIVED`, …) via a small `ActivityService`
     injected where needed — not duplicated per controller.
   - `GET /projects/:id/activity`.
3. **Frontend**: `/projects` list, create/edit forms (React Hook Form + Zod),
   `/projects/[id]` shell with project info + activity feed, delete/archive
   confirmation dialogs, empty/loading/error states.

**Done when:** full CRUD + archive works end-to-end from the UI, and the
project detail page shows a live activity trail after each mutation.

---

## Phase 4 — Estimate Domain (without AI yet)

Build the deterministic skeleton first so Phase 5 only has to plug in AI output.

1. **Prisma**: `Estimate`, `EstimateItem` models (§5), with `version` as an
   integer scoped per project, estimates immutable once created (§12).
2. **Backend (`estimates` module)**:
   - `POST /projects/:id/estimates` — accepts a manually-constructed estimate
     shape for now (or a stub AI response) to validate persistence/versioning.
   - `GET /projects/:id/estimates`, `GET /projects/:id/estimates/:estimateId`.
   - `CostCalculationService`: `totalCost = totalHours × hourlyRate`, pure
     function, fully unit tested — this is the canonical "deterministic, not
     LLM" example from §11/§39.
   - Manual-edit support on `EstimateItem.estimatedHours` with a
     `manuallyModified` flag surfaced to the frontend (§14).
3. **Frontend**: `/projects/[id]/estimate/[estimateId]` page with summary
   (hours/rate/cost/confidence), feature table (feature/category/complexity/
   hours/cost/confidence), inline hour editing with a "manually edited" badge.
4. Tests: version increments correctly and never overwrites prior versions;
   cost calculation unit tests; manual edit flagging.

**Done when:** estimates can be created, versioned, listed, and viewed, with
correct deterministic cost math — independent of any AI call.

---

## Phase 5 — AI Integration (Structured Output)

1. **`ai` module**: `AiService` with the four methods from §38
   (`generateEstimate`, `generateEmbedding`, `explainEstimate`,
   `detectRisks`). All OpenAI SDK usage is encapsulated here behind an
   interface (`AiProvider`) so it's mockable/swappable in tests (§26 — "mock
   the AI API during tests").
2. Define the `EstimateResult` Zod schema in `packages/types` matching the
   §8 JSON example (summary, features[], suggestedStack[], risks[]).
   `AiService.generateEstimate` parses the raw LLM response through this
   schema and throws a typed `AiValidationError` on mismatch — never trust
   raw output (§8).
3. Wire `POST /projects/:id/estimates` to actually call
   `AiService.generateEstimate(project.description)`, map the validated
   result into `Estimate` + `EstimateItem[]` rows, compute cost
   deterministically, persist as a new version.
4. Graceful failure path: AI timeout / invalid schema / rate limit → return a
   structured `INVALID_PROJECT`/`AI_GENERATION_FAILED` error (§22), log
   internally, never leak stack traces.
5. **Frontend**: "Generate Estimate" action with loading state, error toast on
   failure, redirect to the new estimate version on success.
6. Tests: schema validation rejects malformed AI JSON; `AiService` is mocked
   in all estimate-generation tests (no real API key needed in CI).

**Done when:** a real project description produces a validated, persisted,
versioned estimate end-to-end, and a malformed mock AI response is handled
without crashing the request.

---

## Phase 6 — Semantic Search & RAG Pipeline

1. **Prisma**: `FeatureKnowledge` model with a `vector` column (pgvector
   extension migration) (§5, §9).
2. **`embeddings` module**: `AiService.generateEmbedding(text)`; a seed script
   embeds the knowledge-base feature list from §9/§33.
3. **`search` module**: `SearchService.findSimilarFeatures(embedding, k)`
   using pgvector cosine/L2 similarity (`<=>` operator via raw SQL or Prisma
   `queryRaw`) — explicitly not string matching (§9).
4. Extend the estimation pipeline to match the §10 flow:
   description → embedding → similarity search → build AI context (retrieved
   features as few-shot/context) → `AiService.generateEstimate` → schema
   validation → persist.
5. Cache semantic search results per normalized description in Redis with a
   short TTL (§24 — concrete use case, not Redis-for-its-own-sake).
6. Tests: similarity search returns expected nearest features for known seed
   embeddings; RAG context actually reaches the prompt (integration test with
   mocked `AiProvider` asserting the prompt contains retrieved feature names).

**Done when:** estimate generation visibly improves/varies based on which
knowledge-base features are semantically closest to the description, and this
is verifiable in a test, not just by eyeballing output.

---

## Phase 7 — Dashboard & Analytics

1. **Backend**: `GET /dashboard/stats` — total projects, estimated projects,
   average project size, total estimated hours, average confidence, computed
   with Prisma aggregations; cache in Redis with invalidation on
   estimate/project mutation (§13, §24).
2. **Frontend**: `/dashboard` with KPI cards, Recharts visualizations —
   estimated hours by project, status distribution, cost over time — plus a
   recent-projects list matching the §13 example layout.
3. Responsive behavior: cards stack, charts resize, tables → horizontally
   scrollable or card view on mobile (§32).

**Done when:** dashboard reflects real aggregated data from seeded + user
projects and adapts correctly at mobile/tablet/desktop breakpoints.

---

## Phase 8 — Explanation, Risk Detection, Tech Recommendations, PDF Export

1. Extend `AiService.explainEstimate` / `detectRisks` to produce the §15/§16
   outputs (concise user-facing reasoning only, no chain-of-thought; risks
   with `title/description/severity`). Validate with Zod same as §8.
2. Surface `suggestedStack` (already part of `EstimateResult` from Phase 5) as
   the §17 technology recommendation panel — confirm it's derived from
   requirements, not hardcoded.
3. **PDF export** (§19): `POST /estimates/:id/export` generates a PDF
   (e.g. via `@react-pdf/renderer` or `puppeteer`) containing the fields listed
   in §19; log `ESTIMATE_EXPORTED` activity.
4. **Frontend**: risk list with severity badges, "why this estimate" panel,
   stack recommendation cards, export button with download handling.

**Done when:** every item in the §19 PDF content list appears correctly in the
exported file, and risk/explanation panels render from real AI output.

---

## Phase 9 — Testing Hardening

Fill in anything not already covered incrementally in prior phases:

- **Backend (Jest)**: confirm full coverage of the §26 list — auth,
  project creation, authorization boundaries, estimate generation, cost
  calculation, AI response validation, semantic search, error handling.
- **Frontend**: component tests for estimate table, dashboard charts,
  forms (RHF+Zod validation paths).
- **E2E (Playwright)**: register → login → create project → generate
  estimate → view estimate → export, per §26, with the AI provider mocked at
  the network boundary so CI needs no real `OPENAI_API_KEY`.

**Done when:** `pnpm test` (unit+integration) and `pnpm e2e` both pass in a
clean checkout with no `OPENAI_API_KEY` set.

---

## Phase 10 — CI/CD, Docs, Seed Data, Polish

1. **Seed script** (§33): knowledge-base features + a few demo projects with
   generated estimates for a realistic first-run experience.
2. **Swagger/OpenAPI** at `/api/docs` covering auth/projects/estimates/
   dashboard/activity (§21).
3. **GitHub Actions** (§29): install → lint → typecheck → unit tests →
   integration tests → build web → build api; fail fast on any step.
4. **README** (§34): overview, features, architecture diagram, local dev,
   env vars, DB setup/migrations/seed, testing, Docker, API docs link,
   architecture decisions, future improvements.
5. Security pass against the §23 checklist: rate limiting (e.g. Nest
   throttler), CORS config, helmet-equivalent headers, request size limits,
   confirm no secrets in git history, confirm OpenAI key never reaches the
   frontend bundle.
6. Commit hygiene check (§35): squash/rebase any "giant commit" moments from
   earlier phases into a coherent, meaningful commit history before calling
   the repo done.

**Done when:** a fresh clone can run `pnpm install && docker compose up`,
complete all 15 steps of the §40 acceptance walkthrough, and CI is green.

---

## Cross-Phase Tracking Checklist

Use this as the single source of truth for "is this spec requirement actually
done," independent of which phase it landed in:

- [ ] Auth: register/login/logout/refresh/me, hashed passwords, ownership enforced
- [ ] Projects: CRUD + archive + activity log
- [ ] Estimates: generation, versioning (immutable), manual hour edit w/ flag
- [x] Cost calculation is backend-deterministic, unit tested
- [x] AI output validated via Zod, failures handled gracefully, never exposes raw errors
- [ ] Semantic search uses pgvector embeddings, not string matching
- [x] RAG context demonstrably influences generated estimates
- [ ] Dashboard stats + charts, responsive
- [ ] Risk detection + explanation + stack recommendations from real AI output
- [ ] PDF export contains all required fields
- [ ] Redis used only for stats cache / search cache / rate limiting — no filler usage
- [ ] Background-job abstraction exists or is cleanly deferrable (§25)
- [ ] Jest (unit+integration) + Playwright E2E, AI mocked, no API key needed in CI
- [ ] Docker Compose brings up web/api/postgres/redis
- [ ] `.env.example` complete, no secrets committed
- [ ] GitHub Actions CI pipeline fails on lint/typecheck/test/build failure
- [ ] Swagger docs at `/api/docs`
- [ ] README complete per §34
- [ ] Meaningful, incremental commit history
- [ ] Full §40 15-step acceptance walkthrough passes manually
