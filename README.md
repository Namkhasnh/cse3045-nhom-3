# Hoa Lac Food Ordering Platform

Food discovery and ordering for VJU. V1.0 targets public browsing, ordinary-user accounts with optional management of one restaurant, a single MFA-protected Admin, fixed surveyed pickup points, cash and QR paid directly to restaurants, restaurant delivery, manual commission reconciliation and controlled AI suggestions.

Use [short requests](docs/prompts/quick-start.md) such as “Run P04”, “continue” or a scoped UI fix; repository instructions supply routine context. Start with the [documentation map](docs/README.md), [commercial roadmap](docs/roadmap.md) and [full P01–P36 prompts](docs/prompts/README.md). [Requirements](docs/requirements.md) govern behavior; [AGENTS.md](AGENTS.md) routes contributor work. Technical documents and prompts are English; product UI copy is Vietnamese.

## Current implementation

This repository is not a completed commercial platform. Ordinary auth/profile/email, buyer-manager capabilities, sole Admin MFA/recovery and connected public discovery exist; preview fixtures remain labeled. Onboarding and later commercial workflows remain target work. **V0.1 is accepted**, October 19, 2026, under the [recorded criterion-by-criterion self-review](docs/progress/V0.1.md). Later milestones remain unaccepted. See [current source and evidence](docs/implementation-status.md); it separates clean-lockfile local verification, retained Admin observations and unobserved remote CI.

The documentation rewrite changes no application code, migrations, accounts or data. Old role requests are not opening applications and do not establish partnership consent. No V0.x or V1.0 completion is claimed.

## Local setup

Use Node.js 24 and the separate npm lockfiles; exact deployment patches are DEC-10. Target database: Oracle MySQL Community Server **9.2.0**, InnoDB. Preserve the MariaDB-named Prisma adapter and custom config. Inspect existing settings before setup; never overwrite a configured `.env` or expose secrets.

```sh
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run prisma:validate
npm --prefix backend run db:check
npm --prefix backend run dev
# In another terminal:
npm --prefix frontend run dev
```

Configure backend-only DATABASE_URL, JWT/CSRF, PUBLIC_ORIGIN and SMTP names from backend/.env.example and the [development guide](docs/development_guide.md). Registration needs SMTP to send verification codes. Vite proxies /api to port 3000; use the browser origin matching PUBLIC_ORIGIN. Production uses same-origin HTTPS; local behavior does not prove secure deployment.

Current `/login`, `/register`, `/verify-email` and `/account` belong to legacy auth. Development-only `/preview` shows fixtures without backend access; it is not public production discovery. [Frontend guide](frontend/README.md) explains the boundary.

## Verification and next work

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run build
```

Inspect scripts before running integration/browser/database checks and use disposable test targets. HTTP E2E mocks do not prove MySQL constraints; SELECT 1 proves connectivity only. Follow [testing](docs/testing.md), [backlog](BACKLOG.md) and the next unaccepted prompt. Apply reviewed forward migrations only in an authorized implementation task; never reset retained data or rewrite applied SQL.

V1.0 launch requires verified real MySQL 9.2.0/browser/mobile/accessibility/security/restore/partner/operations evidence and explicit release approval under the [launch checklist](docs/release-checklist.md). Finishing documentation or executing all prompts is insufficient.
