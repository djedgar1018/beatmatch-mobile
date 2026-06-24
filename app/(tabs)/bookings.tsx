import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useBookings, type Booking } from '../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  ACCEPTED: '#10B981',
  DECLINED: '#EF4444',
  COMPLETED: '#6B7280',
  CANCELLED: '#6B7280',
};

const FILTERS = ['All', 'Pending', 'Accepted', 'Completed'];

function BookingItem({ booking }: { booking: Booking }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.textMuted;
  const date = booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.eventName} numberOfLines={1}>{booking.eventName}</Text>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{booking.status}</Text>
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
    </View>
  );
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState('All');
  const { data, isLoading } = useBookings();
  const all = data ?? [];

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
});
