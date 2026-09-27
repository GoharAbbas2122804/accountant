import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '@/theme';

export function AppCard({ children, style, tone = 'surface' }: PropsWithChildren<{ style?: ViewStyle; tone?: 'surface' | 'lavender' | 'peach' | 'yellow' | 'mint' }>) {
  const backgroundColor = tone === 'lavender' ? colors.lavender : tone === 'peach' ? colors.peach : tone === 'yellow' ? colors.yellow : tone === 'mint' ? colors.mint : colors.surface;
  return <View style={[styles.card, { backgroundColor }, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Text style={styles.sectionAction}>{action}</Text> : null}</View>;
}

export function PrimaryButton({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.button, secondary ? styles.secondaryButton : styles.primaryButton, pressed && styles.pressed]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}

export function IconButton({ label, onPress, color = colors.peach }: { label: string; onPress: () => void; color?: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: color }, pressed && styles.pressed]}><Text style={styles.iconLabel}>{label}</Text></Pressable>;
}

export function MetricCard({ label, value, detail, tone = 'surface' }: { label: string; value: string; detail?: string; tone?: 'surface' | 'lavender' | 'peach' | 'yellow' | 'mint' }) {
  return <AppCard tone={tone} style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text>{detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}</AppCard>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text><TextInput placeholderTextColor={colors.muted} style={styles.field} {...props} /></View>;
}

export function StatusPill({ label, kind = 'neutral' }: { label: string; kind?: 'positive' | 'warning' | 'danger' | 'neutral' }) {
  const bg = kind === 'positive' ? colors.mint : kind === 'warning' ? colors.yellow : kind === 'danger' ? '#FDE3E3' : colors.lavender;
  const fg = kind === 'positive' ? colors.success : kind === 'warning' ? colors.warning : kind === 'danger' ? colors.danger : colors.ink;
  return <View style={[styles.pill, { backgroundColor: bg }]}><Text style={[styles.pillText, { color: fg }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, padding: spacing.lg, shadowColor: '#2D2750', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  sectionAction: { color: colors.orangeDark, fontWeight: '700' },
  button: { minHeight: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryButton: { backgroundColor: colors.orange }, secondaryButton: { backgroundColor: colors.peach }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 15 }, secondaryText: { color: colors.orangeDark },
  iconButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, iconLabel: { fontSize: 20, color: colors.ink, fontWeight: '800' },
  metric: { flex: 1, minHeight: 112, padding: spacing.md }, metricLabel: { fontSize: 12, color: colors.muted, fontWeight: '700' }, metricValue: { marginTop: 8, fontSize: 20, fontWeight: '900', color: colors.ink }, metricDetail: { marginTop: 4, color: colors.muted, fontSize: 11 },
  fieldWrap: { marginBottom: spacing.md }, fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }, field: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.ink, fontSize: 15 },
  pill: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' }, pillText: { fontSize: 11, fontWeight: '800' },
});
