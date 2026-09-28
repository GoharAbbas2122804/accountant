import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AppCard, Field, PrimaryButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const submit = async () => { if (password.length < 10 || password !== confirm) { Alert.alert('Check your password', 'Use at least 10 characters and make both fields match.'); return; } const { error } = await supabase.auth.updateUser({ password }); if (error) { Alert.alert('Unable to update password', 'The reset link may have expired. Request a new one and try again.'); return; } Alert.alert('Password updated', 'Your password has been changed.'); router.replace('/'); };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>SECURE ACCESS</Text><Text style={styles.title}>Set a new password</Text><Text style={styles.sub}>Choose a strong password for your LedgerFlow workspace.</Text><AppCard style={styles.card}><Field label="New password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 10 characters" /><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Repeat your password" /><PrimaryButton label="Update password" onPress={submit} /><Pressable onPress={() => router.replace('/auth')}><Text style={styles.cancel}>Back to sign in</Text></Pressable></AppCard></ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingTop: 80 }, eyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 10 }, sub: { color: colors.muted, marginTop: 6, lineHeight: 20 }, card: { marginTop: 24 }, cancel: { color: colors.orangeDark, fontWeight: '800', textAlign: 'center', marginTop: 18 } });
