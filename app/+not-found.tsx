import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

export default function NotFoundScreen() {
  return <><Stack.Screen options={{ title: 'Not found' }} /><View style={styles.container}><Text style={styles.eyebrow}>LEDGERFLOW EXECUTIVE</Text><Text style={styles.title}>This screen is unavailable.</Text><Text style={styles.body}>The route may have moved or you may not have access to it.</Text><Link href="/" style={styles.link}><Text style={styles.linkText}>Return to workspace</Text></Link></View></>;
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background }, eyebrow: { color: colors.orangeDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 12 }, body: { color: colors.muted, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 320 }, link: { marginTop: 22, backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13 }, linkText: { color: colors.surface, fontWeight: '900' } });
