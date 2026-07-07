import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export async function getStoredAuthUser<T = any>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    await AsyncStorage.removeItem('auth_user');
    return null;
  }
}

export async function isSignedIn(): Promise<boolean> {
  return (await getStoredAuthUser()) != null;
}

export function promptSignInForAction(message: string) {
  Alert.alert('Account Required', message, [
    { text: 'Not Now', style: 'cancel' },
    { text: 'Sign In or Create Account', onPress: () => router.push('/auth' as any) },
  ]);
}
