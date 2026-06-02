import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../lib/api';

function GenreTag({ genre }: { genre: string }) {
  return (
    <View style={styles.genreTag}>
      <Text style={styles.genreText}>{genre}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          queryClient.clear();
          router.replace('/auth');
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.error }}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDJ = profile.userType === 'DJ' || !!profile.stageName;
  const displayName = isDJ
    ? profile.stageName ?? `${profile.user?.firstName} ${profile.user?.lastName}`
    : `${profile.user?.firstName} ${profile.user?.lastName}`;

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.background]}
          style={styles.hero}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{isDJ ? '🎧 DJ' : '🏟️ Venue'}</Text>
          </View>
        </LinearGradient>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info</Text>
          <InfoRow label="Email" value={profile.user?.email} />
          <InfoRow label="Location" value={profile.location} />
          {isDJ && (
            <>
              <InfoRow label="Hourly Rate" value={profile.hourlyRate ? `$${profile.hourlyRate}/hr` : undefined} />
              <InfoRow label="Experience" value={profile.yearsExperience ? `${profile.yearsExperience} years` : undefined} />
            </>
          )}
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Genres */}
        {isDJ && profile.genres && profile.genres.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreRow}>
              {profile.genres.map((g) => (
                <GenreTag key={g} genre={g} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: `${Colors.primaryLight}60`,
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#fff' },
  displayName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: `${Colors.primary}40`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}80`,
  },
  typeBadgeText: { color: Colors.primaryLight, fontWeight: '700', fontSize: 13 },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  bio: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreTag: {
    backgroundColor: `${Colors.primary}30`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genreText: { color: Colors.primaryLight, fontWeight: '600', fontSize: 13 },
  actions: { marginTop: 24, marginHorizontal: 16 },
  logoutBtn: {
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 16 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
