# Hono Starter Code

REST API starter built with Hono, PostgreSQL, Drizzle ORM, Redis, and Bun.

## Features

- Hono HTTP API
- JWT authentication
- Google OAuth2 login
- Email OTP verification
- PostgreSQL database
- Drizzle ORM migrations and queries
- Redis cache/session support
- Docker Compose development environment
- OpenAPI docs and Swagger UI

## Requirements

- Bun 1.0+
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

## Development

Start the app with PostgreSQL and Redis:

```bash
docker compose build
docker compose up
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

## API docs

When the app is running:

- OpenAPI JSON: http://localhost:3000/doc
- Swagger UI: http://localhost:3000/ui

## Project structure

```text
drizzle/             Drizzle migrations
src/
  config/            configuration
  controllers/       request handlers
  middleware/        middleware
  models/            database models
  routes/            route definitions and OpenAPI docs
  services/          business logic
  types/             shared types and repository abstractions
  utils/             utilities
  validation/        request schemas
  index.ts           app entry point
  worker.ts          worker entry point
.env.example         environment example
compose.yml          Docker Compose config
Dockerfile           container build
 drizzle.config.ts   Drizzle config
package.json         scripts and dependencies
```
