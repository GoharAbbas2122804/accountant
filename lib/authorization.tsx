import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/theme';
import { useAuth } from '@/context/AuthContext';

export type MemberRole = 'owner' | 'manager' | 'accountant' | 'staff' | 'viewer';
export const rolePermissions: Record<MemberRole, string[]> = { owner: ['dashboard.read','transactions.read','transactions.write','invoices.read','invoices.write','payments.confirm','ledger.post','ledger.reverse','reports.export','team.manage','billing.manage','organization.delete'], manager: ['dashboard.read','transactions.read','transactions.write','invoices.read','invoices.write','payments.confirm','reports.export'], accountant: ['dashboard.read','transactions.read','invoices.read','ledger.post','ledger.reverse','reports.export'], staff: ['dashboard.read','transactions.read','transactions.write','expenses.submit'], viewer: ['dashboard.read'] };
export function can(role: MemberRole | undefined, permission: string) { return Boolean(role && rolePermissions[role].includes(permission)); }
export function RoleGate({ permission, children }: PropsWithChildren<{ permission: string }>) { const { ready, user, memberships } = useAuth(); if (!ready) return null; if (!user) return <Redirect href="/auth" />; const allowed = memberships.some((m) => m.status === 'active' && can(m.role, permission)); if (!allowed) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: colors.ink, fontWeight: '900', fontSize: 20 }}>Access restricted</Text><Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>Your organization role does not allow this action.</Text></View>; return <>{children}</>; }
