# Dependency update plan

Generated 2026-08-04 from `bun outdated`. “Update” is the newest version allowed by the current semver range; “Latest” may require an intentional major-version migration.

| Package | Current | Safe update | Latest | Breaking-change assessment | Required action |
| --- | ---: | ---: | ---: | --- | --- |
| `@faker-js/faker` | 10.4.0 | 10.5.0 | 10.5.0 | No major change | Upgrade normally. |
| `@hono/oauth-providers` | 0.8.5 | 0.8.7 | 0.8.7 | Pre-1.0: minor releases may break APIs | Upgrade with Hono; run auth/OAuth smoke test. |
| `@hono/zod-openapi` | 1.4.0 | 1.5.1 | 1.5.1 | No major change | Upgrade with Hono; run typecheck and `/doc` integration test. |
| `@scalar/hono-api-reference` | 0.10.14 | 0.10.20 | 0.11.12 | **Potentially breaking:** pre-1.0 minor update | Review 0.11 changelog; verify `/scalar` renders and its options still typecheck. |
| `@types/nodemailer` | 8.0.0 | 8.0.1 | 8.0.1 | No major change | Upgrade normally. |
| `hono` | 4.12.18 | 4.13.0 | 4.13.0 | No major change | Upgrade with the Hono integrations; run all route/docs tests. |
| `ioredis` | 5.10.1 | 5.11.1 | 6.0.0 | **Breaking at 6:** Node.js 20+ required; default `maxRetriesPerRequest` changes from 20 to `null`; `retryStrategy` no longer stops retries based on its return value; `disconnect()` no longer emits `close`. | First upgrade to 5.11.1. Do not take 6.0.0 until runtime is Node 20+ and retry/disconnect behavior is reviewed. |
| `nodemailer` | 8.0.7 | 8.0.11 | 9.0.4 | **Breaking at 9:** review release notes and SMTP transport behavior before changing majors. | First upgrade to 8.0.11. Stage v9 separately with an actual email-delivery smoke test. |
| `pg` | 8.20.0 | 8.22.0 | 8.22.0 | No major change | Upgrade normally; run DB integration/migration checks. |
| `swagger-ui-dist` | 5.32.6 | 5.32.12 | 5.32.12 | No major change | Upgrade normally; open `/ui`. |
| `@biomejs/biome` (dev) | 2.4.15 | 2.4.15 | 2.5.7 | No major change, but new/changed lint rules can fail CI | Upgrade separately; run `bun run check`, then accept only intentional formatter/lint changes. |
| `@types/pg` (dev) | 8.20.0 | 8.20.4 | 8.20.4 | No major change | Upgrade with `pg`; run typecheck. |
| `tsx` (dev) | 4.21.0 | 4.23.5 | 4.23.5 | No major change | Upgrade normally; run scripts that invoke `tsx`, if any. |

## Recommended batches

| Batch | Packages | Risk | Verification |
| --- | --- | --- | --- |
| 1 — patch/minor | All “Safe update” versions | Low | `bunx tsc --noEmit && bun run check && bun test` |
| 2 — Biome | `@biomejs/biome@2.5.7` | Medium: CI/config output | `bun run check`; inspect and commit only intended code/config changes. |
| 3 — Scalar 0.11 | `@scalar/hono-api-reference@0.11.12` | Medium: pre-1.0 API | Typecheck, tests, manual `/scalar` check. |
| 4 — Redis 6 | `ioredis@6.0.0` | High: runtime/retry semantics | Confirm Node 20+, exercise Redis reconnect, queues, session/cache and auth flows. |
| 5 — Nodemailer 9 | `nodemailer@9.0.4` | High: transport behavior | Send mail through the configured SMTP provider in staging. |

## Sources

- [ioredis v5 → v6 migration](https://github.com/redis/ioredis/wiki/Upgrading-from-v5-to-v6)
- [ioredis v6 release](https://github.com/redis/ioredis/releases/tag/v6.0.0)
- [Nodemailer v9 release](https://github.com/nodemailer/nodemailer/releases/tag/v9.0.0)
- [Scalar Hono changelog](https://github.com/scalar/scalar/blob/main/integrations/hono/CHANGELOG.md)
- [Biome 2.5 changelog](https://biomejs.dev/internals/changelog/version/2-5-0/)
