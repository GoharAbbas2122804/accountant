# LedgerFlow

LedgerFlow is a polished Expo + React Native + TypeScript MVP for small service businesses. It helps owners understand money in, money out, collections, upcoming bills, and project profitability without forcing accounting jargon into the primary flow.

## Included MVP flows

- Home dashboard with balance, cash-flow chart, priorities, quick actions, and rule-based insights
- Transactions with search, filters, seeded data, and add income/expense flow
- Review-before-save confirmation for data entry
- Invoice list with Draft / Sent / Paid / Overdue filters
- Create invoice flow and mark-as-paid action that creates an income transaction automatically
- Mock receipt scanner with inferred fields and a Needs Review status
- More hub with expenses, clients/projects, reports, finance assistant, settings, accountant access, audit history, and demo reset UI
- Three-step onboarding for business type, currency, and product positioning
- AsyncStorage persistence for transactions, invoices, and demo reset

## Run locally

```bash
npm install
npm run start
```

For a browser preview:

```bash
npm run web
```

## Architecture

- `app/` — Expo Router screens and tab navigation
- `components/ui.tsx` — reusable cards, buttons, fields, metric cards, and status pills
- `context/AppContext.tsx` — local state and persistence orchestration
- `data/demo.ts` — Northstar Studio demo data
- `services/storage.ts` — AsyncStorage-backed repository boundary
- `types/index.ts` — type-safe domain models
- `theme/index.ts` — palette, radii, spacing, money formatting

The storage boundary is intentionally replaceable with Supabase repositories. The domain model covers profiles, organizations, members, clients, projects, invoices, invoice items, payments, expenses, accounts, journal entries, journal lines, and audit logs as the product evolves toward double-entry accounting and Postgres RLS.

## Trust boundaries

Bank connections, receipt OCR, exports, payments, email/WhatsApp sending, AI assistance, authentication, and Supabase sync are clearly represented as mock or UI-ready in this MVP. No mock data is presented as a bank connection and the assistant does not provide tax, legal, or investment advice.
