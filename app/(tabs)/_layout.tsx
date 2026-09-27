import { Tabs, router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.orangeDark, tabBarInactiveTintColor: colors.muted, tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.label }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>⌂</Text> }} />
    <Tabs.Screen name="transactions" options={{ title: 'Money', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>↕</Text> }} />
    <Tabs.Screen name="add" options={{ title: '', tabBarButton: () => <Pressable onPress={() => router.push('/add' as never)} style={({ pressed }) => [styles.addButton, pressed && { transform: [{ scale: .95 }] }]}><Text style={styles.plus}>＋</Text></Pressable> }} />
    <Tabs.Screen name="two" options={{ title: 'Invoices', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>▤</Text> }} />
    <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 19 }}>•••</Text> }} />
  </Tabs>;
}
const styles = StyleSheet.create({ tabBar: { height: 74, paddingTop: 8, paddingBottom: 9, borderTopWidth: 0, backgroundColor: '#FFFFFF', elevation: 12, shadowColor: '#2D2750', shadowOpacity: .09, shadowRadius: 16 }, label: { fontSize: 10, fontWeight: '700' }, addButton: { top: -20, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: colors.background, shadowColor: colors.orangeDark, shadowOpacity: .25, shadowRadius: 8, elevation: 5 }, plus: { color: '#fff', fontSize: 28, fontWeight: '300' } });
