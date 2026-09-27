# Accountant

Accountant is a mobile-first finance operations workspace for freelancers,
agencies, and small teams. The current app is built with Expo and React Native,
with Supabase Auth, Postgres RLS, private receipt storage, and server-side
financial workflows as the production target.

## Repository layout

- `artifacts/ledgerflow` — Expo mobile application
- `artifacts/api-server` — existing Express integration boundary
- `supabase/migrations` — versioned database schema and RLS policies
- `supabase/functions` — authenticated server-side workflows
- `supabase/tests` — RLS and security test contract
- `ARCHITECTURE.md` — system design and rollout plan
- `SECURITY.md` — threat model and security policy

## Local development

```bash
pnpm install
pnpm --filter @workspace/ledgerflow run typecheck
pnpm --filter @workspace/ledgerflow run dev
```

Without Supabase public configuration, the mobile app stays in its clearly
labeled local demo mode. To enable the production auth path, copy
`.env.example` into the environment used by the Expo workflow and provide the
public project URL and anon key. Never add service-role keys or database
passwords to the mobile app.

## Supabase rollout

1. Link the intended Supabase project with the approved deployment workflow.
2. Apply the migration in `supabase/migrations`.
3. Run the disposable-environment checks in `supabase/tests`.
4. Configure the Edge Function secrets in Supabase, not in source control.
5. Set the two `EXPO_PUBLIC_*` variables for the mobile build.

The migration is intentionally versioned and has not been silently applied to
any remote project by this repository.

## Status

The repository contains the secure authentication and organization bootstrap
foundation. Live query hooks, the remaining financial Edge Functions, and
cross-organization integration tests should be completed before production
launch.