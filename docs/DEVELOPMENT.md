# Development guide

## Prerequisites

- Node.js compatible with the installed Expo SDK 57 toolchain
- npm
- Supabase CLI for database and Edge Function work
- A development build for native notification and SecureStore testing

## Install and run

```bash
npm install
cp .env.example .env
npm run start
```

The `.env` file must contain only the public Supabase URL and anon key for the mobile client. Never add a service-role key, AI Gateway key, or push provider secret to the mobile environment.

## Quality checks

```bash
npm run validate
npm run build:web
npm audit --omit=dev
```

`npm run validate` runs TypeScript, Expo Doctor, Edge Function syntax checks, migration invariants, and whitespace validation. `npm run build:web` exports the static web build into the ignored `dist/` directory.

## Supabase workflow

```bash
supabase start
supabase db reset
supabase functions serve
```

Apply migrations only through the versioned files in `supabase/migrations/`. Configure function secrets in Supabase, not in Git:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN` for the deployed web origin
- Vercel AI Gateway credentials required by `jev-chat`

Run `supabase/tests/rls_security.sql` against a seeded test database. Verify owner, manager, accountant, staff, viewer, non-member, unauthenticated, and cross-organization cases.

## Native notifications

Push permission is requested only on a real device after verified authentication and an active organization membership. Web builds show the in-app notification center but do not request native push permissions. A development build is required to exercise native notification behavior.

## Release checklist

- `npm run validate` passes
- `npm audit --omit=dev` reports zero vulnerabilities
- Supabase migrations are applied in staging
- Email confirmation and MFA policies are enabled
- RLS tests pass against two organizations
- `ALLOWED_ORIGIN` matches the actual web origin
- No `.env`, private key, service-role key, or generated `dist/` artifact is committed
