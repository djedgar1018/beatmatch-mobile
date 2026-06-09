import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

const C = Colors;

export default function MoreScreen() {
  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/auth' as any);
        }
      }
    ]);
  };

  const rows = [
    { icon: '🌐', label: 'Open Web App', onPress: () => Linking.openURL('https://beat-match-production.up.railway.app') },
    { icon: '⭐', label: 'Subscription Plans', onPress: () => Linking.openURL('https://beat-match-production.up.railway.app/subscription') },
    { icon: '📋', label: 'My Contracts', onPress: () => router.push('/contracts' as any) },
    { icon: '🎵', label: 'My Mix Library', onPress: () => router.push('/library' as any) },
    { icon: '🔔', label: 'Notification Settings', onPress: () => {} },
    { icon: '🔒', label: 'Privacy Policy', onPress: () => Linking.openURL('https://beat-match-production.up.railway.app/privacy') },
    { icon: '📄', label: 'Terms of Service', onPress: () => Linking.openURL('https://beat-match-production.up.railway.app/terms') },
    { icon: '💬', label: 'Support', onPress: () => Linking.openURL('mailto:support@mixmatch.app') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>More</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          {rows.slice(0,2).map(r => (
            <TouchableOpacity key={r.label} style={styles.row} onPress={r.onPress}>
              <Text style={styles.rowIcon}>{r.icon}</Text>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTENT</Text>
          {rows.slice(2,4).map(r => (
            <TouchableOpacity key={r.label} style={styles.row} onPress={r.onPress}>
              <Text style={styles.rowIcon}>{r.icon}</Text>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LEGAL & SUPPORT</Text>
          {rows.slice(4).map(r => (
            <TouchableOpacity key={r.label} style={styles.row} onPress={r.onPress}>
              <Text style={styles.rowIcon}>{r.icon}</Text>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Mix-Match v1.0.0{'\n'}Powered by Beat-Match Platform</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  title: { fontSize: 28, fontWeight: '700', color: C.textPrimary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  section: { marginTop: 24, marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 12, overflow: 'hidden' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.cardBorder },
  rowIcon: { fontSize: 20, width: 32 },
  rowLabel: { flex: 1, fontSize: 15, color: C.textPrimary },
  chevron: { fontSize: 18, color: C.textMuted },
  logoutBtn: { margin: 20, backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: C.textMuted, fontSize: 12, marginBottom: 32 },
});
