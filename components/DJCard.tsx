import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import type { DJ } from '../lib/api';

function Avatar({ name, imageUrl }: { name?: string; imageUrl?: string }) {
  const initials = (name || '??')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
}

function StarRating({ rating }: { rating?: number }) {
  const stars = Math.round(rating ?? 0);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: 14, color: i <= stars ? Colors.gold : Colors.border }}>★</Text>
      ))}
    </View>
  );
}

export function DJCard({ dj }: { dj: DJ & { djProfile?: any } }) {
  const profile = dj.djProfile || dj;
  const stageName = profile.stageName || dj.stageName || dj.user?.firstName || 'DJ';
  const location = profile.location || dj.location;
  const hourlyRate = profile.hourlyRate || dj.hourlyRate;
  const genres: string[] = profile.genres || dj.genres || [];
  const rating = profile.rating || dj.rating;
  const isFeatured = (dj as any).featuredListing || (dj as any).subscriptionTier === 'premium';

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => router.push({ pathname: '/dj/[id]', params: { id: dj.id } })}>
      {isFeatured && (
        <View style={s.featuredBadge}>
          <Text style={s.featuredText}>👑 Featured</Text>
        </View>
      )}

      <View style={s.topRow}>
        <Avatar name={stageName} imageUrl={profile.profileImageUrl} />
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{stageName}</Text>
          {location && (
            <View style={s.metaRow}>
              <Text style={s.metaIcon}>📍</Text>
              <Text style={s.metaText} numberOfLines={1}>{location}</Text>
            </View>
          )}
          {hourlyRate && (
            <View style={s.metaRow}>
              <Text style={s.metaIcon}>💰</Text>
              <Text style={s.metaText}>${hourlyRate}/hr</Text>
            </View>
          )}
        </View>
      </View>

      {genres.length > 0 && (
        <View style={s.genreRow}>
          {genres.slice(0, 4).map(g => (
            <View key={g} style={s.genreBadge}>
              <Text style={s.genreText}>{g}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.footer}>
        <StarRating rating={rating} />
        <View style={s.viewBtn}>
          <Text style={s.viewBtnText}>View Profile →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, overflow: 'hidden' },
  featuredBadge: { backgroundColor: Colors.primaryMuted, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  featuredText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  topRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
  info: { flex: 1, justifyContent: 'center', gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaIcon: { fontSize: 13 },
  metaText: { fontSize: 14, color: Colors.textPrimary || Colors.text, flex: 1, opacity: 0.75 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  genreBadge: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.primaryMuted },
  genreText: { fontSize: 14, color: Colors.primaryLight, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  viewBtn: {},
  viewBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

