# Contributing to Hono Starter Code

Thanks for contributing.

## Getting started

1. Fork and clone the repository.

```bash
git clone https://github.com/SyahrulBhudiF/Hono-Starter-Code
cd Hono-Starter-Code
```

2. Install dependencies.

```bash
bun install
```

3. Create env file.

```bash
cp .env.example .env
```

4. Start services.

```bash
docker compose up --build
```

Or run the app directly if PostgreSQL and Redis are already available:

```bash
bun run dev
```

## Environment notes

For Docker Compose, Redis host should be the Compose service name:

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

For local development outside Docker:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Use `DATABASE_URL` that matches your runtime:

```env
# Docker Compose
DATABASE_URL=postgresql://user123:user123@db:5432/hono_starter

# Local
DATABASE_URL=postgresql://user123:user123@localhost:5432/hono_starter
```

## Development workflow

Create a focused branch:

```bash
git checkout -b feat/your-feature
```

Keep changes small and scoped. Update docs when behavior, setup, routes, or scripts change.

## Architecture guidelines

- Use Hono route modules in `src/route`.
- Use controllers only for HTTP request/response handling.
- Put business logic in `src/service`.
- Put Drizzle queries in concrete repositories under `src/repository`.
- Do not add new code that imports the deprecated generic repository in `src/types/repository.ts`.
- Put request schemas in `src/validation`.
- Use `@hono/zod-openapi` schemas for OpenAPI routes.
- Prefer `app.request()` for integration tests.

## Checks before PR

Run:

```bash
bun run check
bunx tsc --noEmit
bun test
```

Auto-fix formatting/lint issues:

```bash
bun run check:fix
```

## Testing

```bash
bun test
bun run test:unit
bun run test:integration
```

Unit tests live in `test/unit`.
Integration tests live in `test/integration` and should use Hono `app.request()` when possible.

## Pull request process

1. Rebase or merge latest `main`.
2. Run checks and tests.
3. Push your branch.
4. Open a PR with:
   - clear title
   - summary of changes
   - test/check output
   - linked issue if relevant

## Coding standards

- TypeScript for all app code.
- Keep functions small.
- Avoid compatibility shims and dead abstractions.
- Prefer concrete repositories over generic database wrappers.
- Avoid unsafe casts unless there is no practical alternative.
- Let Drizzle schema/types guide DB code.
- Keep OpenAPI docs in sync with handlers.

## Commit messages

Use Conventional Commits:

```text
feat(auth): add password reset
fix(db): handle missing user update
refactor(api): simplify route definitions
test(app): add scalar docs smoke test
docs(readme): update setup guide
```

Common types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

## Bug reports and feature requests

Open an issue with:

- expected behavior
- actual behavior
- reproduction steps
- logs/screenshots if useful
- proposed solution if you have one
