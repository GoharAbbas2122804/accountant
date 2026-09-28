import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return <AuthProvider><AppProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#07090F' }} }><Stack.Screen name="(tabs)" /><Stack.Screen name="add" options={{ presentation: 'modal' }} /><Stack.Screen name="onboarding" options={{ presentation: 'modal' }} /><Stack.Screen name="command" /><Stack.Screen name="assistant" /><Stack.Screen name="auth" options={{ presentation: 'modal' }} /></Stack></AppProvider></AuthProvider>;
}
