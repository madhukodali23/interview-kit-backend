# AI Interview Prep Kit — Backend

Node.js/Express/TypeScript API that turns a job description, a company URL,
and a number of prep days into a full interview preparation kit: company
brief, role breakdown, categorized questions, flashcards, a deterministic
day-by-day schedule, and requirement coverage.

## Stack

- Node.js (TypeScript, NodeNext ESM)
- Express 5
- MongoDB + Mongoose
- express-session + connect-mongo (session store)
- bcryptjs (password hashing)
- OpenAI SDK against OpenRouter (LLM)
- Cheerio (HTML parsing for company research)

## Architecture

```
src/
├── config/        env vars, tunable limits, prompt templates
├── controllers/   HTTP request/response handling only
├── errors/        AppError, error codes, error messages
├── infrastructure/
│   ├── llm/       OpenRouter client (retries, error mapping)
│   ├── web/       HTTP fetch, HTML cleaning, link discovery/ranking, crawling
│   └── search/    public interview-discussion search (not yet implemented — see Known gaps)
├── layers/
│   ├── parsing/   robust LLM JSON extraction (handles markdown code fences)
│   ├── retry/     retry/backoff + retryable-error detection
│   ├── security/  URL validation, SSRF/private-network protection
│   └── validation/ input & structural validation, one file per concern
├── middleware/    auth guard, 404 handler, centralized error handler
├── repositories/  Mongoose models + data access
├── routes/        Express routers (thin, just wire controllers to paths)
├── services/      business logic: retrieval, extraction, generation,
│                  scheduling, coverage, persistence — each as its own module
├── types/         shared domain types
├── tests/         node:test unit tests
├── cli/           evaluation CLI
└── server.ts      app wiring / entry point
```

The generation pipeline is a sequence of deliberate steps
(`services/createInterviewKit.service.ts`'s `buildInterviewKit`), not one
giant LLM prompt: JD extraction → company research → question generation →
deterministic coverage pass → flashcard generation → deterministic
scheduling → final validation. `buildInterviewKit` is pure (no persistence),
`createInterviewKit` wraps it with DB save + duplicate-submission
protection — this is also what lets the evaluation CLI run the exact same
pipeline as the live API without needing a database.

## Setup

```
npm install
copy .env.example .env
```

Fill in `.env` (see table below), then:

```
npm run dev
```

## Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `5000` | HTTP port |
| `NODE_ENV` | no | `development` | Set to `production` in deployment — gates SSRF protection, secure cookies, and `trust proxy` (see Security & deployment below) |
| `OPENROUTER_API_KEY` | yes | — | Server refuses to start without it |
| `LLM_MODEL` | no | `openrouter/free` | Any OpenRouter model id |
| `MONGODB_URI` | yes | — | Server refuses to start without it |
| `SESSION_SECRET` | yes | — | Server refuses to start without it |
| `CORS_ORIGIN` | required in production only | `http://localhost:3000` in dev | Your deployed frontend's origin |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled build (`dist/server.js`) |
| `npm test` | Run the unit test suite (Node's built-in test runner) |
| `npm run evaluate -- --input cases.json --output kits.json` | Batch-run the generation pipeline over a set of cases |

## API

All routes are prefixed with `/api`. All `interview-kits` routes require an
authenticated session (`requireAuth`) and only ever operate on kits owned by
the current session's user.

**Health**
- `GET /api/health`

**Auth** (session-cookie based)
- `POST /api/auth/register` — `{ email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/session`

**Interview kits**
- `POST /api/interview-kits` — `{ jobDescription, companyUrl, days }`, runs the full pipeline
- `GET /api/interview-kits` — list the current user's kits
- `GET /api/interview-kits/:id`
- `PUT /api/interview-kits/:id`
- `DELETE /api/interview-kits/:id`

**Builder — questions / flashcards / requirements / company brief**
- `POST /api/interview-kits/:id/questions`
- `PATCH /api/interview-kits/:id/questions/:questionId`
- `DELETE /api/interview-kits/:id/questions/:questionId`
- `PUT /api/interview-kits/:id/questions/reorder` — `{ questionIds: string[] }`
- `POST /api/interview-kits/:id/flashcards`
- `PATCH /api/interview-kits/:id/flashcards/:flashcardId`
- `DELETE /api/interview-kits/:id/flashcards/:flashcardId`
- `PUT /api/interview-kits/:id/flashcards/reorder` — `{ flashcardIds: string[] }`
- `PATCH /api/interview-kits/:id/requirements/:requirementId`
- `PATCH /api/interview-kits/:id/company-brief`
- `POST /api/interview-kits/:id/regenerate/:section` — `section` is `questions` \| `flashcards` \| `company-brief`; preserves items the user pinned or edited

**Practice mode**
- `GET /api/interview-kits/:id/practice` — flashcards ordered by practice priority (never-practiced and low-confidence first, "covered" cards last) plus a progress summary
- `POST /api/interview-kits/:id/practice/:flashcardId/review` — `{ confidence: "low"|"medium"|"high", covered: boolean }`, returns the updated card, the next card to practice, and the updated summary

Every error response has the shape `{ success: false, code, message }` with
an appropriate HTTP status. Every success response has `{ success: true, data }`.

## Evaluation CLI

```
npm run evaluate -- --input cases.json --output kits.json
```

`cases.json` is a JSON array:

```json
[
  { "id": "case-1", "jobDescription": "...", "companyUrl": "https://example.com", "days": 5 }
]
```

`kits.json` is written as a JSON array of
`{ id, status: "success" | "failure", kit?, error? }` — one entry per case.
Each case runs independently; a failure in one case (bad URL, LLM error,
validation failure) does not stop the rest of the batch. The exit code is
`1` if any case failed, `0` if all succeeded.

## Testing

```
npm test
```

Covers: deterministic schedule generation and validation, the two-pass
coverage/missing-question logic (including the "still incomplete after
retry" failure path via a mocked generator), and structural validation for
kits, company briefs, JD extraction, and practice reviews.

Not covered by automated tests: full builder CRUD operations (add/edit/
delete/reorder against a real kit) and the crawling/LLM infrastructure
itself, since both need a live MongoDB / network — see Known gaps.

## Security

- **SSRF / private-network protection** (`layers/security/urlValidator.ts`):
  every fetch — including each redirect hop — is validated. In production
  (`NODE_ENV=production`), any hostname resolving to a private, loopback,
  link-local, or reserved IP is rejected. This is a DNS-lookup-time check,
  not a connect-time IP pin, so it does not fully close DNS-rebinding races;
  pinning the resolved address for the actual socket would be the next
  hardening step if needed.
- **Untrusted fetched content**: crawled page text is only ever used as data
  interpolated into LLM prompts, never executed or treated as instructions.
  Content-type is restricted to HTML-like responses, and body size is capped
  against actual bytes received (not just a trusted `Content-Length` header).
- **Unreachable research sources**: the primary company URL failing is a
  hard error (nothing to build a brief from); secondary discovered pages
  that fail are skipped and reported on `kit.warnings`, not treated as a
  fatal error.
- **Sessions**: MongoDB-backed, `httpOnly` always; `secure` + `sameSite=none`
  in production (required for a cross-origin frontend), `sameSite=lax` in
  development.
- **Request bodies**: capped at 1MB; malformed JSON / oversized payloads
  return a clean `400`/`413` JSON error instead of a generic `500`.

## Deployment readiness

1. `npm ci && npm run build`
2. Set all required env vars (see table above) — the process refuses to
   start if any are missing. **Set `NODE_ENV=production`** — this is what
   enables SSRF protection, secure session cookies, and `trust proxy`
   (required for secure cookies to work correctly behind a load balancer).
3. Set `CORS_ORIGIN` to your deployed frontend's exact origin.
4. `npm start`
5. `GET /api/health` is available for platform health checks.

No Dockerfile is included — the app runs directly on any standard Node
buildpack/host (Render, Railway, Fly, etc.) via the commands above. Ask if
you'd like one added.

## Known gaps

- **Public interview-discussion search** (`infrastructure/search/interviewDiscussionSearch.ts`)
  is a stub that returns `[]`. It's a named requirement in the original spec
  but wasn't part of any of the four backend-finalization steps actually
  scoped and built — flagging it rather than faking a result.
- **Builder CRUD isn't covered by automated tests** (see Testing above) —
  would need an in-memory MongoDB (e.g. `mongodb-memory-server`), which
  hasn't been added since it's a new dependency decision.
