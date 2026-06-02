import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/colors';

const BASE_URL = 'https://beat-match-production.up.railway.app';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Mix {
  id: string;
  title: string;
  genre: string;
  duration: number; // seconds
  price: number;
  coverArt?: string;
  previewUrl?: string;
  downloadUrl?: string;
  djName?: string;
}

// ---------------------------------------------------------------------------
// Download state per mix
// ---------------------------------------------------------------------------

interface DownloadState {
  progress: number; // 0–1
  localUri: string | null;
  downloading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function localUri(mixId: string): string {
  return `${FileSystem.documentDirectory}mix_${mixId}.mp3`;
}

async function isDownloaded(mixId: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(localUri(mixId));
    return info.exists;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Mix card
// ---------------------------------------------------------------------------

function MixCard({
  mix,
  onPreview,
  onBuy,
  onPlay,
  isPreviewing,
  downloadState,
}: {
  mix: Mix;
  onPreview: () => void;
  onBuy: () => void;
  onPlay: () => void;
  isPreviewing: boolean;
  downloadState: DownloadState;
}) {
  const downloaded = downloadState.localUri !== null;

  return (
    <View style={styles.card}>
      {/* Cover art */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.coverArt}
      >
        <Text style={styles.coverArtIcon}>🎵</Text>
      </LinearGradient>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.mixTitle} numberOfLines={1}>
          {mix.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.genreTag}>
            <Text style={styles.genreText}>{mix.genre}</Text>
          </View>
          <Text style={styles.duration}>{formatDuration(mix.duration)}</Text>
        </View>
        <Text style={styles.price}>${mix.price.toFixed(2)}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Preview */}
          <TouchableOpacity
            style={[styles.previewBtn, isPreviewing && styles.previewBtnActive]}
            onPress={onPreview}
            activeOpacity={0.75}
          >
            <Text style={styles.previewBtnText}>{isPreviewing ? '■ Stop' : '▶ Preview'}</Text>
          </TouchableOpacity>

          {/* Buy / Download / Play */}
          {downloaded ? (
            <TouchableOpacity style={styles.playBtn} onPress={onPlay} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.success, '#16a34a']} style={styles.actionGradient}>
                <Text style={styles.actionBtnText}>▶ Play</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : downloadState.downloading ? (
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { width: `${Math.round(downloadState.progress * 100)}%` }]}
              />
              <Text style={styles.progressLabel}>
                {Math.round(downloadState.progress * 100)}%
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.buyBtn} onPress={onBuy} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.actionGradient}
              >
                <Text style={styles.actionBtnText}>Buy & Download</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MixStoreScreen() {
  const { djId, djName } = useLocalSearchParams<{ djId: string; djName?: string }>();

  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio preview state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Download states
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});

  // ---------------------------------------------------------------------------
  // Fetch mixes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function fetchMixes() {
      try {
        const res = await fetch(`${BASE_URL}/api/mixes?djId=${djId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Mix[] = await res.json();
        setMixes(data);

        // Check which mixes are already downloaded
        const states: Record<string, DownloadState> = {};
        await Promise.all(
          data.map(async (mix) => {
            const exists = await isDownloaded(mix.id);
            states[mix.id] = {
              progress: exists ? 1 : 0,
              localUri: exists ? localUri(mix.id) : null,
              downloading: false,
            };
          })
        );
        setDownloadStates(states);
      } catch {
        // Show demo mixes if API unavailable
        const demos: Mix[] = [
          {
            id: 'demo1',
            title: 'Late Night Vibes',
            genre: 'House',
            duration: 3600,
            price: 9.99,
            previewUrl: undefined,
            downloadUrl: undefined,
          },
          {
            id: 'demo2',
            title: 'Afro Fusion Vol. 2',
            genre: 'Afrobeats',
            duration: 4200,
            price: 12.99,
          },
          {
            id: 'demo3',
            title: 'Hip-Hop Essentials',
            genre: 'Hip-Hop',
            duration: 3000,
            price: 7.99,
          },
        ];
        setMixes(demos);
        const states: Record<string, DownloadState> = {};
        demos.forEach((m) => {
          states[m.id] = { progress: 0, localUri: null, downloading: false };
        });
        setDownloadStates(states);
      } finally {
        setLoading(false);
      }
    }
    fetchMixes();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [djId]);

  // ---------------------------------------------------------------------------
  // Preview (30-second clip)
  // ---------------------------------------------------------------------------

  const handlePreview = useCallback(
    async (mix: Mix) => {
      if (!mix.previewUrl) {
        Alert.alert('No Preview', 'No preview clip is available for this mix.');
        return;
      }

      if (previewingId === mix.id) {
        // Stop preview
        await soundRef.current?.stopAsync();
        await soundRef.current?.unloadAsync();
        soundRef.current = null;
        setPreviewingId(null);
        return;
      }

      // Stop any existing preview
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: mix.previewUrl },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setPreviewingId(mix.id);

        // Auto-stop after 30 seconds
        setTimeout(async () => {
          await sound.stopAsync();
          await sound.unloadAsync();
          if (soundRef.current === sound) {
            soundRef.current = null;
            setPreviewingId(null);
          }
        }, 30_000);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            soundRef.current = null;
            setPreviewingId(null);
          }
        });
      } catch {
        Alert.alert('Preview Error', 'Could not load the preview clip.');
        setPreviewingId(null);
      }
    },
    [previewingId]
  );

  // ---------------------------------------------------------------------------
  // Buy & Download (reader app exemption — pay on web, download in app)
  // ---------------------------------------------------------------------------

  const handleBuy = useCallback(async (mix: Mix) => {
    // Open Stripe checkout in external browser (reader app exemption)
    const checkoutUrl = `${BASE_URL}/checkout/mix/${mix.id}`;
    const supported = await Linking.canOpenURL(checkoutUrl);

    if (!supported) {
      Alert.alert('Error', 'Unable to open checkout.');
      return;
    }

    Alert.alert(
      'Purchase Mix',
      `You will be taken to our secure checkout to purchase "${mix.title}" for $${mix.price.toFixed(2)}. After payment, return to the app to download.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Checkout',
          onPress: async () => {
            await Linking.openURL(checkoutUrl);
            // After returning from checkout, offer to download
            setTimeout(() => {
              Alert.alert(
                'Purchase Complete?',
                'If you completed your purchase, tap Download to save the mix to your device.',
                [
                  { text: 'Not Yet', style: 'cancel' },
                  {
                    text: 'Download',
                    onPress: () => startDownload(mix),
                  },
                ]
              );
            }, 2000);
          },
        },
      ]
    );
  }, []);

  const startDownload = useCallback(async (mix: Mix) => {
    if (!mix.downloadUrl) {
      Alert.alert('Download Error', 'No download URL available for this mix.');
      return;
    }

    const dest = localUri(mix.id);

    setDownloadStates((prev) => ({
      ...prev,
      [mix.id]: { ...prev[mix.id], downloading: true, progress: 0 },
    }));

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        mix.downloadUrl,
        dest,
        {},
        (progress) => {
          const ratio =
            progress.totalBytesExpectedToWrite > 0
              ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
              : 0;
          setDownloadStates((prev) => ({
            ...prev,
            [mix.id]: { ...prev[mix.id], progress: ratio },
          }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      const finalUri = result?.uri ?? dest;

      setDownloadStates((prev) => ({
        ...prev,
        [mix.id]: { progress: 1, localUri: finalUri, downloading: false },
      }));
    } catch {
      setDownloadStates((prev) => ({
        ...prev,
        [mix.id]: { ...prev[mix.id], downloading: false, progress: 0 },
      }));
      Alert.alert('Download Failed', 'Could not download the mix. Please try again.');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Play downloaded mix
  // ---------------------------------------------------------------------------

  const handlePlay = useCallback(
    (mix: Mix) => {
      const uri = downloadStates[mix.id]?.localUri;
      if (!uri) return;
      router.push({ pathname: '/library', params: { mixId: mix.id, title: mix.title, uri } });
    },
    [downloadStates]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Stack.Screen
        options={{
          title: djName ? `${djName}'s Mix Store` : 'Mix Store',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: Colors.error }}>{error}</Text>
          </View>
        ) : mixes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🎧</Text>
            <Text style={styles.emptyText}>No mixes available yet.</Text>
          </View>
        ) : (
          <FlatList
            data={mixes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MixCard
                mix={item}
                onPreview={() => handlePreview(item)}
                onBuy={() => handleBuy(item)}
                onPlay={() => handlePlay(item)}
                isPreviewing={previewingId === item.id}
                downloadState={
                  downloadStates[item.id] ?? { progress: 0, localUri: null, downloading: false }
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  list: { padding: 16, gap: 16 },

  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  coverArt: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverArtIcon: { fontSize: 32 },

  cardInfo: { flex: 1, padding: 14, gap: 6 },
  mixTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genreTag: {
    backgroundColor: `${Colors.primary}30`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  genreText: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600' },
  duration: { fontSize: 12, color: Colors.textMuted },

  price: { fontSize: 15, fontWeight: '700', color: Colors.gold },

  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },

  previewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  previewBtnText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },

  buyBtn: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  playBtn: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  actionGradient: { paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  progressContainer: {
    flex: 1,
    height: 34,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBar: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },
  progressLabel: {
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    zIndex: 1,
  },
});
