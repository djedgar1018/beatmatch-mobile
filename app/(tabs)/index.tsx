import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, FlatList,
  TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useDJs } from '../../lib/api';
import { DJCard } from '../../components/DJCard';

const GENRES = ['All', 'Hip-Hop', 'R&B', 'House', 'Techno', 'Pop', 'Afrobeats', 'Latin', 'EDM'];

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const genre = selectedGenre === 'All' ? undefined : selectedGenre;
  const { data, isLoading, refetch, isError } = useDJs({ search: debouncedSearch || undefined, genre });
  const djs = data?.djs ?? [];

  function handleSearchChange(text: string) {
    setSearch(text);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(text), 400);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Discover DJs</Text>
          <Text style={s.headerSub}>{djs.length} DJs available</Text>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search DJs, locations, genres..."
            placeholderTextColor={Colors.textPlaceholder}
            value={search}
            onChangeText={handleSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Genre filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.genreScroll} contentContainerStyle={s.genreContent}>
          {GENRES.map(g => (
            <TouchableOpacity
              key={g}
              style={[s.genreChip, selectedGenre === g && s.genreChipActive]}
              onPress={() => setSelectedGenre(g)}
              activeOpacity={0.75}
            >
              <Text style={[s.genreText, selectedGenre === g && s.genreTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* DJ List */}
        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={s.loadingText}>Finding DJs...</Text>
          </View>
        ) : isError ? (
          <View style={s.center}>
            <Text style={s.errorIcon}>⚠️</Text>
            <Text style={s.errorText}>Failed to load DJs</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
              <Text style={s.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={djs}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <DJCard dj={item} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={djs.length === 0 ? s.emptyContainer : s.listContent}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyIcon}>🎧</Text>
                <Text style={s.emptyTitle}>No DJs Found</Text>
                <Text style={s.emptySub}>Try adjusting your search or genre filter</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  contentPad: { maxWidth: 768, width: '100%', alignSelf: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 2, flexShrink: 1 },
  headerSub: { fontSize: 13, color: Colors.textMuted },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, height: 48 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  clearBtn: { color: Colors.textMuted, fontSize: 14, paddingHorizontal: 4 },
  genreScroll: { maxHeight: 44, marginBottom: 8 },
  genreContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  genreChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  genreChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genreText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  genreTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyContainer: { flex: 1, paddingHorizontal: 16 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});

