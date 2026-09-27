import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoState } from '@/data/demo';
import type { AppState } from '@/types';

const KEY = 'ledgerflow-state-v1';

export async function loadState(): Promise<AppState> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    return stored ? JSON.parse(stored) as AppState : demoState;
  } catch {
    return demoState;
  }
}

export async function saveState(state: AppState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function resetState() {
  await AsyncStorage.removeItem(KEY);
  return demoState;
}
