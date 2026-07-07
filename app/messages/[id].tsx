import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { useMessages, useSendMessage, type Message } from '../../lib/api';

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function ChatBubble({ message, myId }: { message: Message; myId: string }) {
  const isMine = message.senderId === myId;
  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
          {message.content}
        </Text>
      </View>
      <Text style={styles.bubbleTime}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

export default function MessageThreadScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const [myId, setMyId] = useState<string>('');
  const [authChecked, setAuthChecked] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: messages = [], isLoading } = useMessages(conversationId, !!myId);
  const { mutateAsync: sendMessage, isPending } = useSendMessage();

  useEffect(() => {
    AsyncStorage.getItem('auth_user').then((raw) => {
      if (raw) {
        try {
          setMyId(JSON.parse(raw).id);
        } catch {}
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content || isPending) return;
    setText('');
    try {
      await sendMessage({ conversationId, content });
      listRef.current?.scrollToEnd({ animated: true });
    } catch {}
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Messages' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          {!authChecked ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : !myId ? (
            <View style={styles.centerPadded}>
              <Text style={{ fontSize: 32 }}>💬</Text>
              <Text style={styles.emptyText}>Messages</Text>
              <Text style={styles.emptySubText}>Sign in to view or send private messages.</Text>
              <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth' as any)}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ fontSize: 32 }}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>Say hello!</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => <ChatBubble message={item} myId={myId} />}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.placeholder}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || isPending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendIcon}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  centerPadded: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySubText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  signInBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 12 },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  bubbleRow: {
    alignItems: 'flex-start',
    gap: 4,
  },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: Colors.textSecondary },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: Colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#fff', fontSize: 16, marginLeft: 2 },
});
