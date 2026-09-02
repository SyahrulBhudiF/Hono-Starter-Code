# AGENTS.md

Hono/Bun REST API starter with PostgreSQL, Drizzle ORM, Redis, JWT auth, Zod OpenAPI, Scalar, Biome, and Vitest.

## Essentials

- Package manager/runtime: **Bun**. Do not use npm/yarn/pnpm commands.
- TypeScript is strict. Keep `bunx tsc --noEmit` green.
- Formatter/linter: **Biome** with tabs and double quotes.
- API framework: **Hono** + `@hono/zod-openapi`.
- Database: **PostgreSQL** via **Drizzle ORM**.
- Redis is used for cache/session/OTP/token blacklist and Bull queues.
- Prefer concrete repositories in `src/repository/*`.
- Read configuration through `src/config/env.ts`; never read `process.env` in app code.

No Cursor rules or Copilot instructions were present when this file was created.

## Commands

Install:

```bash
bun install
```

Run app:

```bash
bun run dev
```

Run worker:

```bash
bun run worker
```

Docker dev stack:

```bash
docker compose up --build
```

Database:

```bash
bun run migrate
bun run seed
```

Lint/format/check:

```bash
bun run lint
bun run format
bun run check
bun run check:fix
```

Typecheck:

```bash
bun run typecheck
```

Tests:

```bash
bun run test
bun run coverage
```

Run one test file:

```bash
bunx vitest run tests/response-util.test.ts
```

Run one test by name:

```bash
bunx vitest run -t "serves the application and API documentation"
```

Before committing or handing off, run:

```bash
bun run check && bun run typecheck && bun run coverage
```

## Project structure

```text
src/app.ts             Hono app factory, global middleware, docs and health routes
src/index.ts           Bun default-export entrypoint and shutdown handlers
src/config/            env, db, redis, queue, mail, logging config
src/controller/        Hono handlers; HTTP only
src/middleware/        Hono middleware
src/model/             request/response types and mappers
src/repository/        concrete Drizzle repositories
src/route/             OpenAPI route definitions
src/service/           business logic
src/types/             shared enums and types
src/util/              small utilities
src/validation/        Zod request schemas
tests/                 Vitest unit and integration tests
```

## Environment

- Copy `.env.example` to `.env`.
- Local app uses local hosts, e.g. `REDIS_HOST=localhost`, database host `localhost`.
- Docker Compose overrides service hosts, e.g. `REDIS_HOST=redis`, database host `db`.
- `src/config/env.ts` parses and validates the environment once at startup. Import `env`
  from it instead of touching `process.env`.
- `requireEnv` in `src/util/util.ts` exists only for `drizzle.config.ts`, which must run
  without the full application schema.
- JWT secrets must be at least 32 characters. Generate with `openssl rand -hex 32`.

## Code style

- Use TypeScript for all app code.
- Use tabs; Biome enforces formatting and import organization.
- Use double quotes.
- Keep modules small and purpose-specific.
- Avoid compatibility wrappers, legacy shims, and broad generic abstractions.
- Prefer clear boring code over clever type gymnastics.
- Avoid unsafe casts. If one is unavoidable, keep it local and explain why.
- Do not mutate request DTOs when a new value is clearer.
- Use `type` imports for types.
- Keep exported names descriptive:
  - controllers: `authController`, `userController`
  - services: `AuthService`, `UserService`
  - repositories: `userRepository`, `UserRepository`
  - routes: `loginRoute`, `getUserRoute`

## Hono and OpenAPI

- Build routes with `createRoute` from `@hono/zod-openapi`.
- Use `z` from `@hono/zod-openapi` for OpenAPI schemas.
- Use top-level Zod v4 formats, e.g. `z.email()`, not deprecated `z.string().email()`.
- Keep route schemas in `src/route/*` and request schemas in `src/validation/*`.
- Controllers should use `c.req.valid("json")` for validated JSON bodies.
- Do not parse validated OpenAPI request bodies with `await c.req.json()`.
- The Bun entrypoint is a default export (`{ port, fetch }`), per the Hono Bun docs.
  Do not swap it for `Bun.serve` without a reason; Hono ships no `serve()` for Bun.
- Keep these routes available:
  - `/doc` OpenAPI JSON
  - `/scalar` Scalar API Reference
  - `/health` dependency health check
- Success bodies use a numeric `status` that matches the HTTP status; declare
  `status: z.number()` in route schemas.
- Pass an explicit status to `c.json(body, 200)` in handlers so the OpenAPI response
  union resolves.

## Layering rules

- Controller: HTTP boundary only. Read validated input, call service, return `ResponseUtil`.
- Service: business rules, auth flow, hashing, token generation, orchestration.
- Repository: Drizzle queries only. No auth/business decisions unless directly DB-specific.
- Model: request/response types and mapping helpers only.
- Validation: Zod schemas only.

Do not put Drizzle queries directly in controllers or services when a repository method belongs there.

## Repository and Drizzle rules

- Add concrete repositories under `src/repository/*`.
- Find and update queries must exclude soft-deleted rows with `isNull(usersTable.deletedAt)`.
- Use Drizzle schema types:

```ts
type User = typeof usersTable.$inferSelect
type NewUser = typeof usersTable.$inferInsert
```

- Return `null` for find-one misses.
- Throw `HTTPException(404, ...)` or return `null` for update/delete misses; do not silently return `undefined`.
- Prefer explicit methods like `findByEmail`, `updateById` over generic `findByColumn`.

## Error handling

- Throw `HTTPException` for expected API errors.
- Let global `errorUtil` format API errors.
- Keep response body status aligned with HTTP status.
- Do not leak sensitive details in auth errors.
- Avoid account enumeration when possible.
- Verify tokens before mutating Redis state.
- Cache only real users; never cache `null`.
- Call `invalidateUserCache(userId)` after every user write, otherwise a stale role or
  password survives in Redis for the cache TTL.
- Blacklist tokens by their `jti`, never by the raw token string.

## Testing

- Use Vitest: `import { describe, expect, test } from "vitest"`.
- `tests/setup-env.ts` provides the environment; do not set env vars inside test files.
- Reuse `userFixture` from `tests/fixtures.ts` for `User` rows.
- Integration tests should prefer Hono `app.request()` from `createApp()`.
- Do not require a running HTTP server for app route smoke tests.
- Add/update tests when changing behavior, validation, route docs, or helpers.
- Do not add tests for things TypeScript already guarantees.

## Docker and compose

- Keep Compose env minimal: use `env_file: .env` and override only Docker-specific hosts.
- App container database host should be `db`.
- App/worker Redis host should be `redis`.
- Avoid duplicating every env var inside `compose.yaml`.
- The Dockerfile is multi-stage; the runtime stage runs as the non-root `bun` user.
- PostgreSQL extensions belong in `docker/init-db.sql`, not in an entrypoint override.
- Keep `.dockerignore` covering `.env`, `.git`, `node_modules`, and `coverage`.

## Git workflow

- Keep changes focused.
- Run checks before commit.
- Use Conventional Commits, e.g.:
  - `feat(auth): add reset password flow`
  - `fix(redis): avoid caching missing users`
  - `refactor(api): simplify route schemas`
  - `docs(readme): update setup notes`
