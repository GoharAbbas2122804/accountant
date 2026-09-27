import type { Currency } from '@/types';

export const colors = {
  background: '#F8F7FC',
  surface: '#FFFFFF',
  ink: '#242238',
  muted: '#817E96',
  border: '#ECEAF3',
  orange: '#F47C5B',
  orangeDark: '#D86143',
  peach: '#FFE5D8',
  lavender: '#EAE6FF',
  yellow: '#FFF1BD',
  mint: '#DDF5EC',
  blue: '#E0EEFF',
  success: '#249A70',
  warning: '#C58B20',
  danger: '#CE5A5A',
};

export const radii = { sm: 12, md: 18, lg: 26, pill: 999 };
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
export const currencySymbols: Record<Currency, string> = { PKR: 'PKR', USD: '$', GBP: '£', EUR: '€' };

export function money(value: number, currency: Currency = 'PKR') {
  return new Intl.NumberFormat(currency === 'PKR' ? 'en-PK' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function compactMoney(value: number, currency: Currency = 'PKR') {
  const symbol = currencySymbols[currency];
  if (Math.abs(value) >= 1000000) return `${symbol} ${(value / 1000000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${symbol} ${Math.round(value / 1000)}k`;
  return money(value, currency);
}
