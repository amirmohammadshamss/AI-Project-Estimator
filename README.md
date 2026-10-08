# AI Project Estimator

A Next.js/NestJS workspace for versioned software estimates. Costs are calculated
by the backend; AI supplies features, hours, risks, and technology suggestions.
See [PLAN.md](PLAN.md) for implementation progress and pending acceptance checks.

## Development

Use Node 20+ and pnpm 9.15.0. Run `pnpm install`, copy `.env.example` to `.env`,
set JWT secrets, and start PostgreSQL and Redis. Export the environment variables
in the shell used to run the API (Prisma commands also need `DATABASE_URL`).

```sh
pnpm --filter @ape/api prisma:generate
pnpm --filter @ape/api exec prisma migrate deploy
pnpm dev:api
# In another terminal:
pnpm dev:web
```

The web app runs at http://localhost:3000, the API at http://localhost:4000,
and API documentation at http://localhost:4000/api/docs.

## AI generation

Set `OPENAI_API_KEY` only on the backend. Optional settings are `OPENAI_MODEL`
(default `gpt-4o-mini`), `OPENAI_TIMEOUT_MS` (default 60000; valid range
1000–120000), and `OPENAI_EMBEDDING_MODEL` (default `text-embedding-3-small`).
Generation fails with a safe error if no key is configured; manual estimates
remain available. The API does not automatically retry provider failures.

Open a project and choose **Generate Estimate**, supplying the hourly rate and
three-letter currency. The backend reads the saved project description and
validates the AI response before creating a version. Review generated assumptions
and hours. Editing hours creates a new version and preserves previous versions.

- `POST /projects/:id/estimates`: AI generation; body `{ "hourlyRate": 50, "currency": "USD" }`.
- `POST /projects/:id/estimates/manual`: manual creation with summary, rate, currency, and features.
- `GET /projects/:id/estimates`: version history.
- `GET /projects/:id/estimates/:estimateId`: version detail.
- `PATCH /projects/:id/estimates/:estimateId/items/:itemId`: create a new version with updated hours.

If requirements change during generation, the API rejects the stale result with
`PROJECT_CHANGED`. Archived projects reject creation and edits. All routes
require authentication and enforce project ownership.

The provider uses strict structured outputs through the Responses API, based on
[official OpenAI documentation](https://developers.openai.com/api/docs/guides/structured-outputs).
The shared `@ape/types` package builds CommonJS runtime schemas for the API and
provides declarations for both apps. API build/dev/test/typecheck scripts build it
first, so direct app commands work in a clean checkout.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

AI/SDK calls are mocked in tests; no API key is needed. Live database, browser,
and OpenAI acceptance checks are tracked separately in PLAN.md.

## Semantic retrieval and knowledge seeding

Apply migrations on PostgreSQL with the pgvector extension available. The Compose
PostgreSQL image includes pgvector. The migration enables `vector` and stores
1536-dimensional feature embeddings. Embedding models must support the
`dimensions` parameter (the default is `text-embedding-3-small`).

With backend environment variables exported, run `pnpm db:seed` to embed 14 common
features. This calls OpenAI and requires a key. The seed generates all vectors
before atomically upserting feature rows by name/model, so it can be rerun safely.
Reference hours are illustrative baselines; the AI adapts them to project scope.
Demo project/estimate seeding remains scheduled for Phase 10.

Generation now embeds the saved project description, retrieves the five nearest
features using [pgvector cosine distance](https://github.com/pgvector/pgvector#querying),
and supplies their descriptions, categories, reference hours and complexity to
the AI. Only vectors from the configured embedding model are compared. Switching
models requires rerunning the seed. An empty knowledge base produces no reference
context. Embedding/search failures produce a safe generation failure.

Search results are cached for five minutes using model/count/description-hash
keys. Redis failures fall back to fresh retrieval; reseeded results may take up to
five minutes to appear. Exact nearest-neighbor search is sufficient for this small
knowledge base; vector indexes can be added when corpus size warrants them.

An optional real-database integration test checks known-vector ranking and model
isolation. Set `VECTOR_TEST_DATABASE_URL` to a pgvector-enabled test database and
run `pnpm --filter @ape/api test -- --runInBand search.database.spec.ts`. The test
uses a temporary table and does not modify application records. It is skipped
when the variable is unset, and does not call OpenAI.

## Dashboard analytics

`GET /dashboard/stats` returns authenticated, owner-scoped analytics. Counts and
hours include archived projects, and each project contributes its latest estimate
only. Average size excludes projects without estimates; confidence is unavailable
when no estimates exist. Costs are grouped by UTC creation month of the latest
estimate and displayed separately per currency. This is a current-estimate
snapshot, not an audit history of every saved version or actual spending.

The dashboard shows the ten largest estimated projects and five recently updated
projects. Recharts resize to their containers and have text data alternatives.
Redis caches each user's stats for 60 seconds, with revision invalidation after
project/estimate mutations and fresh reads when Redis is unavailable.

The dashboard browser tests mock the API and need no database or OpenAI key:

```sh
pnpm --filter @ape/web build
pnpm --filter @ape/web exec playwright install chromium
pnpm test:e2e
```

To use an existing Chrome installation instead of downloading Chromium, set
`PLAYWRIGHT_CHANNEL=chrome` when running `pnpm test:e2e`. These tests verify three
viewport sizes and retry behavior; the full application acceptance journey is
still scheduled for Phase 9.

## Estimate insights and PDF reports

Apply the project-snapshot migration before running this version of the API.
New estimates save the project name and description, and hour edits retain those
snapshots. Legacy estimates are backfilled with current project text at migration
time; their earlier project text cannot be reconstructed.

The estimate page shows saved technology recommendations and risks. **Explain
estimate** requests concise reasoning through AiService. **Analyze risks** uses
that version's saved project description and shows additional analysis separately.
These on-demand results do not mutate the estimate and are not added to its PDF.
They require backend OpenAI configuration, while PDF export does not.

- `POST /estimates/:id/explain`: `{ explanation }`.
- `POST /estimates/:id/risks`: `{ risks: [{ title, description, severity }] }`.
- `POST /estimates/:id/export`: downloadable `application/pdf`, with no-store headers.

All three routes enforce estimate ownership, including archived versions. Reports
include the user's name (email fallback), project snapshot, executive summary,
hours/rate/cost, feature category/complexity/hours/cost/confidence and manual-edit
markers, recommendations, saved risks, overall confidence, generated date and
page numbers. PDFKit wraps long text onto new pages, with embedded Noto Sans
Latin fonts. Font fallback for other scripts remains future work.

An `ESTIMATE_EXPORTED` activity is written only after rendering succeeds and
ownership is rechecked. Failed rendering produces a sanitized `PDF_EXPORT_FAILED`
error. The PDF tests extract the report text and check pagination; browser tests
check the insights controls and download behavior using mocked API responses.
