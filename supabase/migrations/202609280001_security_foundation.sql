-- LedgerFlow Executive security foundation
-- Apply with Supabase CLI: supabase db push

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.member_role as enum ('owner', 'manager', 'accountant', 'staff', 'viewer');
create type public.member_status as enum ('invited', 'active', 'disabled');
create type public.invoice_status as enum ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void');
create type public.expense_status as enum ('draft', 'needs_review', 'approved', 'posted');
create type public.entry_status as enum ('draft', 'posted', 'reversed');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'completed');

create or replace function public.set_updated_at() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 160),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https?://'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  base_currency text not null default 'PKR' check (base_currency in ('PKR','USD','GBP','EUR')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  status public.member_status not null default 'invited',
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, user_id)
);

create or replace function public.is_org_member(p_org_id uuid, p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members m where m.organization_id = p_org_id and m.user_id = p_user_id and m.status = 'active');
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles public.member_role[], p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members m where m.organization_id = p_org_id and m.user_id = p_user_id and m.status = 'active' and m.role = any(p_roles));
$$;

create or replace function public.create_organization(p_name text, p_currency text default 'PKR') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_currency not in ('PKR','USD','GBP','EUR') then raise exception 'unsupported currency'; end if;
  insert into public.organizations(name, base_currency) values (p_name, p_currency) returning id into v_org_id;
  insert into public.organization_members(organization_id, user_id, role, status, invited_by, joined_at) values (v_org_id, auth.uid(), 'owner', 'active', auth.uid(), timezone('utc', now()));
  return v_org_id;
end; $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160), email citext, phone text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, name text not null check (char_length(name) between 1 and 160), budget_amount numeric(14,2) not null default 0 check (budget_amount >= 0), status text not null default 'active' check (status in ('active','paused','completed','archived')), created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, project_id uuid references public.projects(id) on delete set null,
  status public.invoice_status not null default 'draft', issue_date date not null default current_date, due_date date not null, total_amount numeric(14,2) not null check (total_amount >= 0), balance_due numeric(14,2) not null check (balance_due >= 0 and balance_due <= total_amount), notes text, version integer not null default 1 check (version > 0), created_by uuid not null references auth.users(id), created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade, description text not null check (char_length(description) between 1 and 500), quantity numeric(12,2) not null check (quantity > 0), unit_price numeric(14,2) not null check (unit_price >= 0), tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100), discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0), created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, invoice_id uuid not null references public.invoices(id) on delete restrict, amount numeric(14,2) not null check (amount > 0), paid_at timestamptz not null default timezone('utc', now()), payment_method text not null check (payment_method in ('cash','bank','card','wallet','other')), idempotency_key text not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default timezone('utc', now()), unique (organization_id, idempotency_key)
);
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, project_id uuid references public.projects(id) on delete set null, submitted_by uuid not null references auth.users(id), category text not null, amount numeric(14,2) not null check (amount > 0), status public.expense_status not null default 'draft', receipt_path text, version integer not null default 1 check (version > 0), notes text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, code text not null, name text not null, type text not null check (type in ('asset','liability','equity','income','expense')), created_at timestamptz not null default timezone('utc', now()), unique (organization_id, code)
);
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, source_type text not null, source_id uuid, entry_date date not null default current_date, status public.entry_status not null default 'draft', version integer not null default 1, created_by uuid not null references auth.users(id), created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(), journal_entry_id uuid not null references public.journal_entries(id) on delete cascade, account_id uuid not null references public.accounts(id) on delete restrict, debit_amount numeric(14,2) not null default 0 check (debit_amount >= 0), credit_amount numeric(14,2) not null default 0 check (credit_amount >= 0), check ((debit_amount = 0 and credit_amount > 0) or (credit_amount = 0 and debit_amount > 0))
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, actor_user_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, before_data jsonb, after_data jsonb, request_id uuid not null, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, actor_user_id uuid not null references auth.users(id), operation text not null, key text not null, response jsonb, created_at timestamptz not null default timezone('utc', now()), expires_at timestamptz not null default timezone('utc', now()) + interval '24 hours', unique (organization_id, operation, key)
);
create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id), operation text not null, bucket text not null, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, reason text check (reason is null or char_length(reason) <= 1000), status public.request_status not null default 'pending', requested_at timestamptz not null default timezone('utc', now()), reviewed_at timestamptz, reviewed_by uuid references auth.users(id)
);
create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, requested_by uuid not null references auth.users(id), status public.request_status not null default 'pending', format text not null check (format in ('csv','pdf')), idempotency_key text not null, created_at timestamptz not null default timezone('utc', now()), unique (organization_id, idempotency_key)
);

create or replace function public.create_profile_for_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(id) values (new.id) on conflict do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile_for_user();

create or replace function public.touch_version() returns trigger language plpgsql security definer set search_path = public as $$ begin new.version = old.version + 1; new.updated_at = timezone('utc', now()); return new; end; $$;
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_version();
create trigger expenses_touch before update on public.expenses for each row execute function public.touch_version();
create trigger profiles_touch before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_touch before update on public.organizations for each row execute function public.set_updated_at();
create trigger members_touch before update on public.organization_members for each row execute function public.set_updated_at();
create trigger clients_touch before update on public.clients for each row execute function public.set_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.set_updated_at();
create trigger journal_entries_touch before update on public.journal_entries for each row execute function public.touch_version();

create or replace function public.assert_invoice_transition() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'void' and new.status <> 'void' then raise exception 'void invoices cannot transition'; end if;
  if old.status = 'paid' and new.status <> 'paid' then raise exception 'paid invoices can only be reversed by a privileged workflow'; end if;
  if old.status = 'draft' and new.status not in ('draft','sent','void') then raise exception 'invalid draft transition'; end if;
  if old.status = 'sent' and new.status not in ('sent','viewed','overdue','void','partially_paid','paid') then raise exception 'invalid sent transition'; end if;
  if old.status = 'viewed' and new.status not in ('viewed','overdue','partially_paid','paid','void') then raise exception 'invalid viewed transition'; end if;
  if old.status = 'overdue' and new.status not in ('overdue','partially_paid','paid','void') then raise exception 'invalid overdue transition'; end if;
  if old.status = 'partially_paid' and new.status not in ('partially_paid','paid','overdue') then raise exception 'invalid partial payment transition'; end if;
  if new.status in ('paid','partially_paid') and auth.role() <> 'service_role' then raise exception 'payment state changes must use a privileged workflow'; end if;
  if new.balance_due > new.total_amount then raise exception 'balance_due exceeds total_amount'; end if;
  return new;
end; $$;
create trigger invoice_transition before update on public.invoices for each row execute function public.assert_invoice_transition();

create or replace function public.reject_audit_mutation() returns trigger language plpgsql security definer set search_path = public as $$ begin raise exception 'audit logs are immutable'; end; $$;
create trigger audit_no_update before update or delete on public.audit_logs for each row execute function public.reject_audit_mutation();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.audit_logs enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.export_jobs enable row level security;

-- Remove accidental default grants; service role remains able to operate server-side.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select, insert, update, delete on public.profiles, public.organizations, public.organization_members, public.clients, public.projects, public.invoices, public.invoice_items, public.expenses, public.accounts, public.journal_entries, public.journal_lines, public.audit_logs, public.account_deletion_requests to authenticated;

do $$ declare t text; begin foreach t in array array['profiles','organizations','organization_members','clients','projects','invoices','invoice_items','payments','expenses','accounts','journal_entries','journal_lines','audit_logs','idempotency_keys','rate_limit_events','account_deletion_requests','export_jobs','ai_budgets','ai_usage_logs','ai_decision_cards'] loop execute format('drop policy if exists %I_select on public.%I', t, t); execute format('drop policy if exists %I_insert on public.%I', t, t); execute format('drop policy if exists %I_update on public.%I', t, t); execute format('drop policy if exists %I_delete on public.%I', t, t); end loop; end $$;

create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy organizations_select on public.organizations for select to authenticated using (public.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated using (public.has_org_role(id, array['owner']::public.member_role[])) with check (public.has_org_role(id, array['owner']::public.member_role[]));
create policy organizations_delete on public.organizations for delete to authenticated using (public.has_org_role(id, array['owner']::public.member_role[]));
create policy members_select on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy members_insert on public.organization_members for insert to authenticated with check (public.has_org_role(organization_id, array['owner']::public.member_role[]));
create policy members_update on public.organization_members for update to authenticated using (public.has_org_role(organization_id, array['owner']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner']::public.member_role[]));
create policy members_delete on public.organization_members for delete to authenticated using (public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- Generic organization policy pattern, with operation-specific role restrictions.
create policy clients_select on public.clients for select to authenticated using (public.is_org_member(organization_id));
create policy clients_insert on public.clients for insert to authenticated with check (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy clients_update on public.clients for update to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy clients_delete on public.clients for delete to authenticated using (public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy projects_select on public.projects for select to authenticated using (public.is_org_member(organization_id));
create policy projects_insert on public.projects for insert to authenticated with check (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy projects_update on public.projects for update to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy projects_delete on public.projects for delete to authenticated using (public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy invoices_select on public.invoices for select to authenticated using (public.is_org_member(organization_id));
create policy invoices_insert on public.invoices for insert to authenticated with check (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]) and created_by = auth.uid());
create policy invoices_update on public.invoices for update to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy invoices_delete on public.invoices for delete to authenticated using (public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy invoice_items_select on public.invoice_items for select to authenticated using (exists (select 1 from public.invoices i where i.id = invoice_id and public.is_org_member(i.organization_id)));
create policy invoice_items_insert on public.invoice_items for insert to authenticated with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, array['owner','manager','accountant']::public.member_role[])));
create policy invoice_items_update on public.invoice_items for update to authenticated using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, array['owner','manager','accountant']::public.member_role[]))) with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, array['owner','manager','accountant']::public.member_role[])));
create policy invoice_items_delete on public.invoice_items for delete to authenticated using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_org_role(i.organization_id, array['owner','manager']::public.member_role[])));
create policy expenses_select on public.expenses for select to authenticated using (public.is_org_member(organization_id) and (public.has_org_role(organization_id, array['owner','manager','accountant','viewer']::public.member_role[]) or submitted_by = auth.uid()));
create policy expenses_insert on public.expenses for insert to authenticated with check (public.is_org_member(organization_id) and submitted_by = auth.uid() and public.has_org_role(organization_id, array['owner','manager','accountant','staff']::public.member_role[]));
create policy expenses_update on public.expenses for update to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]) or (submitted_by = auth.uid() and status in ('draft','needs_review'))) with check (public.is_org_member(organization_id));
create policy expenses_delete on public.expenses for delete to authenticated using (public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy accounts_select on public.accounts for select to authenticated using (public.is_org_member(organization_id));
create policy accounts_insert on public.accounts for insert to authenticated with check (public.has_org_role(organization_id, array['owner','accountant']::public.member_role[]));
create policy accounts_update on public.accounts for update to authenticated using (public.has_org_role(organization_id, array['owner','accountant']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','accountant']::public.member_role[]));
create policy accounts_delete on public.accounts for delete to authenticated using (public.has_org_role(organization_id, array['owner']::public.member_role[]));
create policy journal_entries_select on public.journal_entries for select to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant','viewer']::public.member_role[]));
create policy journal_lines_select on public.journal_lines for select to authenticated using (exists (select 1 from public.journal_entries j where j.id = journal_entry_id and public.has_org_role(j.organization_id, array['owner','manager','accountant','viewer']::public.member_role[])));
create policy audit_logs_select on public.audit_logs for select to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy deletion_select on public.account_deletion_requests for select to authenticated using (user_id = auth.uid());

-- Financial writes and privileged operations intentionally have no authenticated policies.
-- payments, idempotency_keys, rate_limit_events, export_jobs and journal posting are Edge Function-only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('private-receipts', 'private-receipts', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']) on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
create policy receipts_select on storage.objects for select to authenticated using (bucket_id = 'private-receipts' and public.is_org_member((storage.foldername(name))[1]::uuid));
create policy receipts_insert on storage.objects for insert to authenticated with check (bucket_id = 'private-receipts' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','manager','accountant','staff']::public.member_role[]) and (storage.foldername(name))[2] = auth.uid()::text);
create policy receipts_update on storage.objects for update to authenticated using (bucket_id = 'private-receipts' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','manager','accountant']::public.member_role[]));
create policy receipts_delete on storage.objects for delete to authenticated using (bucket_id = 'private-receipts' and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner','manager','accountant']::public.member_role[]));

revoke execute on function public.is_org_member(uuid, uuid) from public;
revoke execute on function public.has_org_role(uuid, public.member_role[], uuid) from public;

grant execute on function public.create_organization(text, text) to authenticated;

-- Atomic privileged workflows. Only the service role used by Edge Functions may execute these.
create or replace function public.record_invoice_payment(p_organization_id uuid, p_invoice_id uuid, p_amount numeric, p_payment_method text, p_idempotency_key text, p_actor uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_invoice public.invoices; v_payment public.payments; v_balance numeric; v_status public.invoice_status; v_result jsonb;
begin
  if auth.role() <> 'service_role' then raise exception 'privileged workflow required'; end if;
  select * into v_invoice from public.invoices where id = p_invoice_id and organization_id = p_organization_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if v_invoice.status in ('void','paid') then raise exception 'invoice is not payable'; end if;
  if p_amount <= 0 or p_amount > v_invoice.balance_due then raise exception 'invalid payment amount'; end if;
  insert into public.payments(organization_id, invoice_id, amount, payment_method, idempotency_key, created_by) values (p_organization_id, p_invoice_id, p_amount, p_payment_method, p_idempotency_key, p_actor) returning * into v_payment;
  v_balance := v_invoice.balance_due - p_amount;
  v_status := case when v_balance = 0 then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end;
  update public.invoices set balance_due = v_balance, status = v_status, version = version + 1, updated_at = timezone('utc', now()) where id = p_invoice_id;
  return jsonb_build_object('invoice_id', p_invoice_id, 'payment_id', v_payment.id, 'balance_due', v_balance, 'status', v_status);
exception when unique_violation then
  select jsonb_build_object('replayed', true, 'payment_id', id) into strict v_result from public.payments where organization_id = p_organization_id and idempotency_key = p_idempotency_key;
  return v_result;
end; $$;

create or replace function public.post_journal_entry(p_organization_id uuid, p_entry_id uuid, p_expected_version integer, p_actor uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_entry public.journal_entries; v_debit numeric; v_credit numeric;
begin
  if auth.role() <> 'service_role' then raise exception 'privileged workflow required'; end if;
  select * into v_entry from public.journal_entries where id = p_entry_id and organization_id = p_organization_id for update;
  if not found or v_entry.status <> 'draft' or v_entry.version <> p_expected_version then raise exception 'stale or non-draft journal entry'; end if;
  select coalesce(sum(debit_amount),0), coalesce(sum(credit_amount),0) into v_debit, v_credit from public.journal_lines where journal_entry_id = p_entry_id;
  if v_debit = 0 or v_debit <> v_credit then raise exception 'journal entry is not balanced'; end if;
  update public.journal_entries set status = 'posted', version = version + 1, updated_at = timezone('utc', now()) where id = p_entry_id;
  return jsonb_build_object('entry_id', p_entry_id, 'status', 'posted');
end; $$;

create or replace function public.reverse_journal_entry(p_organization_id uuid, p_entry_id uuid, p_actor uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_entry public.journal_entries; v_reversal uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'privileged workflow required'; end if;
  select * into v_entry from public.journal_entries where id = p_entry_id and organization_id = p_organization_id for update;
  if not found or v_entry.status <> 'posted' then raise exception 'only posted entries can be reversed'; end if;
  update public.journal_entries set status = 'reversed', version = version + 1, updated_at = timezone('utc', now()) where id = p_entry_id;
  insert into public.journal_entries(organization_id, source_type, source_id, entry_date, status, created_by) values (p_organization_id, 'reversal', p_entry_id, current_date, 'posted', p_actor) returning id into v_reversal;
  insert into public.journal_lines(journal_entry_id, account_id, debit_amount, credit_amount) select v_reversal, account_id, credit_amount, debit_amount from public.journal_lines where journal_entry_id = p_entry_id;
  return v_reversal;
end; $$;

grant execute on function public.record_invoice_payment(uuid, uuid, numeric, text, text, uuid) to service_role;
grant execute on function public.post_journal_entry(uuid, uuid, integer, uuid) to service_role;
grant execute on function public.reverse_journal_entry(uuid, uuid, uuid) to service_role;

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id), event_type text not null, metadata jsonb not null default '{}'::jsonb, request_id uuid not null, created_at timestamptz not null default timezone('utc', now())
);
alter table public.security_events enable row level security;
revoke all on public.security_events from anon, authenticated;
create or replace function public.reject_security_event_mutation() returns trigger language plpgsql security definer set search_path = public as $$ begin raise exception 'security events are immutable'; end; $$;
create trigger security_events_no_update before update or delete on public.security_events for each row execute function public.reject_security_event_mutation();
grant insert on public.security_events to service_role;

create table if not exists public.ai_budgets (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  monthly_request_limit integer not null default 500 check (monthly_request_limit between 1 and 100000),
  monthly_token_limit integer not null default 250000 check (monthly_token_limit between 1000 and 10000000),
  enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, actor_user_id uuid not null references auth.users(id), request_id uuid not null, model text not null, prompt_tokens integer not null default 0 check (prompt_tokens >= 0), completion_tokens integer not null default 0 check (completion_tokens >= 0), total_tokens integer not null default 0 check (total_tokens >= 0), estimated_cost_micros bigint not null default 0 check (estimated_cost_micros >= 0), tool_names text[] not null default '{}', finish_reason text, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.ai_decision_cards (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, actor_user_id uuid not null references auth.users(id), request_id uuid not null, question text not null check (char_length(question) between 1 and 2000), assumptions jsonb not null default '[]'::jsonb, data_period text, calculated_metrics jsonb not null default '{}'::jsonb, scenarios jsonb not null default '[]'::jsonb, confidence text not null check (confidence in ('low','medium','high')), risks jsonb not null default '[]'::jsonb, recommended_next_action text, evidence jsonb not null default '[]'::jsonb, created_at timestamptz not null default timezone('utc', now())
);
alter table public.ai_budgets enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.ai_decision_cards enable row level security;
revoke all on public.ai_budgets, public.ai_usage_logs, public.ai_decision_cards from anon;
revoke all on public.ai_budgets, public.ai_usage_logs, public.ai_decision_cards from authenticated;
drop policy if exists ai_budgets_select on public.ai_budgets;
drop policy if exists ai_usage_select on public.ai_usage_logs;
drop policy if exists ai_decision_cards_select on public.ai_decision_cards;
create policy ai_budgets_select on public.ai_budgets for select to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy ai_usage_select on public.ai_usage_logs for select to authenticated using (public.has_org_role(organization_id, array['owner','manager','accountant']::public.member_role[]));
create policy ai_decision_cards_select on public.ai_decision_cards for select to authenticated using (public.is_org_member(organization_id));
grant select on public.ai_budgets, public.ai_usage_logs, public.ai_decision_cards to authenticated;
grant insert on public.ai_usage_logs, public.ai_decision_cards to service_role;
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated using (public.is_org_member(organization_id));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade, recipient_user_id uuid not null references auth.users(id) on delete cascade, kind text not null check (kind in ('invoice_overdue','expense_review','payment_received','system','security')), title text not null check (char_length(title) between 1 and 160), body text not null check (char_length(body) between 1 and 1000), entity_type text, entity_id uuid, read_at timestamptz, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, platform text not null check (platform in ('ios','android','web')), expo_push_token text not null check (char_length(expo_push_token) between 10 and 512), device_label text, last_seen_at timestamptz not null default timezone('utc', now()), created_at timestamptz not null default timezone('utc', now()), unique(user_id, expo_push_token)
);
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
revoke all on public.notifications, public.push_tokens from anon;
revoke all on public.notifications, public.push_tokens from authenticated;
drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists push_tokens_select on public.push_tokens;
create policy notifications_select on public.notifications for select to authenticated using (recipient_user_id = auth.uid() and (organization_id is null or public.is_org_member(organization_id)));
create policy notifications_update on public.notifications for update to authenticated using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());
create policy push_tokens_select on public.push_tokens for select to authenticated using (user_id = auth.uid());
grant select, update on public.notifications to authenticated;
grant select on public.push_tokens to authenticated;
grant insert, update, delete on public.push_tokens to service_role;
grant insert on public.notifications to service_role;

create or replace function public.consume_rate_limit(p_actor uuid, p_operation text, p_max_per_minute integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'privileged workflow required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text || ':' || p_operation, 0));
  delete from public.rate_limit_events where created_at < timezone('utc', now()) - interval '10 minutes';
  select count(*) into v_count from public.rate_limit_events where actor_user_id = p_actor and operation = p_operation and created_at >= timezone('utc', now()) - interval '1 minute';
  if v_count >= p_max_per_minute then return false; end if;
  insert into public.rate_limit_events(actor_user_id, operation, bucket) values (p_actor, p_operation, to_char(timezone('utc', now()), 'YYYYMMDDHH24MI'));
  return true;
end; $$;
grant execute on function public.consume_rate_limit(uuid, text, integer) to service_role;
