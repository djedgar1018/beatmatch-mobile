import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useConversations, type Conversation } from '../../lib/api';
import { getStoredAuthUser } from '../../lib/auth';

function ConversationItem({ conv }: { conv: Conversation }) {
  const initials = (conv.participantName || '??').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const time = conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <TouchableOpacity style={s.item} activeOpacity={0.75} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conv.id } })}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials}</Text>
        {(conv.unreadCount ?? 0) > 0 && (
          <View style={s.badge}><Text style={s.badgeText}>{conv.unreadCount}</Text></View>
        )}
      </View>
      <View style={s.content}>
        <View style={s.topRow}>
          <Text style={[s.name, (conv.unreadCount ?? 0) > 0 && s.nameUnread]} numberOfLines={1}>{conv.participantName}</Text>
          {time ? <Text style={s.time}>{time}</Text> : null}
        </View>
        {conv.lastMessage && (
          <Text style={[s.preview, (conv.unreadCount ?? 0) > 0 && s.previewUnread]} numberOfLines={1}>{conv.lastMessage}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function GuestMessages() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.guestWrap}>
        <Text style={s.guestIcon}>💬</Text>
        <Text style={s.guestTitle}>Messages</Text>
        <Text style={s.guestText}>
          You can learn how messaging works without registering. Private inboxes, conversation history, and sending messages are account-specific and stay protected until you sign in.
        </Text>

        <View style={s.demoCard}>
          <Text style={s.demoLabel}>How messaging works</Text>
          <View style={s.demoBubbleLeft}>
            <Text style={s.demoBubbleText}>Ask a DJ about availability after you choose an event date.</Text>
          </View>
          <View style={s.demoBubbleRight}>
            <Text style={s.demoBubbleTextMine}>Confirm the venue, time, and music preferences in one thread.</Text>
          </View>
          <View style={s.demoNote}>
            <Text style={s.demoNoteText}>Sign in is requested only when opening your private inbox or sending a real message.</Text>
          </View>
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(tabs)' as any)} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Browse DJs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/auth' as any)} activeOpacity={0.85}>
          <Text style={s.secondaryBtnText}>Sign In to View My Inbox</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function MessagesScreen() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { data, isLoading } = useConversations(!!user);
  const convs = data ?? [];

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

  if (!user) return <GuestMessages />;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Messages</Text>
          {convs.length > 0 && <Text style={s.sub}>{convs.length} conversations</Text>}
        </View>

        {isLoading ? (
          <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <FlatList
            data={convs}
            keyExtractor={c => c.id}
            renderItem={({ item }) => <ConversationItem conv={item} />}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            contentContainerStyle={convs.length === 0 ? s.emptyContainer : undefined}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>💬</Text>
                <Text style={s.emptyTitle}>No messages yet</Text>
                <Text style={s.emptySub}>Start a conversation by booking a DJ</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  sub: { fontSize: 13, color: Colors.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.background },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 12, color: Colors.textMuted },
  preview: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  previewUnread: { color: Colors.textSecondary, fontWeight: '500' },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 86 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestIcon: { fontSize: 44, marginBottom: 14 },
  guestTitle: { color: Colors.text, fontSize: 24, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  guestText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  demoCard: { width: '100%', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 22 },
  demoLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  demoBubbleLeft: { maxWidth: '86%', backgroundColor: Colors.surfaceHigh, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
  demoBubbleRight: { maxWidth: '86%', backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  demoBubbleText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 19 },
  demoBubbleTextMine: { color: '#fff', fontSize: 14, lineHeight: 19 },
  demoNote: { backgroundColor: Colors.primaryMuted, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primaryLight + '44' },
  demoNoteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
});
