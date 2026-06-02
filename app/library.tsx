import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LibraryMix {
  id: string;
  title: string;
  uri: string;
  duration?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function getDownloadedMixes(): Promise<LibraryMix[]> {
  const dir = FileSystem.documentDirectory;
  if (!dir) return [];
  try {
    const entries = await FileSystem.readDirectoryAsync(dir);
    const mixes: LibraryMix[] = entries
      .filter((f) => f.startsWith('mix_') && f.endsWith('.mp3'))
      .map((filename) => {
        const id = filename.replace('mix_', '').replace('.mp3', '');
        return { id, title: `Mix ${id}`, uri: `${dir}${filename}` };
      });
    return mixes;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Audio Player Component
// ---------------------------------------------------------------------------

function AudioPlayer({ uri, title }: { uri: string; title: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const isPlaying = status?.isLoaded && status.isPlaying;
  const positionMs = status?.isLoaded ? (status.positionMillis ?? 0) : 0;
  const durationMs = status?.isLoaded ? (status.durationMillis ?? 0) : 0;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  useEffect(() => {
    let mounted = true;
    async function loadSound() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((s) => {
          if (mounted) setStatus(s);
        });
      } catch {
        Alert.alert('Playback Error', 'Could not load the audio file.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSound();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
    };
  }, [uri]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [isPlaying]);

  const seek = useCallback(
    async (ratio: number) => {
      if (!soundRef.current || !durationMs) return;
      await soundRef.current.setPositionAsync(Math.floor(ratio * durationMs));
    },
    [durationMs]
  );

  const skipBack = useCallback(async () => {
    if (!soundRef.current) return;
    const newPos = Math.max(0, positionMs - 15_000);
    await soundRef.current.setPositionAsync(newPos);
  }, [positionMs]);

  const skipForward = useCallback(async () => {
    if (!soundRef.current || !durationMs) return;
    const newPos = Math.min(durationMs, positionMs + 15_000);
    await soundRef.current.setPositionAsync(newPos);
  }, [positionMs, durationMs]);

  if (loading) {
    return (
      <View style={playerStyles.loadingBox}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Loading audio...</Text>
      </View>
    );
  }

  return (
    <View style={playerStyles.player}>
      {/* Title */}
      <Text style={playerStyles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Scrubber */}
      <TouchableOpacity
        style={playerStyles.scrubberTrack}
        onPress={(e) => {
          const { locationX, nativeEvent } = e;
          // Use width from layout to compute ratio
          seek(locationX / nativeEvent.pageX);
        }}
        activeOpacity={1}
      >
        <View style={[playerStyles.scrubberFill, { width: `${Math.round(progress * 100)}%` }]} />
        <View
          style={[playerStyles.scrubberThumb, { left: `${Math.round(progress * 100)}%` as unknown as number }]}
        />
      </TouchableOpacity>

      {/* Time labels */}
      <View style={playerStyles.timeRow}>
        <Text style={playerStyles.timeLabel}>{formatTime(positionMs)}</Text>
        <Text style={playerStyles.timeLabel}>{durationMs > 0 ? formatTime(durationMs) : '--:--'}</Text>
      </View>

      {/* Controls */}
      <View style={playerStyles.controls}>
        <TouchableOpacity style={playerStyles.controlBtn} onPress={skipBack} activeOpacity={0.7}>
          <Text style={playerStyles.controlIcon}>⏮</Text>
          <Text style={playerStyles.controlLabel}>−15s</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={playerStyles.playBtn}>
            <Text style={playerStyles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={playerStyles.controlBtn} onPress={skipForward} activeOpacity={0.7}>
          <Text style={playerStyles.controlIcon}>⏭</Text>
          <Text style={playerStyles.controlLabel}>+15s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const playerStyles = StyleSheet.create({
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  player: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scrubberTrack: {
    height: 6,
    backgroundColor: Colors.elevated,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    marginLeft: -8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: { fontSize: 12, color: Colors.textMuted },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlBtn: { alignItems: 'center', gap: 2 },
  controlIcon: { fontSize: 24, color: Colors.textPrimary },
  controlLabel: { fontSize: 10, color: Colors.textMuted },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 28, color: '#fff' },
});

// ---------------------------------------------------------------------------
// Library row item
// ---------------------------------------------------------------------------

function LibraryRow({
  mix,
  onPress,
}: {
  mix: LibraryMix;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.libraryRow} onPress={onPress} activeOpacity={0.75}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.rowThumb}>
        <Text style={{ fontSize: 20 }}>🎵</Text>
      </LinearGradient>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {mix.title}
        </Text>
        <Text style={styles.rowSub}>Downloaded • Tap to play</Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LibraryScreen() {
  // Opened directly as full-screen player from mixes.tsx
  const params = useLocalSearchParams<{ mixId?: string; title?: string; uri?: string }>();

  const [mixes, setMixes] = useState<LibraryMix[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [selectedMix, setSelectedMix] = useState<LibraryMix | null>(null);

  useEffect(() => {
    // If we were passed a specific mix to play, auto-select it
    if (params.uri && params.mixId) {
      const mix: LibraryMix = {
        id: params.mixId,
        title: params.title ?? `Mix ${params.mixId}`,
        uri: params.uri,
      };
      setSelectedMix(mix);
    }

    getDownloadedMixes().then((downloaded) => {
      setMixes(downloaded);
      setLoadingLibrary(false);
    });
  }, [params.uri, params.mixId, params.title]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Library',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {/* Inline player if a mix is selected */}
        {selectedMix && (
          <>
            <LinearGradient
              colors={['#0a0a0a', Colors.surface]}
              style={styles.playerHeader}
            >
              <Text style={styles.playerHeaderLabel}>Now Playing</Text>
            </LinearGradient>
            <AudioPlayer uri={selectedMix.uri} title={selectedMix.title} />
            <View style={styles.divider} />
          </>
        )}

        {/* Library list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Downloaded Mixes</Text>
        </View>

        {loadingLibrary ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : mixes.length === 0 && !selectedMix ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No mixes downloaded yet</Text>
            <Text style={styles.emptySubtitle}>
              Visit a DJ's Mix Store to purchase and download mixes.
            </Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.back()}>
              <Text style={styles.browseBtnText}>Browse DJs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={mixes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <LibraryRow mix={item} onPress={() => setSelectedMix(item)} />
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  playerHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  playerHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 8 },

  sectionHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },

  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowChevron: { fontSize: 20, color: Colors.textMuted },

  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
