import fs from 'node:fs';
import path from 'node:path';
const migration = fs.readFileSync('supabase/migrations/202609280001_security_foundation.sql', 'utf8');
const shared = fs.readFileSync('supabase/functions/_shared/security.ts', 'utf8');
for (const value of ['notifications', 'push_tokens', 'consume_rate_limit', 'ai_budgets', 'row level security']) if (!migration.toLowerCase().includes(value)) throw new Error(`Migration invariant missing: ${value}`);
for (const value of ['ALLOWED_ORIGIN', 'requireAal2', 'mfa_required', 'consume_rate_limit']) if (!shared.includes(value)) throw new Error(`Shared security invariant missing: ${value}`);
for (const name of ['mark-invoice-paid', 'post-ledger-entry', 'reverse-ledger-entry', 'request-export', 'change-member-role', 'invite-member', 'request-account-deletion']) {
  if (!fs.readFileSync(path.join('supabase/functions', name, 'index.ts'), 'utf8').includes('requireAal2')) throw new Error(`AAL2 enforcement missing: ${name}`);
}
console.log('Security invariant scan: PASS');
