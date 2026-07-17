import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors } from '../../constants/colors';
import { useDJ, useUserMedia, type MediaPost } from '../../lib/api';
import { isSignedIn } from '../../lib/auth';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_W - 32 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

function MediaTile({ post, onPress }: { post: MediaPost; onPress: () => void }) {
  const thumb = post.thumbnailUrl || (post.mediaType === 'image' ? post.mediaUrl : undefined);
  return (
    <TouchableOpacity style={styles.mediaTile} onPress={onPress} activeOpacity={0.85}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.mediaTileImage} />
      ) : (
        <View style={[styles.mediaTileImage, styles.mediaTilePlaceholder]}>
          <Text style={{ fontSize: 24 }}>🎬</Text>
        </View>
      )}
      {post.mediaType === 'video' && (
        <View style={styles.mediaTilePlayBadge}>
          <Text style={{ color: '#fff', fontSize: 12 }}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MediaViewerModal({ post, onClose }: { post: MediaPost | null; onClose: () => void }) {
  const player = useVideoPlayer(post?.mediaType === 'video' ? post.mediaUrl : null, (p) => {
    p.loop = false;
    if (post?.mediaType === 'video') p.play();
  });

  if (!post) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerRoot}>
        <Pressable style={styles.viewerBackdrop} onPress={onClose} />
        <SafeAreaView style={styles.viewerContent} edges={['top', 'bottom']}>
          <TouchableOpacity style={styles.viewerClose} onPress={onClose}>
            <Text style={{ color: '#fff', fontSize: 22 }}>✕</Text>
          </TouchableOpacity>
          {post.mediaType === 'video' ? (
            <VideoView
              player={player}
              style={styles.viewerMedia}
              contentFit="contain"
              allowsVideoFrameAnalysis={false}
            />
          ) : (
            <Image source={{ uri: post.mediaUrl }} style={styles.viewerMedia} resizeMode="contain" />
          )}
          {(post.title || post.description) && (
            <View style={styles.viewerInfo}>
              {post.title ? <Text style={styles.viewerTitle}>{post.title}</Text> : null}
              {post.description ? <Text style={styles.viewerDesc}>{post.description}</Text> : null}
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

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
  const { data: mediaPosts } = useUserMedia(userId);
  const [activePost, setActivePost] = useState<MediaPost | null>(null);

  const initials = dj
    ? (dj.stageName || 'DJ')
        .split(' ')
        .map((w: string) => w[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'DJ'
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
                {dj.profileImageUrl ? (
                  <Image source={{ uri: dj.profileImageUrl }} style={styles.heroAvatarGradient} />
                ) : (
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.heroAvatarGradient}
                  >
                    <Text style={styles.heroAvatarText}>{initials}</Text>
                  </LinearGradient>
                )}
              </View>
              <Text style={styles.heroName}>{dj.stageName || 'DJ'}</Text>
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
                <Text style={styles.portfolioTitle}>Browse {dj.stageName || 'DJ'}'s Mixes</Text>
                <Text style={styles.portfolioSub}>Preview & purchase full DJ sets</Text>
              </View>
              <Text style={styles.portfolioChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Video/photo portfolio — real posts from this DJ, viewed in-app */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            {mediaPosts && mediaPosts.length > 0 ? (
              <View style={styles.mediaGrid}>
                {mediaPosts.map((post) => (
                  <MediaTile key={post.id} post={post} onPress={() => setActivePost(post)} />
                ))}
              </View>
            ) : (
              <View style={styles.mediaEmpty}>
                <Text style={{ fontSize: 28 }}>🎬</Text>
                <Text style={styles.mediaEmptyText}>
                  {dj.stageName || 'This DJ'} hasn&apos;t posted any videos or photos yet.
                </Text>
              </View>
            )}
          </View>

          {/* Spacer for CTA */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Book DJ CTA */}
        <View style={styles.ctaContainer}>
          <SafeAreaView edges={['bottom']}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={async () => {
                if (!(await isSignedIn())) {
                  router.push('/auth' as any);
                  return;
                }

                router.push({
                  pathname: '/booking-request',
                  params: { djUserId: dj.userId, djName: dj.stageName || 'DJ', rate: dj.hourlyRate ?? 0 },
                });
              }}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaBtnText}>📅 Book {dj.stageName || 'DJ'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <MediaViewerModal post={activePost} onClose={() => setActivePost(null)} />
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

  // Media grid (video/photo portfolio)
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  mediaTile: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 10, overflow: 'hidden' },
  mediaTileImage: { width: '100%', height: '100%' },
  mediaTilePlaceholder: {
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTilePlayBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmpty: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  mediaEmptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },

  // Media viewer modal
  viewerRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  viewerBackdrop: StyleSheet.absoluteFill,
  viewerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewerClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerMedia: { width: SCREEN_W, height: SCREEN_W * 1.4 },
  viewerInfo: { paddingHorizontal: 24, paddingTop: 16, gap: 4, alignSelf: 'stretch' },
  viewerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  viewerDesc: { color: Colors.textSecondary, fontSize: 14 },

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

