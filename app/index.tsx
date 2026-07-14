import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

type Role = 'DJ' | 'VENUE';

const ROLE_OPTIONS: Array<{
  role: Role;
  eyebrow: string;
  title: string;
  body: string;
  icon: string;
}> = [
  {
    role: 'DJ',
    eyebrow: 'FOR ARTISTS',
    title: "I'm a DJ",
    body: 'Show your sound, find gigs, and build a reputation that travels.',
    icon: '🎧',
  },
  {
    role: 'VENUE',
    eyebrow: 'FOR BUYERS',
    title: "I'm a Venue",
    body: 'Discover proven talent, compare styles, and book the right energy.',
    icon: '🏟️',
  },
];

export default function WelcomeScreen() {
  const [checkingSession, setCheckingSession] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(28)).current;
  const player = useVideoPlayer(require('../assets/videos/mixmatch-hero.mp4'), (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    AsyncStorage.getItem('auth_user')
      .then((user) => {
        if (user) router.replace('/(tabs)' as never);
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  function chooseRole(role: Role) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({ pathname: '/auth', params: { mode: 'signup', role } });
  }

  if (checkingSession) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsVideoFrameAnalysis={false}
      />
      <LinearGradient
        colors={['rgba(8,5,16,0.18)', 'rgba(8,5,16,0.72)', '#0B0911']}
        locations={[0, 0.42, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={s.brandRow}>
            <View style={s.brandMark}><Text style={s.brandIcon}>M</Text></View>
            <View>
              <Text style={s.brand}>MIX MATCH</Text>
              <Text style={s.brandSub}>WHERE SOUND MEETS THE ROOM</Text>
            </View>
          </View>

          <View style={s.spacer} />

          <View style={s.heroCopy}>
            <View style={s.livePill}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE MUSIC MARKETPLACE</Text>
            </View>
            <Text style={s.title}>Find the right{`\n`}energy.</Text>
            <Text style={s.subtitle}>One platform. Two sides of the booth. Choose how you want to enter.</Text>
          </View>

          <View style={s.roleRow}>
            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.role}
                accessibilityRole="button"
                accessibilityLabel={`${option.title}. ${option.body}`}
                onPress={() => chooseRole(option.role)}
                style={({ pressed }) => [s.roleCard, pressed && s.roleCardPressed]}
              >
                <View style={s.roleTop}>
                  <Text style={s.roleIcon}>{option.icon}</Text>
                  <Text style={s.arrow}>↗</Text>
                </View>
                <Text style={s.eyebrow}>{option.eyebrow}</Text>
                <Text style={s.roleTitle}>{option.title}</Text>
                <Text style={s.roleBody}>{option.body}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.footerRow}>
            <Pressable onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })} hitSlop={10}>
              <Text style={s.loginText}>Already a member? <Text style={s.loginStrong}>Sign in</Text></Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)' as never)} hitSlop={10}>
              <Text style={s.guestText}>Browse DJs →</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#08050F' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#08050F' },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 39, height: 39, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOpacity: 0.55, shadowRadius: 16 },
  brandIcon: { color: '#fff', fontWeight: '900', fontSize: 20, fontStyle: 'italic' },
  brand: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 2.2 },
  brandSub: { color: 'rgba(255,255,255,0.55)', fontSize: 8, fontWeight: '700', letterSpacing: 1.35, marginTop: 2 },
  spacer: { flex: 1, minHeight: 90 },
  heroCopy: { marginBottom: 20 },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: 'rgba(13,9,21,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', marginBottom: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F43F5E' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.25 },
  title: { color: '#fff', fontSize: 46, lineHeight: 47, letterSpacing: -1.7, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.72)', maxWidth: 330, fontSize: 14, lineHeight: 20, marginTop: 10 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, minHeight: 183, padding: 14, borderRadius: 20, backgroundColor: 'rgba(24,19,34,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  roleCardPressed: { transform: [{ scale: 0.975 }], borderColor: Colors.primaryLight, backgroundColor: 'rgba(63,37,94,0.96)' },
  roleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  roleIcon: { fontSize: 24 },
  arrow: { color: Colors.primaryLight, fontSize: 18, fontWeight: '800' },
  eyebrow: { color: Colors.primaryLight, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  roleTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 7 },
  roleBody: { color: 'rgba(255,255,255,0.58)', fontSize: 11, lineHeight: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 17, paddingBottom: 2 },
  loginText: { color: 'rgba(255,255,255,0.58)', fontSize: 12 },
  loginStrong: { color: '#fff', fontWeight: '800' },
  guestText: { color: Colors.primaryLight, fontSize: 12, fontWeight: '800' },
});
