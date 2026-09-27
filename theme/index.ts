import type { Currency } from '@/types';

export const executiveNight = {
  background: '#07090F', surface: '#0D1320', surfaceElevated: '#131C2C', surfaceMuted: '#1A2435', border: 'rgba(255,255,255,0.08)',
  ink: '#F7F9FC', muted: '#A7B0C0', textMuted: '#6D7788', orange: '#3E8BFF', orangeDark: '#69A7FF', peach: '#243A61', lavender: '#1A153E', yellow: '#4B3514', mint: '#073B3B', blue: '#0A2947', success: '#69E29A', warning: '#F6B84B', danger: '#FF3B4F', expense: '#FF6B5E', teal: '#19C7B0', purple: '#8D72FF', gold: '#F6B84B', white: '#FFFFFF', black: '#000000',
};

export const ledgerLight = {
  background: '#F5F7FB', surface: '#FFFFFF', surfaceElevated: '#F0F4FA', surfaceMuted: '#E8EEF8', border: '#DDE5F0',
  ink: '#122038', muted: '#64748B', textMuted: '#94A3B8', orange: '#246BCE', orangeDark: '#1450A3', peach: '#E0EEFF', lavender: '#ECE8FF', yellow: '#FFF1CC', mint: '#DDF5EC', blue: '#DCEBFF', success: '#16875B', warning: '#A66A06', danger: '#D63D4D', expense: '#D6534C', teal: '#0D9F91', purple: '#6C58CF', gold: '#B57A16', white: '#FFFFFF', black: '#000000',
};

export const colors = executiveNight;
export const radii = { sm: 12, md: 16, lg: 22, pill: 999 };
export const spacing = { xs: 8, sm: 12, md: 16, lg: 20, xl: 28, xxl: 36 };
export const typography = { display: 32, title: 24, heading: 18, body: 14, caption: 12, micro: 10 };
export const shadows = { card: { shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 5 }, soft: { shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 } };
export const gradients = { cardBlue: ['#0A2947', '#123C68'], cardTeal: ['#073B3B', '#0E6A60'], cardExpense: ['#24370F', '#609C28'], cardWarning: ['#4B171C', '#B54435'], cardPurple: ['#1A153E', '#4E3B9C'] } as const;
export const currencySymbols: Record<Currency, string> = { PKR: 'PKR', USD: '$', GBP: '£', EUR: '€' };
export function money(value: number, currency: Currency = 'PKR') { return new Intl.NumberFormat(currency === 'PKR' ? 'en-PK' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
export function compactMoney(value: number, currency: Currency = 'PKR') { const symbol = currencySymbols[currency]; if (Math.abs(value) >= 1000000) return `${symbol} ${(value / 1000000).toFixed(1)}m`; if (Math.abs(value) >= 1000) return `${symbol} ${Math.round(value / 1000)}k`; return money(value, currency); }
