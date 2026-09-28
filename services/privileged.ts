import { supabase } from '@/lib/supabase';

export async function markInvoicePaid(input: { organizationId: string; invoiceId: string; amount: number; paymentMethod: 'cash'|'bank'|'card'|'wallet'|'other'; idempotencyKey: string }) { const { data, error } = await supabase.functions.invoke('mark-invoice-paid', { body: input }); if (error) throw error; return data; }
export async function postLedgerEntry(input: { organizationId: string; entryId: string; expectedVersion: number; idempotencyKey: string }) { const { data, error } = await supabase.functions.invoke('post-ledger-entry', { body: input }); if (error) throw error; return data; }
export async function reverseLedgerEntry(input: { organizationId: string; entryId: string; idempotencyKey: string }) { const { data, error } = await supabase.functions.invoke('reverse-ledger-entry', { body: input }); if (error) throw error; return data; }
export async function requestExport(input: { organizationId: string; format: 'csv'|'pdf'; idempotencyKey: string }) { const { data, error } = await supabase.functions.invoke('request-export', { body: input }); if (error) throw error; return data; }
