# Milestone 1 — acceptance record

Traceability from the client's Definition of Done to the code and the checks that prove it.

| Client requirement | Where it lives | How it is verified |
| --- | --- | --- |
| Register with a phone number and verify OTP | `apps/api/src/auth/otp.service.ts`, `auth.service.ts`, `apps/web/src/app/(auth)/register` + `/verify` | `test/app.e2e-spec.ts` → “sends an OTP and verifies it”; Playwright “member can register…” |
| Under-18 users are blocked | `compliance.service.ts` (`AGE_RESTRICTED`), server-side age check on every DOB write | e2e “blocks under-18 registrations”; Playwright “under-18 visitors are blocked”; unit `age-gate.spec.ts` (18 today vs one day short, leap day, UTC) |
| User cannot proceed without accepting Terms | `complianceAcceptSchema` (`z.literal(true)`), `ComplianceGuard` | e2e “requires explicit acceptance of both legal documents”; Playwright compliance step |
| Acceptance stored with timestamp + version | `LegalAcceptance` model (`documentType`, `documentVersion`, `acceptedAt`, ip, userAgent) | e2e compliance response; admin member detail shows the history |
| Guided onboarding, progress, back, resume | `onboarding.controller.ts`, `onboarding.service.ts`, `apps/web/src/components/onboarding/wizard.tsx` | e2e “saves each onboarding step and resumes from the server”; unit `onboarding.sequence.spec.ts`; Playwright full flow |
| Full profile + edit | `profile.service.ts`, `apps/web/src/app/(member)/profile(/edit)` | e2e profile patch; Playwright edit + save |
| Individual privacy toggles | `ProfileFieldVisibility`, `profile.mapper.ts`, `profile.controller.ts` | unit `profile.mapper.spec.ts` (defaults, overrides, coordinates never leak, photos hidden); e2e “applies privacy defaults and explicit overrides” |
| Profile pause / unpause | `Profile.status`, `ProfileService.setPaused`, `publicView` | e2e “hides paused profiles…”; Playwright pause switch |
| Data model supports workplace privacy / geofencing | `Profile.workplace*`, generated `locationPoint geography(Point,4326)` + GiST index | migration SQL review; schema fields present |
| Separate admin login | `AdminUser`, `AdminSession`, `admin-auth.controller.ts`, `apps/web/src/app/admin/login` | e2e “signs both seeded roles in” |
| Roles by email, enforced on every admin route | `packages/shared/src/permissions.ts`, `PermissionsGuard` (fail-closed) | unit `access.spec.ts`; e2e Moderator 403 matrix; “changes a role by email and refuses to remove the last Super Admin” |
| Super Admin sees everything, Moderator sees a subset | `ADMIN_NAV` + `navFor()` | e2e admin matrix; Playwright “admin roles see different navigation” |
| Users list in the admin shell | `apps/web/src/app/admin/(dashboard)/users`, `users.service.ts` | e2e `GET /admin/users`; Playwright |
| Loading / empty / error states | `components/ui/feedback.tsx` used by every data screen | manual + Playwright assertions on empty/error copy |
| Seed data: 1 Super Admin, 1 Moderator, 3–5 members | `apps/api/scripts/seed.ts` | `pnpm db:seed` output; e2e admin login |
| Staging deployment + credentials + test script | `render.yaml`, `apps/web/vercel.json`, `apps/api/Dockerfile`, `docs/deployment.md`, `docs/client-test-instructions.md` | deploy checklist in `docs/deployment.md` (executed when account tokens are provided) |

## Verification run (Milestone 1 close-out)

Executed on the final commit against Neon PostgreSQL 16 + PostGIS 3.6.4:

| Check | Result |
| --- | --- |
| `pnpm typecheck` | ✅ 3 packages, no errors |
| `pnpm test` | ✅ 28/28 unit tests |
| `pnpm test:e2e` | ✅ 30/30 API flows against the live database |
| `pnpm test:web` | ✅ 4/4 Playwright browser flows |
| `pnpm build` (shared + api + web) | ✅ |
| `prisma migrate status` | ✅ 3 migrations applied |
| `SELECT postgis_full_version()` | ✅ PostGIS 3.6.4 |
| `profiles.locationPoint` | ✅ `geography(Point,4326)` + GiST index |
| `pnpm db:seed` (run twice) | ✅ idempotent — counts unchanged, 2 admins, 5 sample members, Atlanta + Charlotte |
| `/api/v1/health` | ✅ `{ status: "ok" }` |

### Blocks closed in this pass

- **Render blueprint could not boot.** `render.yaml` set `NODE_ENV=production` together with
  `OTP_ALLOW_DEBUG_CODE=true`, which the environment schema rejects at startup. Added an explicit
  `staging` environment: staging may use the debug OTP, `production` still refuses it at boot.
  Also added the missing `SAFETY_TIPS_VERSION` to the blueprint.
- **No request logging.** Added a one-line access log (`METHOD path status duration requestId`) so a
  client report can be matched to a server-side request id.

### Open blocker: public staging URLs

Frontend and backend deployment could not be completed from this environment because no
Render/Railway service credentials (and no Twilio credentials) are available here. The exact
blueprint, Dockerfile, Vercel config and post-deploy checklist are in `docs/deployment.md`; once the
service and Twilio credentials are supplied the deploy is a mechanical step. Until then the
client-facing test script in `docs/client-test-instructions.md` runs against the local stack.

## Verification commands

```bash
pnpm --filter @kodecupid/shared build
pnpm --filter api exec prisma generate
pnpm typecheck
pnpm test            # unit: privacy mapper, permission matrix, age gate, onboarding resume
pnpm test:e2e        # API flows (needs DATABASE_URL + seeded database)
pnpm test:web        # Playwright browser flows (needs both servers + browsers installed)
pnpm build           # production build of shared + api + web
```

## Deliberate Milestone 1 scope decisions

- **Admin queues are shells.** Verification, complaints, deletion requests, corrections, settings
  and monetization render permission-gated “Milestone 2” screens. The brief marks only the Users
  list as mandatory; the shells still exercise the permission guards end-to-end.
- **Swagger is replaced by `docs/api.md`.** Hand-written endpoint documentation was faster to keep
  accurate than decorating 30 handlers; the machine contract lives in `packages/shared` zod schemas.
- **No client data-fetching library.** The web app uses a small typed `apiFetch` helper plus React
  state instead of TanStack Query, to keep the Milestone 1 bundle and dependency surface small.
- **Invitations are link-based, not emailed.** Email delivery is not part of Milestone 1; a Super
  Admin copies the one-time invite link from the UI.
- **Legal text is placeholder but versioned.** Replacing it with counsel-approved text is a
  configuration change (`TERMS_VERSION` etc.) that forces re-acceptance by design.
