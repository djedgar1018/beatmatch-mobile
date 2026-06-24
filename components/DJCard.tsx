import { TouchableOpacity, View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import type { DJ } from '../lib/api';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

function StarRating({ rating }: { rating?: number }) {
  const stars = Math.round(rating ?? 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 10, color: i <= stars ? Colors.gold : Colors.textMuted }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function Avatar({ name, imageUrl }: { name?: string; imageUrl?: string }) {
  const initials = (name || "??")
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.avatar}
    >
      <Text style={styles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

interface DJCardProps {
  dj: DJ;
}

export function DJCard({ dj }: DJCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/dj/${dj.userId}`)}
      activeOpacity={0.85}
    >
      <Avatar name={dj.stageName || dj.user?.firstName || "DJ"} imageUrl={dj.profileImageUrl} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {dj.stageName || dj.user?.firstName || "DJ"}
        </Text>
        {dj.location ? (
          <Text style={styles.location} numberOfLines={1}>
            📍 {dj.location}
          </Text>
        ) : null}
        {dj.rating !== undefined && <StarRating rating={dj.rating} />}
        {dj.hourlyRate !== undefined && (
          <Text style={styles.rate}>${dj.hourlyRate}/hr</Text>
        )}
        {dj.genres && dj.genres.length > 0 && (
          <View style={styles.genres}>
            {dj.genres.slice(0, 2).map((g) => (
              <View key={g} style={styles.genreTag}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  info: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  genreTag: {
    backgroundColor: `${Colors.primary}30`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  genreText: {
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
