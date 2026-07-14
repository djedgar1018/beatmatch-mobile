import { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, FlatList,
  Pressable, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useDJs } from '../../lib/api';
import { DJCard } from '../../components/DJCard';

const GENRES = ['All', 'Hip-Hop', 'R&B', 'House', 'Techno', 'Pop', 'Afrobeats', 'Latin', 'EDM', 'Amapiano', 'Reggae', 'Disco', 'Drum & Bass'];

function LiveHero() {
  const player = useVideoPlayer(require('../../assets/videos/live-session.mp4'), (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  return (
    <View style={s.hero}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsVideoFrameAnalysis={false}
      />
      <LinearGradient colors={['rgba(10,7,16,0.12)', 'rgba(10,7,16,0.92)']} style={StyleSheet.absoluteFill} />
      <View style={s.heroTop}>
        <View style={s.livePill}><View style={s.liveDot} /><Text style={s.liveLabel}>THE MIX IS LIVE</Text></View>
        <View style={s.soundPill}><Text style={s.soundText}>Muted preview</Text></View>
      </View>
      <View style={s.heroBottom}>
        <Text style={s.heroTitle}>Book the moment,{`\n`}not just the music.</Text>
        <Text style={s.heroBody}>Watch the energy. Find your sound. Lock in the DJ who fits the room.</Text>
        <View style={s.heroActions}>
          <Pressable style={s.primaryAction} onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup', role: 'VENUE' } })}>
            <Text style={s.primaryActionText}>Book as a Venue</Text>
          </Pressable>
          <Pressable style={s.secondaryAction} onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup', role: 'DJ' } })}>
            <Text style={s.secondaryActionText}>Join as a DJ</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const genre = selectedGenre === 'All' ? undefined : selectedGenre;
  const { data, isLoading, refetch, isError } = useDJs({ search: debouncedSearch || undefined, genre });
  const djs = data?.djs ?? [];

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(text), 400);
  }

  function selectGenre(value: string) {
    Haptics.selectionAsync().catch(() => {});
    setSelectedGenre(value);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const listHeader = (
    <>
      <LiveHero />
      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionEyebrow}>CURATED FOR YOUR EVENT</Text>
          <Text style={s.sectionTitle}>Discover DJs</Text>
        </View>
        <Text style={s.resultCount}>{djs.length} available</Text>
      </View>
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search sound, city, or DJ..."
          placeholderTextColor={Colors.textPlaceholder}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }} hitSlop={8}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.genreSection}>
        <Text style={s.genreLabel}>BROWSE BY GENRE</Text>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.genreContent}
          style={s.genreScroll}
        >
          {GENRES.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedGenre === value }}
              style={({ pressed }) => [s.genreChip, selectedGenre === value && s.genreChipActive, pressed && s.genreChipPressed]}
              onPress={() => selectGenre(value)}
            >
              <Text style={[s.genreText, selectedGenre === value && s.genreTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={s.listIntro}>
        <Text style={s.listTitle}>{selectedGenre === 'All' ? 'Talent worth hearing' : `${selectedGenre} specialists`}</Text>
        <Text style={s.listSub}>Tap a profile to see rates, mixes, and booking details.</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <FlatList
        data={isLoading || isError ? [] : djs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DJCard dj={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={s.center}>
              <ActivityIndicator color={Colors.primaryLight} size="large" />
              <Text style={s.loadingText}>Matching the right sound...</Text>
            </View>
          ) : isError ? (
            <View style={s.center}>
              <Text style={s.emptyIcon}>⚠️</Text>
              <Text style={s.emptyTitle}>The booth went quiet</Text>
              <Text style={s.emptySub}>We could not load DJs right now.</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
                <Text style={s.retryText}>Reconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.center}>
              <Text style={s.emptyIcon}>🎛️</Text>
              <Text style={s.emptyTitle}>No exact matches yet</Text>
              <Text style={s.emptySub}>Try another genre or clear your search.</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 18 }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 12, paddingHorizontal: 16 },
  hero: { height: 360, marginHorizontal: -16, marginBottom: 24, overflow: 'hidden', backgroundColor: '#0B0911' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, backgroundColor: 'rgba(9,6,15,0.74)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 11, paddingVertical: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.rose },
  liveLabel: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1.2 },
  soundPill: { borderRadius: 20, backgroundColor: 'rgba(9,6,15,0.62)', paddingHorizontal: 10, paddingVertical: 7 },
  soundText: { color: 'rgba(255,255,255,0.64)', fontSize: 9, fontWeight: '700' },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  heroTitle: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '900', letterSpacing: -0.8 },
  heroBody: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginTop: 8, maxWidth: 330 },
  heroActions: { flexDirection: 'row', gap: 9, marginTop: 15 },
  primaryAction: { flex: 1.2, minHeight: 45, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  secondaryAction: { flex: 1, minHeight: 45, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  secondaryActionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  sectionEyebrow: { color: Colors.primaryLight, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  sectionTitle: { color: Colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.7 },
  resultCount: { color: Colors.textSecondary, fontSize: 11, marginBottom: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 15, paddingHorizontal: 14, minHeight: 52 },
  searchIcon: { color: Colors.primaryLight, fontSize: 25, lineHeight: 25, marginRight: 9, transform: [{ rotate: '-15deg' }] },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, minHeight: 50 },
  clearBtn: { color: Colors.textMuted, fontSize: 14, paddingHorizontal: 4 },
  genreSection: { marginHorizontal: -16, marginBottom: 22 },
  genreLabel: { paddingHorizontal: 16, color: Colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.25, marginBottom: 10 },
  genreScroll: { flexGrow: 0 },
  genreContent: { paddingHorizontal: 16, paddingRight: 30, gap: 9, alignItems: 'center' },
  genreChip: { minHeight: 44, paddingHorizontal: 18, borderRadius: 23, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  genreChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight, shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 10 },
  genreChipPressed: { transform: [{ scale: 0.96 }] },
  genreText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, flexShrink: 0 },
  genreTextActive: { color: '#fff' },
  listIntro: { marginBottom: 14 },
  listTitle: { color: Colors.text, fontSize: 19, fontWeight: '800' },
  listSub: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  center: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  emptyIcon: { fontSize: 43 },
  emptyTitle: { color: Colors.text, fontSize: 19, fontWeight: '800' },
  emptySub: { color: Colors.textMuted, textAlign: 'center', fontSize: 13 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 11, marginTop: 5 },
  retryText: { color: '#fff', fontWeight: '800' },
});
