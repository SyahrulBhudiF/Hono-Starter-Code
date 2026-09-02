# Hono Starter Code

REST API starter built with Hono 4, Bun, PostgreSQL, Drizzle ORM, Redis, Zod OpenAPI, and Scalar API Reference.

## Features

- Hono 4 HTTP API
- Bun runtime, Vitest test runner
- JWT authentication
- Google OAuth2 login
- Email OTP verification with Bull + Redis
- PostgreSQL database
- Drizzle ORM schema, migrations, and concrete repositories
- Redis cache/session support
- Zod v4 request validation and a validated environment schema
- OpenAPI 3.1 docs
- Scalar API Reference
- Rate limiting, OTP attempt limiting, and JWT blacklisting by token id
- Soft deletes, request body limits, and signal-driven shutdown that closes the
  database pool, Redis, and the Bull queue
- Docker Compose development environment and a production image target
- Biome lint/format/check
- Unit and integration tests

## Requirements

- Bun 1.3+
- Docker
- Docker Compose

## Setup

```bash
git clone https://github.com/SyahrulBhudiF/Hono-Starter-Code
cd Hono-Starter-Code
bun install
cp .env.example .env
```

Edit `.env` before running the app.

For local non-Docker development, use local service hosts:

```env
DATABASE_URL=postgresql://user123:user123@localhost:5432/hono_starter
REDIS_HOST=localhost
REDIS_PORT=6379
```

For Docker Compose, use service hosts:

```env
DATABASE_URL=postgresql://user123:user123@db:5432/hono_starter
REDIS_HOST=redis
REDIS_PORT=6379
```

## Development

Start all services with Docker Compose:

```bash
docker compose up --build
```

Run app directly with hot reload:

```bash
bun run dev
```

Run worker:

```bash
bun run worker
```

## Database

Generate and run migrations:

```bash
bun run migrate
```

Seed database:

```bash
bun run seed
```

## Tests

```bash
bun run test
bun run coverage
```

Tests use Vitest and live in `tests/`. Integration tests use `app.request()` and do not
require a running server. `tests/setup-env.ts` provides the environment every test needs.

## Code quality

```bash
bun run lint
bun run format
bun run check
```

Auto-fix:

```bash
bun run lint:fix
bun run format:fix
bun run check:fix
```

Type check:

```bash
bun run typecheck
```

## API docs

When the app is running:

- OpenAPI JSON: http://localhost:3000/doc
- Scalar API Reference: http://localhost:3000/scalar
- Health check: http://localhost:3000/health

## Project structure

```text
drizzle/             Drizzle migrations
src/
  app.ts             Hono app factory, docs and health routes
  index.ts           app entry point
  config/            env, database, redis, queue, mail, logging config
  controller/        request handlers
  middleware/        Hono middleware
  model/             request/response models and mappers
  repository/        concrete Drizzle repositories
  route/             route definitions and OpenAPI schemas
  service/           business logic
  types/             shared enums and types
  util/              utilities
  validation/        Zod request schemas
  worker.ts          worker entry point
tests/               Vitest unit and integration tests
docker/init-db.sql   PostgreSQL extension bootstrap
.env.example         environment example
compose.yaml         Docker Compose config
Dockerfile           multi-stage container build
drizzle.config.ts    Drizzle config
package.json         scripts and dependencies
```

## Environment

`src/config/env.ts` validates every variable at startup and the process refuses to boot
on an invalid value. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be at least 32
characters:

```bash
openssl rand -hex 32
```

## Production image

```bash
docker build -t hono-starter .
docker run --env-file .env -p 3000:3000 hono-starter
```

The runtime stage runs as the non-root `bun` user and starts `bun run start`.
