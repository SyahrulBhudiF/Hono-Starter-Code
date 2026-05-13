# Hono Starter Code

REST API starter built with Hono 4, Bun, PostgreSQL, Drizzle ORM, Redis, Zod OpenAPI, Swagger UI, and Scalar API Reference.

## Features

- Hono 4 HTTP API
- Bun runtime and test runner
- JWT authentication
- Google OAuth2 login
- Email OTP verification with Bull + Redis
- PostgreSQL database
- Drizzle ORM schema, migrations, and concrete repositories
- Redis cache/session support
- Zod v4 request validation
- OpenAPI 3.1 docs
- Swagger UI and Scalar API Reference
- Docker Compose development environment
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
bun test
bun run test:unit
bun run test:integration
```

Integration tests use `app.request()` and do not require a running server.

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
bunx tsc --noEmit
```

## API docs

When the app is running:

- OpenAPI JSON: http://localhost:3000/doc
- Swagger UI: http://localhost:3000/ui
- Scalar API Reference: http://localhost:3000/scalar

## Project structure

```text
drizzle/             Drizzle migrations
src/
  app.ts             Hono app factory and docs routes
  index.ts           app entry point
  config/            database, redis, queue, mail, logging config
  controller/        request handlers
  middleware/        Hono middleware
  model/             request/response models and mappers
  repository/        concrete Drizzle repositories
  route/             route definitions and OpenAPI schemas
  service/           business logic
  types/             shared types and deprecated migration references
  util/              utilities
  validation/        Zod request schemas
  worker.ts          worker entry point
test/
  integration/       app.request() tests
  unit/              unit tests
.env.example         environment example
compose.yaml         Docker Compose config
Dockerfile           container build
drizzle.config.ts    Drizzle config
package.json         scripts and dependencies
```
