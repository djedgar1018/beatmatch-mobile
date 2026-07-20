import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useBookings, type Booking } from '../../lib/api';
import { getStoredAuthUser } from '../../lib/auth';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  ACCEPTED: '#10B981',
  DECLINED: '#EF4444',
  COMPLETED: '#6B7280',
  CANCELLED: '#6B7280',
};

const FILTERS = ['All', 'Pending', 'Accepted', 'Completed'];

function BookingItem({ booking }: { booking: Booking }) {
  // Server status is lowercase ('completed', not 'COMPLETED') — normalize
  // so this lookup actually matches instead of silently falling through to
  // the muted default color for every booking.
  const statusColor = STATUS_COLORS[booking.status?.toUpperCase()] ?? Colors.textMuted;
  const date = booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/booking/${booking.id}` as any)} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <Text style={s.eventName} numberOfLines={1}>{booking.eventName}</Text>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{booking.status?.toUpperCase()}</Text>
        </View>
      </View>
      <View style={s.cardMeta}>
        <View style={s.metaRow}>
          <Text style={s.metaIcon}>📅</Text>
          <Text style={s.metaText}>{date}</Text>
        </View>
        {booking.djProfile?.stageName && (
          <View style={s.metaRow}>
            <Text style={s.metaIcon}>🎧</Text>
            <Text style={s.metaText}>{booking.djProfile.stageName}</Text>
          </View>
        )}
        {booking.proposedRate && (
          <View style={s.metaRow}>
            <Text style={s.metaIcon}>💰</Text>
            <Text style={s.metaText}>${booking.proposedRate}/hr</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Step({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepIconWrap}><Text style={s.stepIcon}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

function GuestBookings() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.guestWrap} showsVerticalScrollIndicator={false}>
        <Text style={s.guestIcon}>📅</Text>
        <Text style={s.guestTitle}>Booking on Mix Match</Text>
        <Text style={s.guestText}>
          You can browse how bookings work without creating an account. Accounts are only needed when you send a real booking request or view your private booking history.
        </Text>

        <View style={s.infoCard}>
          <Step icon="1" title="Browse DJs freely" body="Search by location, genre, rate, experience, and profile details as a guest." />
          <Step icon="2" title="Preview booking details" body="Open a DJ profile and review rates, estimated totals, and event details before signing in." />
          <Step icon="3" title="Sign in only to send" body="Creating, confirming, or managing actual bookings is account-specific and requires login." />
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(tabs)' as any)} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Browse DJs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/auth' as any)} activeOpacity={0.85}>
          <Text style={s.secondaryBtnText}>Sign In to View My Bookings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState('All');
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { data, isLoading } = useBookings(!!user);
  const all = data ?? [];

  useEffect(() => {
    getStoredAuthUser().then(storedUser => {
      setUser(storedUser);
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
    </SafeAreaView>
  );

  if (!user) return <GuestBookings />;

  const filtered = filter === 'All'
    ? all
    : all.filter(b => b.status.toLowerCase() === filter.toLowerCase());

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>My Bookings</Text>
          <Text style={s.sub}>{all.length} total</Text>
        </View>

        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={b => b.id}
            renderItem={({ item }) => <BookingItem booking={item} />}
            contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📅</Text>
                <Text style={s.emptyTitle}>No bookings yet</Text>
                <Text style={s.emptySub}>Bookings will appear here once created</Text>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  sub: { fontSize: 13, color: Colors.textMuted },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eventName: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 12 },
  statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardMeta: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon: { fontSize: 13, width: 18 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  guestWrap: { padding: 24, alignItems: 'center' },
  guestIcon: { fontSize: 44, marginTop: 16, marginBottom: 14 },
  guestTitle: { color: Colors.text, fontSize: 24, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  guestText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  infoCard: { width: '100%', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 16, marginBottom: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primaryLight + '55' },
  stepIcon: { color: Colors.primaryLight, fontWeight: '800' },
  stepTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  stepBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
});
