import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Linking } from 'react-native';
import { Colors } from '../../constants/colors';

const BASE_URL = 'https://beat-match-production.up.railway.app';

function MenuItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.menuIconWrap, danger && s.menuIconDanger]}>
        <Text style={s.menuIcon}>{icon}</Text>
      </View>
      <Text style={[s.menuLabel, danger && s.menuLabelDanger]}>{label}</Text>
      <Text style={[s.chevron, danger && { color: Colors.error }]}>›</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

export default function MoreScreen() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('auth_user').then(raw => {
      setUser(raw ? JSON.parse(raw) : null);
    });
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone. All your data, bookings, and profile information will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to delete account
              const token = await AsyncStorage.getItem('api_token');
              if (token) {
                await fetch('https://beat-match-production.up.railway.app/api/auth/delete-account', {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` },
                });
              }
              await AsyncStorage.multiRemove(['auth_user', 'api_token', 'auth_token']);
              queryClient.clear();
              router.replace('/auth');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete account. Please contact support@beatmatch.app');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'auth_user', 'api_token']);
          queryClient.clear();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={s.brandHeader}>
          <View style={s.brandIcon}>
            <Text style={{ fontSize: 28 }}>🎧</Text>
          </View>
          <View>
            <Text style={s.brandName}>Mix Match</Text>
            <Text style={s.brandTag}>The DJ Booking Marketplace</Text>
          </View>
        </View>

        <Section title="Account">
          <MenuItem icon="⭐" label="Subscription Plans" onPress={() => router.push('/subscription' as any)} />
          {user ? (
            <>
              <MenuItem icon="📋" label="My Contracts" onPress={() => router.push('/contracts' as any)} />
              <MenuItem icon="🎵" label="Mix Library" onPress={() => router.push('/library' as any)} />
            </>
          ) : (
            <MenuItem icon="👤" label="Sign In or Create Free Account" onPress={() => router.push('/auth' as any)} />
          )}
        </Section>

        <Section title="Explore">
          <MenuItem icon="🌐" label="Open Web App" onPress={() => Linking.openURL(BASE_URL)} />
        </Section>

        {user && (
          <Section title="Preferences">
            <MenuItem icon="🔔" label="Notification Settings" onPress={() => {}} />
          </Section>
        )}

        <Section title="Legal">
          <MenuItem icon="🔒" label="Privacy Policy" onPress={() => Linking.openURL('https://beat-match-production.up.railway.app/privacy')} />
          <MenuItem icon="📄" label="Terms of Service" onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')} />
          <MenuItem icon="💬" label="Support" onPress={() => Linking.openURL('mailto:support@beatmatch.app')} />
        </Section>

        {user && (
          <Section title="">
            <MenuItem icon="🗑️" label="Delete Account" onPress={handleDeleteAccount} danger />
            <MenuItem icon="🚪" label="Log Out" onPress={handleLogout} danger />
          </Section>
        )}

        <Text style={s.version}>Mix Match v1.0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingBottom: 8 },
  brandIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  brandTag: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIconWrap: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuIconDanger: { backgroundColor: Colors.error + '22' },
  menuIcon: { fontSize: 16 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  menuLabelDanger: { color: Colors.error },
  chevron: { fontSize: 20, color: Colors.textMuted, lineHeight: 22 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, padding: 24 },
});
