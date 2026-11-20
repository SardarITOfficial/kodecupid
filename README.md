# KodeCupid

Dating platform for shift workers — **Milestone 1** foundation: phone-OTP registration, 18+ age gate,
mandatory legal acceptance, guided onboarding, a full profile with per-field privacy, and a
role-based admin area (Super Admin + Moderator).

| Package | Purpose | Stack |
| --- | --- | --- |
| [`apps/web`](./apps/web) | Member + admin frontend | Next.js 15.5 (App Router), React 19, Tailwind 4 |
| [`apps/api`](./apps/api) | REST API | NestJS 12, Prisma 7, PostgreSQL 16 + PostGIS |
| [`packages/shared`](./packages/shared) | Shared types, enums, zod schemas, permission matrix | TypeScript |

## Quick start

```bash
pnpm install
cp .env.example .env                 # database credentials for docker compose
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

docker compose up -d                 # PostgreSQL 16 + PostGIS
pnpm db:generate
pnpm db:deploy                       # apply migrations
pnpm db:seed                         # super admin, moderator, 5 sample members
pnpm dev                             # web on :3000, api on :4000
```

Full setup, troubleshooting, deployment and the client test script live in [`docs/`](./docs).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Build shared package, then run web + api in parallel |
| `pnpm build` | Production build for all packages |
| `pnpm typecheck` / `pnpm lint` | Static checks across the monorepo |
| `pnpm test` | Unit tests (API + shared) |
| `pnpm test:e2e` | API end-to-end tests (needs `DATABASE_URL`) |
| `pnpm test:web` | Playwright browser tests |
| `pnpm db:migrate:new` | Generate a new SQL migration from the Prisma schema |
| `pnpm db:deploy` | Apply pending migrations (safe for staging/production) |
| `pnpm db:seed` | Idempotent seed of admin accounts and sample members |
| `pnpm db:studio` | Prisma Studio |

## Milestone 1 scope

In scope: registration → age gate + legal acceptance → guided onboarding → profile with privacy toggles
and pause → admin roles with enforced permissions → seed data → handover docs and deploy configuration.

Out of scope (later milestones): matching/discovery, messaging, payments, provider verification review,
admin 2FA, i18n, native apps, and production document moderation.
