# Project structure

LedgerFlow is an Expo Router mobile application with a Supabase backend boundary. The repository keeps route code, reusable UI, domain state, integrations, and database security separate.

## Directories

| Path | Responsibility |
| --- | --- |
| `app/` | Expo Router screens, layouts, and platform route files. Only route modules belong here. |
| `components/` | Reusable visual primitives and design-system components. |
| `context/` | Cross-screen state providers for demo data and authentication. |
| `data/` | Seeded demo fixtures used by the local/offline MVP. |
| `lib/` | Cross-cutting clients and authorization rules, including Supabase and role gates. |
| `services/` | Side-effect boundaries: persistence, privileged function calls, Jev streaming, and notifications. |
| `theme/` | Executive Night tokens, colors, spacing, typography, and money formatting. |
| `types/` | Shared TypeScript domain models. |
| `assets/` | App icons, splash art, and fonts referenced by `app.json`. |
| `supabase/migrations/` | Versioned database schema, RLS, storage, audit, and security functions. |
| `supabase/functions/` | JWT-protected Edge Functions. Shared server helpers live in `_shared/`. |
| `supabase/tests/` | pgTAP/RLS tests and Jev evaluation cases. |
| `docs/` | Developer-facing architecture, setup, and operational notes. |

## Runtime boundaries

- UI calls `context`, `lib`, and `services`; screens do not call Supabase tables directly except through the established service boundary.
- Mobile sessions are persisted through `lib/supabase.ts` and Expo SecureStore. AsyncStorage is reserved for local demo state.
- Financial mutations, exports, role changes, invitations, and account deletion requests go through Edge Functions.
- Edge Functions derive the user from the JWT and the organization from active membership. Client-provided role claims are never trusted.
- Receipts remain private storage objects and are accessed through short-lived signed URLs.

## Adding code

1. Add a route under `app/` only when it represents a navigable screen.
2. Put reusable layout or interaction code in `components/`.
3. Put external effects in `services/` and keep them typed.
4. Add schema and RLS changes as a new timestamped migration; do not edit deployed history casually.
5. Add or update security tests for every new exposed table or privileged operation.
6. Run `npm run validate` before committing.
