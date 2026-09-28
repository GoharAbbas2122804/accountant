import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

export function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('server configuration unavailable');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers } });
}

export function requestId(req: Request) { return req.headers.get('x-request-id') ?? crypto.randomUUID(); }

export async function requireUser(req: Request, client: SupabaseClient) {
  const auth = req.headers.get('authorization');
  if (!auth?.toLowerCase().startsWith('bearer ')) throw new Error('unauthorized');
  const token = auth.slice(7);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !data.user.email_confirmed_at) throw new Error('unauthorized');
  return data.user;
}

export async function assertOrgRole(client: SupabaseClient, user: User, organizationId: string, roles: string[]) {
  const { data, error } = await client.from('organization_members').select('role,status').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle();
  if (error || !data || data.status !== 'active' || !roles.includes(data.role)) throw new Error('forbidden');
  return data.role;
}

export async function rateLimit(client: SupabaseClient, userId: string, operation: string, maxPerMinute: number) {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await client.from('rate_limit_events').select('id', { count: 'exact', head: true }).eq('actor_user_id', userId).eq('operation', operation).gte('created_at', since);
  if (error) throw new Error('rate limit unavailable');
  if ((count ?? 0) >= maxPerMinute) throw new Error('rate_limited');
  const { error: insertError } = await client.from('rate_limit_events').insert({ actor_user_id: userId, operation, bucket: new Date().toISOString().slice(0, 16) });
  if (insertError) throw new Error('rate limit unavailable');
}

export async function claimIdempotency(client: SupabaseClient, organizationId: string, userId: string, operation: string, key: string) {
  if (!/^[A-Za-z0-9._:-]{16,160}$/.test(key)) throw new Error('invalid idempotency key');
  const { data: existing } = await client.from('idempotency_keys').select('response').eq('organization_id', organizationId).eq('operation', operation).eq('key', key).maybeSingle();
  if (existing) return { replay: true, response: existing.response };
  const { error } = await client.from('idempotency_keys').insert({ organization_id: organizationId, actor_user_id: userId, operation, key });
  if (error) {
    const { data: raced } = await client.from('idempotency_keys').select('response').eq('organization_id', organizationId).eq('operation', operation).eq('key', key).maybeSingle();
    if (raced?.response) return { replay: true, response: raced.response };
    throw new Error('idempotency conflict');
  }
  return { replay: false as const };
}

export async function storeIdempotentResponse(client: SupabaseClient, organizationId: string, operation: string, key: string, response: unknown) {
  await client.from('idempotency_keys').update({ response }).eq('organization_id', organizationId).eq('operation', operation).eq('key', key);
}

export async function audit(client: SupabaseClient, input: { organizationId: string; actorUserId: string; action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown; requestId: string }) {
  const redact = (value: unknown) => value === undefined ? null : JSON.parse(JSON.stringify(value, (key, child) => /password|token|secret|authorization|receipt_path/i.test(key) ? '[REDACTED]' : child));
  await client.from('audit_logs').insert({ organization_id: input.organizationId, actor_user_id: input.actorUserId, action: input.action, entity_type: input.entityType, entity_id: input.entityId ?? null, before_data: redact(input.before), after_data: redact(input.after), request_id: input.requestId });
}

export function errorResponse(error: unknown, id: string) {
  const message = error instanceof Error ? error.message : 'request failed';
  const status = message === 'unauthorized' ? 401 : message === 'forbidden' ? 403 : message === 'rate_limited' ? 429 : message === 'invalid idempotency key' ? 400 : 400;
  const publicMessage = status === 401 ? 'Authentication required' : status === 403 ? 'You are not allowed to perform this action' : status === 429 ? 'Too many requests. Try again shortly.' : 'Request could not be completed';
  return json({ error: publicMessage, requestId: id }, status);
}
