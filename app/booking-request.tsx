import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { useCreateBooking } from '../lib/api';

const DURATIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function DurationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationRow}>
      {DURATIONS.map((d) => (
        <TouchableOpacity
          key={d}
          style={[styles.durationBtn, value === d && styles.durationBtnActive]}
          onPress={() => onChange(d)}
        >
          <Text style={[styles.durationText, value === d && styles.durationTextActive]}>
            {d}h
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Simple date picker using text input for cross-platform compatibility
function SimpleDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TextInput
      style={styles.input}
      placeholder="YYYY-MM-DD (e.g. 2026-08-15)"
      placeholderTextColor={Colors.placeholder}
      value={value}
      onChangeText={onChange}
      keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
      autoCorrect={false}
    />
  );
}

function Confetti() {
  return (
    <View style={styles.confettiContainer}>
      {['🎉', '🎊', '✨', '🎶', '🎧'].map((e, i) => (
        <Text key={i} style={[styles.confettiEmoji, { top: 40 + i * 60, left: 20 + i * 60 }]}>
          {e}
        </Text>
      ))}
    </View>
  );
}

export default function BookingRequestScreen() {
  const params = useLocalSearchParams<{ djUserId: string; djName: string; rate: string }>();
  const { djUserId, djName, rate } = params;

  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(3);
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const proposedRate = rate ? Number(rate) : undefined;

  async function handleSubmit() {
    // Check if user is logged in before attempting booking
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const authUser = await AsyncStorage.getItem('auth_user');
    if (!authUser) {
      Alert.alert(
        'Sign in Required',
        'You need to create an account or sign in to book a DJ.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    if (!eventName.trim()) {
      Alert.alert('Missing info', 'Please enter an event name.');
      return;
    }
    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Please enter a date in YYYY-MM-DD format.');
      return;
    }
    if (!djUserId) {
      Alert.alert('Error', 'No DJ selected.');
      return;
    }

    try {
      await createBooking({
        djUserId,
        eventName: eventName.trim(),
        eventDate: new Date(date).toISOString(),
        duration,
        description: description.trim() || undefined,
        proposedRate,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Please try again.';
      if (errMsg.includes('Unauthorized') || errMsg.includes('401')) {
        Alert.alert('Sign in Required', 'Please sign in to book a DJ.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]);
      } else {
        Alert.alert('Booking failed', errMsg);
      }
    }
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Confetti />
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>Booking Sent!</Text>
        <Text style={styles.successSub}>
          Your booking request has been sent to {djName ?? 'the DJ'}. You will be notified when they respond.
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => {
            router.replace('/(tabs)/bookings');
          }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.successBtnGrad}>
            <Text style={styles.successBtnText}>View My Bookings</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book DJ</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* DJ info */}
        {djName ? (
          <View style={styles.djBanner}>
            <View style={styles.djAvatar}>
              <Text style={styles.djAvatarText}>
                {djName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={styles.djLabel}>Booking</Text>
              <Text style={styles.djName}>{djName}</Text>
            </View>
            {proposedRate !== undefined && (
              <View style={styles.rateChip}>
                <Text style={styles.rateText}>${proposedRate}/hr</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Event name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Event Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Birthday Party, Club Night..."
            placeholderTextColor={Colors.placeholder}
            value={eventName}
            onChangeText={setEventName}
            autoCapitalize="words"
          />
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Event Date *</Text>
          <SimpleDatePicker value={date} onChange={setDate} />
        </View>

        {/* Duration */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Duration: {duration} hour{duration > 1 ? 's' : ''}</Text>
          <DurationPicker value={duration} onChange={setDuration} />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event, venue size, music preferences..."
            placeholderTextColor={Colors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Rate summary */}
        {proposedRate !== undefined && (
          <View style={styles.rateSummary}>
            <View style={styles.rateSummaryRow}>
              <Text style={styles.rateSummaryLabel}>DJ Rate</Text>
              <Text style={styles.rateSummaryValue}>${proposedRate}/hr</Text>
            </View>
            <View style={styles.rateSummaryRow}>
              <Text style={styles.rateSummaryLabel}>Duration</Text>
              <Text style={styles.rateSummaryValue}>{duration}h</Text>
            </View>
            <View style={[styles.rateSummaryRow, styles.rateSummaryTotal]}>
              <Text style={styles.rateSummaryTotalLabel}>Estimated Total</Text>
              <Text style={styles.rateSummaryTotalValue}>
                ${proposedRate * duration}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Payment is handled directly with the DJ outside the app. Booking requests are free.
        </Text>
      </ScrollView>

      {/* Submit CTA */}
      <SafeAreaView edges={['bottom']} style={styles.ctaSafe}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.ctaBtn}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>Send Booking Request</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: Colors.textSecondary, fontSize: 16 },

  scroll: { padding: 16, gap: 20, paddingBottom: 24 },

  djBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  djAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  djAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  djLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  djName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  rateChip: {
    marginLeft: 'auto',
    backgroundColor: `${Colors.primary}30`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rateText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 14 },

  durationRow: { gap: 8, paddingVertical: 4 },
  durationBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  durationTextActive: { color: '#fff' },

  rateSummary: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  rateSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateSummaryLabel: { fontSize: 14, color: Colors.textSecondary },
  rateSummaryValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  rateSummaryTotal: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: 2,
  },
  rateSummaryTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  rateSummaryTotalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },

  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  ctaSafe: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  ctaWrapper: { borderRadius: 14, overflow: 'hidden' },
  ctaBtn: { paddingVertical: 16, alignItems: 'center' },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Success
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  confettiContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  confettiEmoji: { position: 'absolute', fontSize: 28, opacity: 0.6 },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  successSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  successBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  successBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  successBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
});

