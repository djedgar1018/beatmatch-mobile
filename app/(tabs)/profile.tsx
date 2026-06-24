import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../lib/api';

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
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
  }

  if (isLoading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
    </SafeAreaView>
  );

  if (isError || !profile) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const isDJ = profile.userType === 'DJ' || !!profile.stageName;
  const displayName = isDJ ? (profile.stageName ?? `${profile.user?.firstName} ${profile.user?.lastName}`) : `${profile.user?.firstName} ${profile.user?.lastName}`;
  const initials = (displayName || '??').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{displayName}</Text>
          {profile.user?.email && <Text style={s.email}>{profile.user.email}</Text>}
          <View style={s.typeBadge}>
            <Text style={s.typeText}>{isDJ ? '🎧 DJ' : '🏟️ Venue'}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Profile Info</Text>
          <View style={s.card}>
            <InfoRow label="Stage Name" value={profile.stageName} />
            <InfoRow label="Location" value={profile.location} />
            <InfoRow label="Hourly Rate" value={profile.hourlyRate ? `$${profile.hourlyRate}/hr` : undefined} />
            <InfoRow label="Experience" value={profile.yearsExperience ? `${profile.yearsExperience} years` : undefined} />
            {profile.bio && (
              <View style={s.bioWrap}>
                <Text style={s.infoLabel}>Bio</Text>
                <Text style={s.bioText}>{profile.bio}</Text>
              </View>
            )}
          </View>
        </View>

        {isDJ && profile.genres && profile.genres.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Genres</Text>
            <View style={s.genreWrap}>
              {profile.genres.map((g: string) => (
                <View key={g} style={s.genreBadge}>
                  <Text style={s.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.section}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 34 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.textMuted, marginBottom: 10 },
  typeBadge: { backgroundColor: Colors.primaryMuted, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primaryLight + '55' },
  typeText: { color: Colors.primaryLight, fontWeight: '700', fontSize: 13 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 },
  bioWrap: { padding: 16 },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: 6 },
  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreBadge: { borderWidth: 1, borderColor: Colors.primaryLight + '55', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primaryMuted },
  genreText: { fontSize: 13, color: Colors.primaryLight, fontWeight: '500' },
  logoutBtn: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.error + '44', padding: 16, alignItems: 'center' },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
});
