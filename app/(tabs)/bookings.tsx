import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useBookings, type Booking } from '../../lib/api';
import { BookingCard } from '../../components/BookingCard';

type BookingTab = 'requests' | 'upcoming';

function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modal.title}>{booking.eventName}</Text>

            <View style={modal.row}>
              <Text style={modal.label}>Date</Text>
              <Text style={modal.value}>{formatDate(booking.eventDate)}</Text>
            </View>
            <View style={modal.row}>
              <Text style={modal.label}>Duration</Text>
              <Text style={modal.value}>{booking.duration} hour(s)</Text>
            </View>
            {booking.proposedRate !== undefined && (
              <View style={modal.row}>
                <Text style={modal.label}>Rate</Text>
                <Text style={modal.value}>${booking.proposedRate}/hr</Text>
              </View>
            )}
            {booking.djProfile?.stageName && (
              <View style={modal.row}>
                <Text style={modal.label}>DJ</Text>
                <Text style={modal.value}>{booking.djProfile.stageName}</Text>
              </View>
            )}
            {booking.description ? (
              <View style={{ marginTop: 12 }}>
                <Text style={modal.label}>Notes</Text>
                <Text style={[modal.value, { marginTop: 6 }]}>{booking.description}</Text>
              </View>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <Text style={modal.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<BookingTab>('requests');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: bookings = [], isLoading, isError, refetch } = useBookings();

  const requests = bookings.filter((b) =>
    ['PENDING', 'DECLINED', 'CANCELLED'].includes(b.status)
  );
  const upcoming = bookings.filter((b) =>
    ['ACCEPTED', 'COMPLETED'].includes(b.status)
  );

  const displayed = activeTab === 'requests' ? requests : upcoming;

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Sub-tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              My Requests
            </Text>
            {requests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load bookings</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayed.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40 }}>📅</Text>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'requests'
                ? 'Request a DJ from the Discover tab'
                : 'Accepted bookings will appear here'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <BookingCard booking={item} onPress={() => setSelected(item)} />
            )}
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

      {selected && (
        <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
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

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  closeBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
