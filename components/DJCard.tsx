import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import type { DJ } from '../lib/api';

function Avatar({ name, imageUrl }: { name?: string; imageUrl?: string }) {
  const initials = (name || 'DJ')
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={s.avatar}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
      ) : (
        <LinearGradient colors={[Colors.primary, '#C026D3']} style={s.avatarFallback}>
          <Text style={s.avatarText}>{initials}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

export function DJCard({ dj }: { dj: DJ & { djProfile?: any } }) {
  const profile = dj.djProfile || dj;
  const stageName = profile.stageName || dj.stageName || dj.user?.firstName || 'DJ';
  const location = profile.location || dj.location || 'Location available on request';
  const hourlyRate = profile.hourlyRate || dj.hourlyRate;
  const genres: string[] = profile.genres || dj.genres || [];
  const rating = Number(profile.rating || dj.rating || 0);
  const normalizedRating = rating > 5 ? rating / 10 : rating;
  const isFeatured = (dj as any).featuredListing || (dj as any).subscriptionTier === 'premium';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${stageName}'s DJ profile`}
      onPress={() => router.push({ pathname: '/dj/[id]', params: { id: dj.id } })}
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
    >
      <View style={s.topRow}>
        <Avatar name={stageName} imageUrl={profile.profileImageUrl} />
        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>{stageName}</Text>
            {isFeatured && <Text style={s.featured}>FEATURED</Text>}
          </View>
          <Text style={s.location} numberOfLines={1}>⌖ {location}</Text>
          <View style={s.statsRow}>
            <Text style={s.rating}>★ {normalizedRating > 0 ? normalizedRating.toFixed(1) : 'New'}</Text>
            {hourlyRate ? <Text style={s.rate}>From ${hourlyRate}/hr</Text> : <Text style={s.rate}>Request rate</Text>}
          </View>
        </View>
        <View style={s.openCircle}><Text style={s.openArrow}>↗</Text></View>
      </View>

      {profile.bio ? <Text style={s.bio} numberOfLines={2}>{profile.bio}</Text> : null}

      <View style={s.footer}>
        <View style={s.genreRow}>
          {genres.slice(0, 3).map((genre) => (
            <View key={genre} style={s.genreBadge}>
              <Text style={s.genreText}>{genre}</Text>
            </View>
          ))}
          {genres.length > 3 && <Text style={s.moreGenres}>+{genres.length - 3}</Text>}
        </View>
        <Text style={s.viewText}>View profile</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 19, borderWidth: 1, borderColor: Colors.border, padding: 15, overflow: 'hidden' },
  cardPressed: { transform: [{ scale: 0.985 }], borderColor: Colors.primaryLight, backgroundColor: Colors.surfaceHigh },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 68, height: 68, borderRadius: 18, backgroundColor: Colors.surfaceHigh, overflow: 'hidden', flexShrink: 0 },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 0.5 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { flexShrink: 1, color: Colors.text, fontSize: 18, fontWeight: '800' },
  featured: { color: Colors.gold, fontSize: 7, lineHeight: 15, fontWeight: '900', letterSpacing: 0.7, borderWidth: 1, borderColor: Colors.gold + '66', borderRadius: 7, paddingHorizontal: 6 },
  location: { color: Colors.textSecondary, fontSize: 12, marginTop: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  rating: { color: Colors.gold, fontSize: 12, fontWeight: '800' },
  rate: { color: Colors.text, fontSize: 12, fontWeight: '700' },
  openCircle: { width: 31, height: 31, borderRadius: 16, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  openArrow: { color: Colors.primaryLight, fontSize: 15, fontWeight: '900' },
  bio: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 13 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  genreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  genreBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Colors.primaryMuted },
  genreText: { color: Colors.primaryLight, fontSize: 9, fontWeight: '800' },
  moreGenres: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },
  viewText: { color: Colors.text, fontSize: 10, fontWeight: '800', marginLeft: 8 },
});
