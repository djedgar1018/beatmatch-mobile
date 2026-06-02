import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';

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
    AsyncStorage.getItem('auth_token').then((token) => {
      setChecking(false);
      if (!token) {
        router.replace('/auth');
      }
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" />
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
            </Stack>
          </AuthGate>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
