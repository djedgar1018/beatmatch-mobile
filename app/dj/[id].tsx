import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useDJ } from '../../lib/api';

function StarRating({ rating }: { rating?: number }) {
  const stars = Math.round(rating ?? 0);
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 18, color: i <= stars ? Colors.gold : Colors.textMuted }}>
          ★
        </Text>
      ))}
      {rating !== undefined && (
        <Text style={{ color: Colors.textSecondary, fontSize: 14, alignSelf: 'center', marginLeft: 4 }}>
          ({rating.toFixed(1)})
        </Text>
      )}
    </View>
  );
}

function GenreTag({ genre }: { genre: string }) {
  return (
    <View style={styles.genreTag}>
      <Text style={styles.genreText}>{genre}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DJDetailScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const { data: dj, isLoading, isError } = useDJ(userId);

  const initials = dj
    ? dj.stageName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !dj) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.error, fontSize: 16 }}>Failed to load DJ profile</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary, 'transparent']}
              style={styles.heroGradient}
            />
            <SafeAreaView edges={['top']} style={styles.heroSafe}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backIcon}>‹</Text>
              </TouchableOpacity>
            </SafeAreaView>
            <View style={styles.heroContent}>
              <View style={styles.heroAvatar}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.heroAvatarGradient}
                >
                  <Text style={styles.heroAvatarText}>{initials}</Text>
                </LinearGradient>
              </View>
              <Text style={styles.heroName}>{dj.stageName}</Text>
              {dj.location && (
                <Text style={styles.heroLocation}>📍 {dj.location}</Text>
              )}
              <StarRating rating={dj.rating} />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {dj.hourlyRate !== undefined && (
              <StatCard label="Hourly Rate" value={`$${dj.hourlyRate}`} />
            )}
            {dj.yearsExperience !== undefined && (
              <StatCard label="Experience" value={`${dj.yearsExperience} yrs`} />
            )}
            {dj.genres && dj.genres.length > 0 && (
              <StatCard label="Genres" value={String(dj.genres.length)} />
            )}
          </View>

          {/* Bio */}
          {dj.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{dj.bio}</Text>
            </View>
          ) : null}

          {/* Genres */}
          {dj.genres && dj.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genreRow}>
                {dj.genres.map((g) => (
                  <GenreTag key={g} genre={g} />
                ))}
              </View>
            </View>
          )}

          {/* Mix Store */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mix Store</Text>
            <TouchableOpacity
              style={styles.portfolioCard}
              onPress={() =>
                router.push({
                  pathname: '/mixes',
                  params: { djId: dj.userId, djName: dj.stageName },
                })
              }
            >
              <View style={[styles.portfolioThumb, { backgroundColor: `${Colors.gold}20` }]}>
                <Text style={{ fontSize: 28 }}>🎧</Text>
              </View>
              <View style={styles.portfolioInfo}>
                <Text style={styles.portfolioTitle}>Browse {dj.stageName}'s Mixes</Text>
                <Text style={styles.portfolioSub}>Preview & purchase full DJ sets</Text>
              </View>
              <Text style={styles.portfolioChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Portfolio placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <TouchableOpacity
              style={styles.portfolioCard}
              onPress={() =>
                Linking.openURL(`https://beat-match-production.up.railway.app/djs/${userId}`)
              }
            >
              <View style={styles.portfolioThumb}>
                <Text style={{ fontSize: 32 }}>▶</Text>
              </View>
              <View style={styles.portfolioInfo}>
                <Text style={styles.portfolioTitle}>View Full Portfolio</Text>
                <Text style={styles.portfolioSub}>Opens in browser</Text>
              </View>
              <Text style={styles.portfolioChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer for CTA */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Book DJ CTA */}
        <View style={styles.ctaContainer}>
          <SafeAreaView edges={['bottom']}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/booking-request',
                  params: { djUserId: dj.userId, djName: dj.stageName, rate: dj.hourlyRate ?? 0 },
                })
              }
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaBtnText}>📅 Book {dj.stageName}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // Hero
  hero: { position: 'relative', minHeight: 280, justifyContent: 'flex-end' },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  heroSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  backButton: {
    margin: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  heroContent: {
    padding: 24,
    gap: 8,
    zIndex: 1,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: `${Colors.primaryLight}80`,
    marginBottom: 8,
  },
  heroAvatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroLocation: { fontSize: 14, color: Colors.textSecondary },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  bio: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreTag: {
    backgroundColor: `${Colors.primary}30`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genreText: { color: Colors.primaryLight, fontWeight: '600', fontSize: 13 },

  // Portfolio
  portfolioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portfolioThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioInfo: { flex: 1 },
  portfolioTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  portfolioSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  portfolioChevron: { fontSize: 20, color: Colors.textMuted },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
