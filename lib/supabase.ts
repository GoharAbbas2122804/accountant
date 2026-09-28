import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const memory = new Map<string, string>();
const secureStorage: SupportedStorage = {
  getItem: async (key) => Platform.OS === 'web' ? memory.get(key) ?? null : SecureStore.getItemAsync(key),
  setItem: async (key, value) => { if (Platform.OS === 'web') memory.set(key, value); else await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); },
  removeItem: async (key) => { if (Platform.OS === 'web') memory.delete(key); else await SecureStore.deleteItemAsync(key); },
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.invalid', supabaseAnonKey || 'placeholder-anon-key', { auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' } });
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
