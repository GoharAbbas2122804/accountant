# LedgerFlow Executive Security

## Scope

This document covers the mobile client, Supabase Auth, Postgres/RLS, Edge Functions, private receipt storage, exports, invitations, financial state changes, and auditability.

## Threat model

### Assets

- Authentication sessions, refresh tokens, MFA factors, and verified email state
- Organization membership, roles, client data, invoices, payments, expenses, and journal entries
- Receipt files and signed upload/download URLs
- Audit logs, export jobs, deletion requests, and request metadata
- Service-role credentials and deployment secrets

### Threat actors

- Unauthenticated internet users attempting account enumeration or credential abuse
- An authenticated user attempting to change `organization_id`, role, payment state, or ledger state in a mobile request
- A valid member attempting cross-organization reads or writes
- A compromised client device or replayed network request
- A malicious or buggy privileged workflow
- An insider with access to deployment or database credentials

### Trust boundaries

1. The React Native client is untrusted. It may send malformed, replayed, or modified organization and role fields.
2. Supabase Auth is the identity boundary. Email verification and the JWT establish identity, not tenant authorization.
3. Postgres RLS is the tenant boundary. Every exposed table checks active membership from `organization_members`.
4. Edge Functions are the privileged workflow boundary. They validate JWTs, roles, rate limits, idempotency keys, and state transitions before service-role operations.
5. Storage is private. Receipt paths are organization/user scoped and signed URLs are short-lived.

## Role matrix

| Capability | Owner | Manager | Accountant | Staff | Viewer |
|---|---:|---:|---:|---:|---:|
| Read dashboard | Yes | Yes | Yes | Yes | Yes |
| Submit receipts/expenses | Yes | Yes | Yes | Yes | No |
| Edit operational financial records | Yes | Yes | Limited | No | No |
| Confirm invoice payments | Yes | Yes | No | No | No |
| Post/reverse ledger entries | Yes | No | Yes | No | No |
| Export reports | Yes | Yes | Yes | No | No |
| Manage team roles | Yes | No | No | No | No |
| Billing/ownership/org deletion | Yes | No | No | No | No |

The database is the source of truth for membership. The client never gets to choose an authoritative organization or role.

## Authentication controls

- Supabase Auth is configured in `lib/supabase.ts` with `autoRefreshToken`, `persistSession`, and PKCE.
- Native session credentials use Expo SecureStore with device-only keychain accessibility; financial credentials are never stored in AsyncStorage.
- The auth UI uses generic failure language and password-reset language so it does not reveal whether an email exists.
- Email verification is required by Edge Function JWT validation (`email_confirmed_at`). Enable **Confirm email** in Supabase Auth settings before staging.
- MFA is architected through Supabase TOTP enrollment, challenge, verification, and assurance-level APIs. Enforce AAL2 for owner/accountant routes in production before high-risk operations.
- Sign-out clears the Supabase session and membership cache. Account deletion is a reviewable request, not an immediate destructive action.

## Authorization and financial integrity

- `organization_members` is the only role source of truth.
- RLS is enabled on every application table and `storage.objects`.
- No authenticated policy exists for payments, idempotency keys, rate-limit events, export jobs, or journal posting.
- Only Edge Functions can confirm payments, create payment records, post/reverse journals, issue export jobs, change roles, and invite users.
- Invoice payment, ledger posting, and reversal use atomic `SECURITY DEFINER` SQL workflows callable only by `service_role`.
- Invoice and journal state transitions are enforced by database triggers and status checks.
- Invoices, expenses, and journal entries carry optimistic-lock `version` values.
- Mutating privileged actions require idempotency keys. Replays return the original response.
- Audit logs are append-only and immutable. Values are redacted for keys containing `password`, `token`, `secret`, `authorization`, or `receipt_path`.

## File security

- Bucket: `private-receipts`, `public = false`.
- Allowed MIME types: JPEG, PNG, WebP, PDF.
- Maximum size: 10 MiB at bucket level; enforce the same or lower limit at the client/upload gateway.
- Paths are generated server-side as `<organization_id>/<user_id>/<random-name>.<extension>`.
- The upload Edge Function validates MIME and extension and returns a short-lived signed upload URL.
- Never expose a public receipt URL. Generate signed download URLs only after an active membership check.
- For production, add malware scanning and content sniffing before marking an expense approved.

## Rate limits

The shared Edge Function helper records per-user events and rejects bursts. Current defaults:

- Sign-in, password reset, invitation acceptance: configure Supabase Auth rate limits; invite flow is additionally limited to 10/minute.
- Receipt upload URL: 10/minute.
- Invoice payment confirmation: 30/minute.
- Ledger post: 20/minute.
- Ledger reverse: 10/minute.
- Report export: 5/minute.
- Account deletion request: 2/minute.

For multi-region production, move rate-limit counters to a dedicated atomic Redis/Edge counter or a Postgres function using row/advisory locks.

## Secrets policy

Never commit:

- `SUPABASE_SERVICE_ROLE_KEY`
- database passwords
- JWT secrets
- SMTP/provider credentials
- Expo signing credentials
- webhook signing secrets

Mobile builds may include only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; the anon key is not a secret, but it must always be constrained by RLS. Edge Functions receive service credentials from Supabase project secrets, never from the mobile app.

## Environment variables

Create a local `.env` from `.env.example`. Use separate Supabase projects for local, staging, and production. Do not point a development build at production data.

## Backup and recovery plan

- Enable Supabase daily backups and point-in-time recovery for staging/production.
- Test a restore quarterly into an isolated project.
- Keep migrations in Git and apply them through CI or a reviewed deployment pipeline.
- Verify receipt storage backups separately from Postgres backups.
- Preserve audit logs during restore and record the restore request ID and operator.

## Incident response outline

1. Revoke exposed service keys and rotate Supabase secrets.
2. Disable affected Edge Functions or force a maintenance mode.
3. Preserve audit logs, request IDs, Auth logs, and storage access logs.
4. Identify affected organizations and users; do not broadcast unverified scope.
5. Patch the migration/function and add a regression test before re-enabling.
6. Restore or replay from backups only after confirming data integrity.
7. Notify affected customers according to contractual and legal requirements.

## Dependency update policy

- Run `npm audit` and `npm outdated` weekly.
- Pin or lock production dependencies through `package-lock.json`.
- Review Supabase JS, Expo, SecureStore, and Edge Runtime release notes before upgrades.
- Apply security patches promptly; test native auth, refresh, MFA, and file upload paths after updates.

## Security testing checklist

### Mobile / OWASP MASVS-oriented

- [ ] No tokens or passwords in AsyncStorage, logs, screenshots, or analytics.
- [ ] Session restore, sign-out, refresh-token rotation, and revoked-session behavior tested.
- [ ] Deep links cannot bypass email verification or role checks.
- [ ] Sensitive screens use large touch targets and do not expose secrets in accessibility labels.
- [ ] Root/jailbreak, screenshot, and clipboard policies reviewed for the production threat model.

### API / OWASP API Security-oriented

- [ ] Every function rejects missing, invalid, expired, and unverified JWTs.
- [ ] Every request validates with Zod and rejects unknown state transitions.
- [ ] Every organization ID is checked against active membership server-side.
- [ ] Cross-organization SELECT/INSERT/UPDATE/DELETE tests pass.
- [ ] Privileged functions have no client-facing service key.
- [ ] Rate-limit and idempotency tests cover replay, burst, and race behavior.
- [ ] Audit rows are immutable and redact sensitive fields.
- [ ] Signed URLs expire quickly and cannot cross organization paths.
- [ ] Export and AI endpoints are rate-limited and never log raw financial payloads.

## Verification guide

```bash
npm install
npx tsc --noEmit
npx expo export --platform web

# With Supabase CLI installed and a local project running:
supabase db reset
supabase test db --file supabase/tests/rls_security.sql
supabase functions serve mark-invoice-paid --env-file .env.local
```

Before staging, configure Auth email verification, MFA policy, project secrets, private storage, backup/PITR, and a seeded two-organization RLS test fixture. The repository intentionally does not contain production Supabase credentials.
