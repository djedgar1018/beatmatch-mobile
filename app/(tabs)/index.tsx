import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
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
  const { data, isLoading, refetch, isError } = useDJs({
    search: debouncedSearch || undefined,
    genre,
  });

  const djs = data?.djs ?? [];

  function handleSearchChange(text: string) {
    setSearch(text);
    clearTimeout((handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      setDebouncedSearch(text);
    }, 400);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search DJs, locations..."
              placeholderTextColor={Colors.placeholder}
              value={search}
              onChangeText={handleSearchChange}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
                <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Genre filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScroll}
        >
          {GENRES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, selectedGenre === g && styles.chipActive]}
              onPress={() => setSelectedGenre(g)}
            >
              <Text style={[styles.chipText, selectedGenre === g && styles.chipTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* DJ grid */}
        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load DJs</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : djs.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40 }}>🎧</Text>
            <Text style={styles.emptyText}>No DJs found</Text>
            <Text style={styles.emptySubText}>Try a different search or genre</Text>
          </View>
        ) : (
          <FlatList
            data={djs}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => <DJCard dj={item} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  genreScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  grid: { paddingHorizontal: 16, paddingBottom: 24 },
  columnWrapper: { justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubText: { fontSize: 14, color: Colors.textSecondary },
  errorText: { fontSize: 16, color: Colors.error },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
