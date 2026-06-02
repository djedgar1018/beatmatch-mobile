import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import type { Booking } from '../lib/api';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: 'Pending', color: Colors.warning, bg: Colors.warningBg },
  ACCEPTED: { label: 'Accepted', color: Colors.success, bg: Colors.successBg },
  DECLINED: { label: 'Declined', color: Colors.error, bg: Colors.errorBg },
  COMPLETED: { label: 'Completed', color: Colors.primary, bg: `${Colors.primary}22` },
  CANCELLED: { label: 'Cancelled', color: Colors.error, bg: Colors.errorBg },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: Colors.textSecondary,
    bg: Colors.surface,
  };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const djName = booking.djProfile?.stageName ?? 'DJ';
  const venueName = booking.venue?.name ?? 'Venue';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 20 }}>🎵</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eventName} numberOfLines={1}>
            {booking.eventName}
          </Text>
          <Text style={styles.meta}>
            {booking.djProfile ? djName : venueName}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerItem}>📅 {formatDate(booking.eventDate)}</Text>
        {booking.duration ? (
          <Text style={styles.footerItem}>⏱ {booking.duration}h</Text>
        ) : null}
        {booking.proposedRate ? (
          <Text style={styles.footerItem}>💰 ${booking.proposedRate}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  eventName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 12,
  },
  footerItem: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
