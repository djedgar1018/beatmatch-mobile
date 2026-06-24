import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: Colors.text },
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 2,
          height: 62,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', headerTitle: '🎧 Discover DJs', tabBarIcon: ({ focused }) => <TabIcon emoji="🎧" focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', headerTitle: '📅 My Bookings', tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', headerTitle: '💬 Messages', tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerTitle: '👤 My Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', headerTitle: 'Mix Match', tabBarIcon: ({ focused }) => <TabIcon emoji="⋯" focused={focused} /> }} />
    </Tabs>
  );
}
