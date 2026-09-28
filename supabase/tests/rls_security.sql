-- Run in a seeded Supabase test database with pgTAP enabled.
-- The harness supplies :user_a, :user_b, :org_a, :org_b, :invoice_b, and :expense_b as UUIDs.

begin;
select plan(18);

select ok((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass), 'organizations has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.invoices'::regclass), 'invoices has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.expenses'::regclass), 'expenses has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit logs has RLS');
select ok((select relrowsecurity from pg_class where oid = 'storage.objects'::regclass), 'storage objects has RLS');

select has_policy('public', 'organizations', 'organizations_select', 'organization membership select policy exists');
select has_policy('public', 'organization_members', 'members_update', 'owner-only member update policy exists');
select has_policy('public', 'invoices', 'invoices_update', 'invoice update policy exists');
select has_policy('public', 'expenses', 'expenses_insert', 'expense submit policy exists');
select has_policy('public', 'audit_logs', 'audit_logs_select', 'audit log read policy exists');

-- Unauthenticated sessions cannot read tenant data.
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select is((select count(*)::integer from public.invoices), 0, 'anonymous cannot read invoices');
select is((select count(*)::integer from public.expenses), 0, 'anonymous cannot read expenses');

-- User A is active only in org A; org B data must be invisible.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', :'user_a', true);
select is((select count(*)::integer from public.clients where organization_id = :'org_b'), 0, 'member cannot read another organization clients');
select is((select count(*)::integer from public.invoices where organization_id = :'org_b'), 0, 'member cannot read another organization invoices');
select is((select count(*)::integer from public.expenses where organization_id = :'org_b'), 0, 'member cannot read another organization expenses');

-- Cross-organization writes are explicitly denied even when the payload supplies org B.
select throws_ok(format('insert into public.clients(organization_id, name) values (%L, %L)', :'org_b', 'cross-org'), '.*', 'member cannot insert into another organization');
select throws_ok(format('update public.invoices set notes = %L where id = %L', 'cross-org attempt', :'invoice_b'), '.*', 'member cannot update another organization invoice');
select throws_ok(format('delete from public.expenses where id = %L', :'expense_b'), '.*', 'member cannot delete another organization expense');

select * from finish();
rollback;
