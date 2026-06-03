import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://beat-match-production.up.railway.app';
const PUSH_TOKEN_KEY = 'push_token';

// ---------------------------------------------------------------------------
// Notification handler (shown while app is foregrounded)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Notification types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'message'
  | 'booking_reminder';

export interface Mix-MatchNotificationData {
  type: NotificationType;
  bookingId?: string;
  conversationId?: string;
  djName?: string;
  venueName?: string;
  eventName?: string;
}

// ---------------------------------------------------------------------------
// Register for push notifications on login
// ---------------------------------------------------------------------------

export async function registerForPushNotifications(): Promise<string | null> {
  // Check existing stored token first
  const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Android channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mix-match', {
        name: 'Mix-Match',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7c3aed',
      });
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Only POST to server if token changed
    if (token !== cached) {
      await savePushTokenToServer(token);
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }

    return token;
  } catch (e) {
    console.warn('[notifications] registerForPushNotifications failed:', e);
    return cached;
  }
}

// ---------------------------------------------------------------------------
// Save token to backend
// ---------------------------------------------------------------------------

async function savePushTokenToServer(token: string): Promise<void> {
  const authToken = await AsyncStorage.getItem('auth_token');
  if (!authToken) return;

  await fetch(`${BASE_URL}/api/users/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
}

// ---------------------------------------------------------------------------
// Navigation handler — called when user taps a notification
// ---------------------------------------------------------------------------

export function getNavigationTargetForNotification(
  data: Mix-MatchNotificationData
): { pathname: string; params?: Record<string, string> } | null {
  switch (data.type) {
    case 'booking_request':
    case 'booking_accepted':
      return { pathname: '/(tabs)/bookings' };

    case 'message':
      if (data.conversationId) {
        return {
          pathname: '/messages/[id]',
          params: { id: data.conversationId },
        };
      }
      return { pathname: '/(tabs)/messages' };

    case 'booking_reminder':
      return { pathname: '/(tabs)/bookings' };

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Schedule a local notification (for testing / booking reminders)
// ---------------------------------------------------------------------------

export async function scheduleBookingReminder(
  eventName: string,
  eventDate: Date
): Promise<string | null> {
  try {
    const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminderDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Reminder',
        body: `"${eventName}" is tomorrow. Make sure you're ready!`,
        data: { type: 'booking_reminder', eventName },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return id;
  } catch {
    return null;
  }
}
