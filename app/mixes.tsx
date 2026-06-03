import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '../constants/colors';

const C = Colors;

interface Mix {
  id: string;
  title: string;
  genre?: string;
  price: number;
  duration?: number;
  coverImageUrl?: string;
  description?: string;
}

export default function MixesScreen() {
  const { djId } = useLocalSearchParams<{ djId: string }>();
  
  const { data: mixes = [], isLoading } = useQuery<Mix[]>({
    queryKey: ['mixes', djId],
    queryFn: async () => { const r = await fetch(`https://beat-match-production.up.railway.app/api/mixes/dj/${djId}`,{credentials:'include'}); return r.json(); },
    enabled: !!djId,
  });

  const handleBuy = (mix: Mix) => {
    Linking.openURL(`https://beat-match-production.up.railway.app/dj/${djId}`);
  };

  if (isLoading) return (
    <View style={styles.loading}>
      <ActivityIndicator color={C.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mix Store</Text>
      {mixes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>No Mixes Yet</Text>
          <Text style={styles.emptyText}>This DJ hasn't listed any mixes for sale.</Text>
        </View>
      ) : (
        <FlatList
          data={mixes}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: mix }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.mixTitle}>{mix.title}</Text>
                {mix.genre && <Text style={styles.genre}>{mix.genre}</Text>}
                {mix.description && <Text style={styles.desc} numberOfLines={2}>{mix.description}</Text>}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.price}>${(mix.price / 100).toFixed(2)}</Text>
                <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(mix)}>
                  <Text style={styles.buyText}>Buy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
  title: { fontSize: 28, fontWeight: '700', color: C.textPrimary, padding: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
  emptyText: { color: C.textSecondary, textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  cardInfo: { flex: 1 },
  mixTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginBottom: 4 },
  genre: { fontSize: 13, color: C.primary, marginBottom: 4 },
  desc: { fontSize: 13, color: C.textSecondary },
  cardRight: { alignItems: 'flex-end', marginLeft: 12 },
  price: { fontSize: 18, fontWeight: '700', color: C.gold, marginBottom: 8 },
  buyBtn: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  buyText: { color: '#fff', fontWeight: '600' },
});
