# LedgerFlow Executive

LedgerFlow Executive is a premium Expo + React Native + TypeScript finance operating system for agencies, software houses, consultants, and growing companies.

The current MVP uses **Executive Night** as the default theme: dark executive surfaces, controlled gradients, high-contrast financial semantics, tabular money figures, and a five-second hierarchy for business health. `theme/index.ts` also includes the complete **Ledger Light** token set for the next theme-toggle pass.

## Current product surfaces

- **Executive Home** — available cash, revenue, expenses, receivables, payables, decisions, cash-flow chart, and quick actions
- **Financial Command Center** — P&L, cash position, accounts receivable, accounts payable, assets, liabilities, and owner’s equity
- **Transactions** — search, filters, status/review states, and fast add income/expense flow
- **Invoice Collections** — lifecycle filters, amount to collect, create invoice, and mark paid with automatic income creation
- **Projects & Clients** — received, outstanding, profitability margins, and at-a-glance client health
- **Jev AI** — deterministic decision-support prompts with evidence cards and an explicit non-advice disclaimer
- **Workspace** — profile, accountant access, audit history, demo reset, expenses, reports, and project entry points
- **Onboarding** — business type, currency, and workspace setup

## Run locally

```bash
npm install
npm run start
```

For a browser build:

```bash
npm run web
```

## Validation

```bash
npx tsc --noEmit
npx expo export --platform web
```

Both commands pass in the current repository state.

## Architecture

- `app/` — Expo Router screens and navigation
- `components/ui.tsx` — typed design-system primitives: AppCard, ScreenHeader, MetricCard, GradientInsightCard, CashFlowSparkline, StatusPill, MoneyText, SecurityBadge, OfflineBanner, EmptyState, SkeletonLoader, ErrorState, and QuickActionButton
- `context/AppContext.tsx` — local state and persistence orchestration
- `data/demo.ts` — Northstar Studio demo data
- `services/storage.ts` — AsyncStorage-backed repository boundary
- `types/index.ts` — type-safe domain models
- `theme/index.ts` — Executive Night and Ledger Light palettes, gradients, spacing, typography, shadows, radii, and locale-aware money formatting

The repository boundary is deliberately replaceable with Supabase repositories. The domain model is organized to evolve toward profiles, organizations, members, clients, projects, invoices, invoice items, payments, expenses, accounts, journal entries, journal lines, storage attachments, audit logs, notifications, and Postgres RLS.

## Trust boundaries

Bank connections, receipt OCR, exports, payments, email/WhatsApp sending, AI assistance, authentication, and Supabase sync are clearly represented as mock or UI-ready in this MVP. No mock data is presented as a bank connection and Jev AI does not provide tax, legal, or investment advice.

## Secure backend foundation

The repository now includes a Supabase security foundation under `supabase/`: tenant tables, active-membership RLS, private receipts, immutable audit/security events, atomic invoice-payment and ledger workflows, rate-limited Edge Functions, idempotency keys, and SQL cross-organization tests. Native mobile auth is in `context/AuthContext.tsx` and uses Expo SecureStore through `lib/supabase.ts`; it does not persist credentials in AsyncStorage.

Copy `.env.example` to `.env` with a Supabase URL and anon key for a configured build. Apply the migration with the Supabase CLI, seed two organizations and all five roles, then run `supabase/tests/rls_security.sql`. Read [SECURITY.md](SECURITY.md) before staging; production secrets, backups, email confirmation, MFA enforcement, and malware scanning remain project-level deployment settings.

## Jev AI

Jev AI is a read-only financial decision-support layer. Its `jev-chat` Edge Function uses Vercel AI Gateway and the server-side AI SDK with streaming, allowlisted Zod tools, model fallbacks, per-user rate limits, per-organization budgets, usage logging, immutable audit events, and evidence-backed decision cards. It cannot post transactions, send payments, alter records, submit taxes, or invoke export/membership workflows.

## Organized repository

The repository structure and local/staging workflow are documented in:

- [Project structure](docs/PROJECT_STRUCTURE.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Security guide](SECURITY.md)

Expo starter-only screens and theme helpers have been removed. The app now uses the LedgerFlow design system from `theme/`, typed primitives from `components/ui.tsx`, and the route set defined in `app/`.

### Common commands

```bash
npm run start       # start Expo
npm run typecheck   # TypeScript validation
npm run doctor      # Expo compatibility checks
npm run build:web   # static web export to ignored dist/
npm run audit      # production dependency audit
npm run validate    # typecheck, doctor, Edge checks, security checks
```
