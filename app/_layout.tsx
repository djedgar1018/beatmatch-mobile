import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Colors } from '../constants/colors';
import {
  registerForPushNotifications,
  getNavigationTargetForNotification,
  type MixMatchNotificationData,
} from '../lib/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('auth_user').then((token) => {
      setChecking(false);
      if (token) {
        // Logged in — register for notifications
        registerForPushNotifications().catch(() => {});
      }
      // Not logged in — allow through to Discover (unauthenticated browsing)
      // Booking, Profile, Messages will individually require auth
    });
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function NotificationListener() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification received while app is open — handler in lib/notifications.ts
        // shows an alert banner automatically
      }
    );

    // Tap on notification — navigate to the relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as unknown as MixMatchNotificationData;
        if (!data?.type) return;

        const target = getNavigationTargetForNotification(data);
        if (target) {
          if (target.params) {
            router.push({ pathname: target.pathname as never, params: target.params });
          } else {
            router.push(target.pathname as never);
          }
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}


// Error boundary — prevents full app crash on unhandled JS errors
import React from 'react';
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: string}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: '' }; }
  static getDerivedStateFromError(err: any) { return { hasError: true, error: err?.message || 'Unknown error' }; }
  componentDidCatch(err: any) { console.error('[ErrorBoundary]', err); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: '#8B9DB5', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>{this.state.error}</Text>
          <TouchableOpacity style={{ backgroundColor: '#7C3AED', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }} onPress={() => this.setState({ hasError: false, error: '' })}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <NotificationListener />
          <AuthGate>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="dj/[id]"
                options={{ headerShown: false, presentation: 'card' }}
              />
              <Stack.Screen
                name="messages/[id]"
                options={{
                  title: 'Messages',
                  headerStyle: { backgroundColor: Colors.surface },
                  headerTintColor: Colors.textPrimary,
                }}
              />
              <Stack.Screen
                name="booking-request"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="mixes"
                options={{
                  headerStyle: { backgroundColor: Colors.surface },
                  headerTintColor: Colors.textPrimary,
                }}
              />
              <Stack.Screen
                name="library"
                options={{
                  headerStyle: { backgroundColor: Colors.surface },
                  headerTintColor: Colors.textPrimary,
                }}
              />
            </Stack>
          </AuthGate>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}


