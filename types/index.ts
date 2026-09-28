export type Currency = 'PKR' | 'USD' | 'GBP' | 'EUR';
export type TransactionType = 'income' | 'expense';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'void';

export interface Transaction {
  id: string;
  type: TransactionType;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  client?: string;
  project?: string;
  paymentMethod: 'Cash' | 'Bank' | 'Card' | 'Wallet';
  status: 'Completed' | 'Needs review' | 'Pending';
  notes?: string;
}

export interface Invoice {
  id: string;
  client: string;
  project: string;
  amount: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  recurring?: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  billed: number;
  received: number;
  outstanding: number;
  project: string;
  margin: number;
}

export interface ExpenseCategory {
  name: string;
  total: number;
  color: string;
}

export interface UserSettings {
  onboarded: boolean;
  currency: Currency;
  businessType: string;
  advancedMode: boolean;
}

export interface AppState {
  transactions: Transaction[];
  invoices: Invoice[];
  settings: UserSettings;
}
