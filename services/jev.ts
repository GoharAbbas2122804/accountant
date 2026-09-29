import { supabase, supabaseUrl } from '@/lib/supabase';

export type JevEvidence = { title: string; detail: string; href: string };
export type JevCard = { id?: string; question: string; assumptions: string[]; dataPeriod: string; calculatedMetrics: Record<string, number>; scenarios: Array<{ label: string; value?: number }>; confidence: 'low' | 'medium' | 'high'; risks: string[]; recommendedNextAction: string; evidence: JevEvidence[] };
export type JevStreamHandlers = { onMeta?: (meta: { requestId: string; disclaimer: string }) => void; onText?: (delta: string) => void; onCard?: (card: JevCard) => void };

export async function askJev(organizationId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, handlers: JevStreamHandlers = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token || !supabaseUrl) throw new Error('Sign in to use Jev AI.');
  const response = await fetch(`${supabaseUrl}/functions/v1/jev-chat`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '', 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ organizationId, messages: messages.slice(-12) }) });
  if (!response.ok || !response.body) throw new Error('Jev could not start this request.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
  const handle = (block: string) => { const event = block.match(/^event: (.+)$/m)?.[1]; const data = block.match(/^data: (.+)$/m)?.[1]; if (!event || !data) return; const payload = JSON.parse(data); if (event === 'meta') handlers.onMeta?.(payload); if (event === 'text') handlers.onText?.(payload.delta); if (event === 'card') handlers.onCard?.(payload); if (event === 'error') throw new Error(payload.message); };
  while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done }); let boundary; while ((boundary = buffer.indexOf('\n\n')) >= 0) { const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2); handle(block); } if (done) break; }
}
