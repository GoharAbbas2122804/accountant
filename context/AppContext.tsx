import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { demoState } from '@/data/demo';
import { loadState, resetState, saveState } from '@/services/storage';
import type { AppState, Invoice, Transaction } from '@/types';

type AppContextValue = AppState & { ready: boolean; addTransaction: (tx: Transaction) => void; addInvoice: (invoice: Invoice) => void; markInvoicePaid: (id: string) => void; resetDemo: () => void };
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(demoState);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadState().then((next) => { setState(next); setReady(true); }); }, []);
  useEffect(() => { if (ready) saveState(state); }, [state, ready]);
  const value = useMemo<AppContextValue>(() => ({ ...state, ready, addTransaction: (tx) => setState((s) => ({ ...s, transactions: [tx, ...s.transactions] })), addInvoice: (invoice) => setState((s) => ({ ...s, invoices: [invoice, ...s.invoices] })), markInvoicePaid: (id) => setState((s) => { const invoice = s.invoices.find((item) => item.id === id); if (!invoice || invoice.status === 'paid') return s; return { ...s, invoices: s.invoices.map((item) => item.id === id ? { ...item, status: 'paid', balanceDue: 0 } : item), transactions: [{ id: `tx-${Date.now()}`, type: 'income', merchant: invoice.client, amount: invoice.amount, date: new Date().toISOString().slice(0, 10), category: 'Invoice payment', client: invoice.client, project: invoice.project, paymentMethod: 'Bank', status: 'Completed' }, ...s.transactions] }; }), resetDemo: () => { resetState().then(setState); } }), [state, ready]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('useApp must be used inside AppProvider'); return context; }
