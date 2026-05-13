# AGENTS.md

Hono/Bun REST API starter with PostgreSQL, Drizzle ORM, Redis, JWT auth, Zod OpenAPI, Swagger UI, Scalar, Biome, and Bun tests.

## Essentials

- Package manager/runtime: **Bun**. Do not use npm/yarn/pnpm commands.
- TypeScript is strict. Keep `bunx tsc --noEmit` green.
- Formatter/linter: **Biome** with tabs and double quotes.
- API framework: **Hono** + `@hono/zod-openapi`.
- Database: **PostgreSQL** via **Drizzle ORM**.
- Redis is used for cache/session/OTP/token blacklist and Bull queues.
- Prefer concrete repositories in `src/repository/*`; do not add new imports from deprecated `src/types/repository.ts`.

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
bunx tsc --noEmit
```

Tests:

```bash
bun test
bun run test:unit
bun run test:integration
```

Run one test file:

```bash
bun test test/unit/response-util.test.ts
bun test test/integration/app.test.ts
```

Run one test by name:

```bash
bun test -t "GET /doc returns OpenAPI 3.1 document"
```

Before committing or handing off, run:

```bash
bun run check && bunx tsc --noEmit && bun test
```

## Project structure

```text
src/app.ts             Hono app factory, global middleware, docs routes
src/index.ts           app entry point
src/config/            db, redis, queue, mail, logging config
src/controller/        Hono handlers; HTTP only
src/middleware/        Hono middleware
src/model/             request/response types and mappers
src/repository/        concrete Drizzle repositories
src/route/             OpenAPI route definitions
src/service/           business logic
src/types/             shared types; deprecated repository reference
src/util/              small utilities
src/validation/        Zod request schemas
test/unit/             unit tests
test/integration/      Hono app.request() integration tests
```

## Environment

- Copy `.env.example` to `.env`.
- Local app uses local hosts, e.g. `REDIS_HOST=localhost`, database host `localhost`.
- Docker Compose overrides service hosts, e.g. `REDIS_HOST=redis`, database host `db`.
- `requireEnv<T = string>(name)` defaults to string. Use explicit generic only when needed:

```ts
requireEnv("JWT_ACCESS_SECRET")
requireEnv<number>("REDIS_PORT")
```

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
- Keep docs routes available:
  - `/doc` OpenAPI JSON
  - `/ui` Swagger UI
  - `/scalar` Scalar API Reference

## Layering rules

- Controller: HTTP boundary only. Read validated input, call service, return `ResponseUtil`.
- Service: business rules, auth flow, hashing, token generation, orchestration.
- Repository: Drizzle queries only. No auth/business decisions unless directly DB-specific.
- Model: request/response types and mapping helpers only.
- Validation: Zod schemas only.

Do not put Drizzle queries directly in controllers or services when a repository method belongs there.

## Repository and Drizzle rules

- Add concrete repositories under `src/repository/*`.
- Do not use the deprecated generic repository in `src/types/repository.ts` for new code.
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

## Testing

- Use Bun test: `import { describe, expect, test } from "bun:test"`.
- Integration tests should prefer Hono `app.request()` from `createApp()`.
- Do not require a running HTTP server for app route smoke tests.
- Add/update tests when changing behavior, validation, route docs, or helpers.
- Do not add tests for things TypeScript already guarantees.

## Docker and compose

- Keep Compose env minimal: use `env_file: .env` and override only Docker-specific hosts.
- App container database host should be `db`.
- App/worker Redis host should be `redis`.
- Avoid duplicating every env var inside `compose.yaml`.

## Git workflow

- Keep changes focused.
- Run checks before commit.
- Use Conventional Commits, e.g.:
  - `feat(auth): add reset password flow`
  - `fix(redis): avoid caching missing users`
  - `refactor(api): simplify route schemas`
  - `docs(readme): update setup notes`
