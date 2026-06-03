import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const C = Colors;

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Mix Library</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🎧</Text>
        <Text style={styles.emptyTitle}>No Downloads Yet</Text>
        <Text style={styles.emptyText}>Purchase mixes from DJ profiles to build your library.</Text>
        <TouchableOpacity 
          style={styles.btn}
          onPress={() => Linking.openURL('https://beat-match-production.up.railway.app')}
        >
          <Text style={styles.btnText}>Browse DJs</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  title: { fontSize: 28, fontWeight: '700', color: C.textPrimary, padding: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: C.textSecondary, textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
