import type { AppState, Client, ExpenseCategory, Transaction } from '@/types';

export const demoTransactions: Transaction[] = [
  { id: 'tx-1', type: 'income', merchant: 'Acme Studio', amount: 185000, date: '2026-09-24', category: 'Client payment', client: 'Acme Studio', project: 'Brand refresh', paymentMethod: 'Bank', status: 'Completed' },
  { id: 'tx-2', type: 'expense', merchant: 'Figma', amount: 12800, date: '2026-09-23', category: 'Software & Subscriptions', paymentMethod: 'Card', status: 'Completed', notes: 'Team plan' },
  { id: 'tx-3', type: 'income', merchant: 'PixelCraft', amount: 95000, date: '2026-09-20', category: 'Client payment', client: 'PixelCraft', project: 'E-commerce build', paymentMethod: 'Bank', status: 'Completed' },
  { id: 'tx-4', type: 'expense', merchant: 'Freelancer fee', amount: 42000, date: '2026-09-18', category: 'Team & Contractors', paymentMethod: 'Bank', status: 'Needs review' },
  { id: 'tx-5', type: 'expense', merchant: 'Internet service', amount: 8600, date: '2026-09-16', category: 'Utilities', paymentMethod: 'Wallet', status: 'Pending' },
  { id: 'tx-6', type: 'income', merchant: 'Nova Health', amount: 125000, date: '2026-09-12', category: 'Client payment', client: 'Nova Health', project: 'Website care', paymentMethod: 'Bank', status: 'Completed' },
];

export const demoInvoices = [
  { id: 'INV-1042', client: 'PixelCraft', project: 'E-commerce build', amount: 95000, balanceDue: 95000, issueDate: '2026-09-18', dueDate: '2026-09-28', status: 'overdue' as const },
  { id: 'INV-1041', client: 'Acme Studio', project: 'Brand refresh', amount: 185000, balanceDue: 0, issueDate: '2026-09-02', dueDate: '2026-09-16', status: 'paid' as const },
  { id: 'INV-1040', client: 'Nova Health', project: 'Website care', amount: 125000, balanceDue: 125000, issueDate: '2026-09-22', dueDate: '2026-10-06', status: 'sent' as const },
  { id: 'INV-1039', client: 'Lumen Labs', project: 'Product strategy', amount: 78000, balanceDue: 78000, issueDate: '2026-09-25', dueDate: '2026-10-10', status: 'draft' as const },
];

export const clients: Client[] = [
  { id: 'c-1', name: 'Acme Studio', email: 'hello@acme.studio', billed: 620000, received: 540000, outstanding: 80000, project: 'Brand refresh', margin: 74 },
  { id: 'c-2', name: 'PixelCraft', email: 'team@pixelcraft.io', billed: 410000, received: 315000, outstanding: 95000, project: 'E-commerce build', margin: 62 },
  { id: 'c-3', name: 'Nova Health', email: 'ops@nova.health', billed: 275000, received: 125000, outstanding: 150000, project: 'Website care', margin: 58 },
  { id: 'c-4', name: 'Lumen Labs', email: 'finance@lumenlabs.co', billed: 195000, received: 117000, outstanding: 78000, project: 'Product strategy', margin: 81 },
];

export const expenseCategories: ExpenseCategory[] = [
  { name: 'Software & Subscriptions', total: 68200, color: '#8C7BFF' },
  { name: 'Team & Contractors', total: 124000, color: '#FF9B76' },
  { name: 'Travel', total: 28600, color: '#F7C95E' },
  { name: 'Marketing', total: 18500, color: '#67C7B2' },
  { name: 'Office & Utilities', total: 14300, color: '#8BA5D9' },
];

export const demoState: AppState = {
  transactions: demoTransactions,
  invoices: demoInvoices,
  settings: { onboarded: true, currency: 'PKR', businessType: 'Agency', advancedMode: false },
};
