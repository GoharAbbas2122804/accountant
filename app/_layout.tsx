import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AppProvider } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return <AppProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F7FC' } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="add" options={{ presentation: 'modal' }} /><Stack.Screen name="onboarding" options={{ presentation: 'modal' }} /></Stack></AppProvider>;
}
