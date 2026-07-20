import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useBooking, useBalanceStatus, useSendBalanceInvoice } from '../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  ACCEPTED: '#10B981',
  DECLINED: '#EF4444',
  COUNTER_OFFERED: '#F59E0B',
  COMPLETED: '#6B7280',
  CANCELLED: '#6B7280',
};

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError } = useBooking(id);
  const statusKey = (booking?.status || '').toUpperCase();
  const depositPaid = !!booking?.isPaid;
  const balancePaid = !!booking?.balancePaid;
  const { data: balance, isLoading: balanceLoading } = useBalanceStatus(id, depositPaid && !balancePaid);
  const sendInvoice = useSendBalanceInvoice(id);
  const [lastSentUrl, setLastSentUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={{ color: Colors.error, fontSize: 16, marginBottom: 16 }}>Failed to load booking</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const date = booking.eventDate
    ? new Date(booking.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD';
  const statusColor = STATUS_COLORS[statusKey] ?? Colors.textMuted;
  const rate = booking.finalRate || booking.proposedRate;
  const canSendInvoice = depositPaid && !balancePaid;

  const handleSendInvoice = () => {
    sendInvoice.mutate(undefined, {
      onSuccess: (data) => {
        setLastSentUrl(data.url);
        Alert.alert('Invoice sent', `Balance invoice with a working payment link was emailed to ${data.clientEmail}.`);
      },
      onError: (err: any) => {
        Alert.alert('Could not send invoice', err?.message || 'Something went wrong. Try again.');
      },
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backIconBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{booking.eventName}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.statusRow}>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
            <Text style={[s.statusText, { color: statusColor }]}>{statusKey || 'UNKNOWN'}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Row icon="📅" label="Event Date" value={date} />
          <Row icon="⏱️" label="Duration" value={`${booking.duration} hours`} />
          {rate ? <Row icon="💰" label="Rate" value={`$${rate}/hr`} /> : null}
          {(booking.eventDescription || booking.description) ? (
            <Row icon="📝" label="Details" value={booking.eventDescription || booking.description || ''} />
          ) : null}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Payment</Text>
          <Row icon={depositPaid ? '✅' : '⏳'} label="Deposit" value={depositPaid ? 'Paid' : 'Not paid yet'} />
          {depositPaid && (
            <Row
              icon={balancePaid ? '✅' : '⏳'}
              label="Balance"
              value={
                balancePaid
                  ? 'Paid'
                  : balanceLoading
                  ? 'Loading…'
                  : balance
                  ? `$${(balance.balanceDue / 100).toFixed(2)} due`
                  : '—'
              }
            />
          )}
        </View>

        {canSendInvoice && (
          <TouchableOpacity
            style={[s.primaryBtn, sendInvoice.isPending && s.primaryBtnDisabled]}
            onPress={handleSendInvoice}
            disabled={sendInvoice.isPending}
            activeOpacity={0.85}
          >
            {sendInvoice.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Send Balance Invoice</Text>
            )}
          </TouchableOpacity>
        )}

        {lastSentUrl && (
          <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(lastSentUrl)}>
            <Text style={s.linkBtnText}>Open payment link</Text>
          </TouchableOpacity>
        )}

        {statusKey !== 'COMPLETED' && (
          <Text style={s.hint}>
            {depositPaid
              ? 'The balance invoice sends automatically when this booking is marked completed — or send it manually above any time after the deposit is paid.'
              : 'Balance invoice becomes available once the deposit is paid.'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backIconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: Colors.text, marginTop: -2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.text },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  statusRow: { flexDirection: 'row' },
  statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: -2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowIcon: { fontSize: 16, width: 22 },
  rowLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  rowValue: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  hint: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, textAlign: 'center' },
});
