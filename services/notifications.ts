import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase, supabaseUrl } from '@/lib/supabase';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });
export type AppNotification = { id: string; organization_id: string | null; kind: string; title: string; body: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string };
export async function registerPushToken() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  const current = await Notifications.getPermissionsAsync(); let status = current.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data; const { data: { session } } = await supabase.auth.getSession(); if (!session || !supabaseUrl) return null;
  const { error } = await supabase.functions.invoke('register-push-token', { body: { expoPushToken: token, platform: Platform.OS, deviceLabel: Device.deviceName?.slice(0, 80) } });
  if (error) throw error; return token;
}
export async function listNotifications() { const { data, error } = await supabase.from('notifications').select('id,organization_id,kind,title,body,entity_type,entity_id,read_at,created_at').order('created_at', { ascending: false }).limit(50); if (error) throw error; return (data ?? []) as AppNotification[]; }
export async function markNotificationRead(id: string) { const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }
