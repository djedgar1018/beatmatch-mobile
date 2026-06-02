import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { Colors } from '../../constants/colors';
import { useConversations, type Conversation } from '../../lib/api';

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ConversationRow({ conv }: { conv: Conversation }) {
  const initials = conv.participantName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/messages/${conv.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.name}>{conv.participantName}</Text>
          <Text style={styles.time}>{timeAgo(conv.lastMessageAt)}</Text>
        </View>
        <View style={styles.rowFooter}>
          <Text style={styles.preview} numberOfLines={1}>
            {conv.lastMessage ?? 'No messages yet'}
          </Text>
          {conv.unreadCount ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conv.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: convos = [], isLoading, isError, refetch } = useConversations();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.error }}>Failed to load messages</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {convos.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>💬</Text>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubText}>
            Book a DJ or respond to a booking to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={convos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow conv={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.background,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  rowContent: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  time: { fontSize: 12, color: Colors.textMuted },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
