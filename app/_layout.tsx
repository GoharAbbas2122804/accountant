import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { registerPushToken } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();
function NotificationBootstrap() {
  const { user, memberships } = useAuth();
  useEffect(() => { if (!user || !user.email_confirmed_at || !memberships.some((member) => member.status === 'active')) return; void registerPushToken().catch(() => undefined); }, [user?.id, user?.email_confirmed_at, memberships.length]);
  return null;
}
export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  useEffect(() => { if (loaded) void SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return <AuthProvider><AppProvider><NotificationBootstrap /><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#07090F' } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="add" options={{ presentation: 'modal' }} /><Stack.Screen name="onboarding" options={{ presentation: 'modal' }} /><Stack.Screen name="command" /><Stack.Screen name="assistant" /><Stack.Screen name="notifications" /><Stack.Screen name="auth" options={{ presentation: 'modal' }} /></Stack></AppProvider></AuthProvider>;
}
