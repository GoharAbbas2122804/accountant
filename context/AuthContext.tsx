import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import type { AuthenticatorAssuranceLevels, Factor, Session, User } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { MemberRole } from '@/lib/authorization';

type Membership = { organization_id: string; role: MemberRole; status: 'invited' | 'active' | 'disabled' };
type AuthContextValue = { ready: boolean; membershipsReady: boolean; configured: boolean; user: User | null; session: Session | null; memberships: Membership[]; error: string | null; signIn: (email: string, password: string) => Promise<boolean>; signUp: (email: string, password: string, fullName: string) => Promise<boolean>; sendPasswordReset: (email: string) => Promise<boolean>; signOut: () => Promise<void>; requestAccountDeletion: (reason?: string) => Promise<boolean>; refreshMemberships: () => Promise<void>; getMfaStatus: () => Promise<{ currentLevel: AuthenticatorAssuranceLevels; nextLevel: AuthenticatorAssuranceLevels; factors: Factor[] }>; enrollMfa: (friendlyName: string) => Promise<{ factorId: string; qrCode: string } | null>; verifyMfa: (factorId: string, code: string) => Promise<boolean> };
const AuthContext = createContext<AuthContextValue | null>(null);
const GENERIC_AUTH_ERROR = 'We could not complete that request. Check your details and try again.';
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [ready, setReady] = useState(!hasSupabaseConfig); const [membershipsReady, setMembershipsReady] = useState(!hasSupabaseConfig);
  const [error, setError] = useState<string | null>(null);
  const refreshMemberships = useCallback(async () => {
    if (!session?.user) { setMemberships([]); setMembershipsReady(true); return; }
    setMembershipsReady(false);
    const { data, error: membershipError } = await supabase.from('organization_members').select('organization_id,role,status').eq('user_id', session.user.id);
    if (!membershipError) setMemberships((data ?? []) as Membership[]); setMembershipsReady(true);
  }, [session?.user?.id]);
  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let active = true;
    const restoreDeepLink = async (url: string | null) => { if (!url) return; try { const parsed = new URL(url); const hash = new URLSearchParams(parsed.hash.replace(/^#/, '')); const accessToken = hash.get('access_token') ?? parsed.searchParams.get('access_token'); const refreshToken = hash.get('refresh_token') ?? parsed.searchParams.get('refresh_token'); const code = parsed.searchParams.get('code'); if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }); else if (code) await supabase.auth.exchangeCodeForSession(code); } catch { setError(GENERIC_AUTH_ERROR); } };
    const boot = async () => { const { data } = await supabase.auth.getSession(); if (!active) return; setSession(data.session); setReady(true); };
    boot(); Linking.getInitialURL().then(restoreDeepLink); const linkSubscription = Linking.addEventListener('url', ({ url }) => { void restoreDeepLink(url); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true); if (!next) { setMemberships([]); setMembershipsReady(true); } });
    return () => { active = false; linkSubscription.remove(); listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { void refreshMemberships(); }, [refreshMemberships]);
  const signIn = async (email: string, password: string) => { setError(null); if (!hasSupabaseConfig || !validEmail(email) || password.length < 10) { setError(GENERIC_AUTH_ERROR); return false; } const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (authError || !data.session) { setError(GENERIC_AUTH_ERROR); return false; } if (!data.user.email_confirmed_at) { await supabase.auth.signOut(); setError('Please verify your email before signing in.'); return false; } return true; };
  const signUp = async (email: string, password: string, fullName: string) => { setError(null); if (!hasSupabaseConfig || !validEmail(email) || password.length < 10 || fullName.trim().length < 2 || fullName.trim().length > 120) { setError(GENERIC_AUTH_ERROR); return false; } const { error: authError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: fullName.trim().slice(0, 120) } } }); if (authError) { setError(GENERIC_AUTH_ERROR); return false; } return true; };
  const sendPasswordReset = async (email: string) => { setError(null); if (!hasSupabaseConfig || !validEmail(email)) { setError(GENERIC_AUTH_ERROR); return false; } const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: Linking.createURL('/auth/reset') }); if (resetError) { setError(GENERIC_AUTH_ERROR); return false; } return true; };
  const signOut = async () => { await supabase.auth.signOut({ scope: 'local' }); setSession(null); setMemberships([]); };
  const requestAccountDeletion = async (reason?: string) => { setError(null); const { error: requestError } = await supabase.functions.invoke('request-account-deletion', { body: { reason: reason?.trim().slice(0, 1000) } }); if (requestError) { setError('We could not submit the deletion request. Please try again.'); return false; } return true; };
  const getMfaStatus = async () => { const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(); const factors = session?.user ? (await supabase.auth.mfa.listFactors()).data?.all ?? [] : []; return { currentLevel: data?.currentLevel ?? 'aal1', nextLevel: data?.nextLevel ?? 'aal1', factors }; };
  const enrollMfa = async (friendlyName: string) => { const { data, error: factorError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: friendlyName.trim().slice(0, 80) }); if (factorError || !data) return null; return { factorId: data.id, qrCode: data.totp.qr_code }; };
  const verifyMfa = async (factorId: string, code: string) => { if (!/^\d{6}$/.test(code)) return false; const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId }); if (challengeError || !challenge) return false; const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code }); return !verifyError; };
  const value = useMemo(() => ({ ready, membershipsReady, configured: hasSupabaseConfig, user: session?.user ?? null, session, memberships, error, signIn, signUp, sendPasswordReset, signOut, requestAccountDeletion, refreshMemberships, getMfaStatus, enrollMfa, verifyMfa }), [ready, membershipsReady, session, memberships, error, refreshMemberships]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used inside AuthProvider'); return ctx; }
