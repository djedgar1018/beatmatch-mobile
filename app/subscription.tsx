import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useIAP, type SubscriptionPlan } from '../lib/iap';

function PlanCard({
  plan,
  isActive,
  onPress,
  isPurchasing,
}: {
  plan: SubscriptionPlan;
  isActive: boolean;
  onPress: () => void;
  isPurchasing: boolean;
}) {
  const isPopular = plan.name === 'Pro';

  return (
    <View style={[s.planCard, isActive && s.planCardActive, isPopular && s.planCardPopular]}>
      {isPopular && (
        <View style={s.popularBadge}>
          <Text style={s.popularText}>MOST POPULAR</Text>
        </View>
      )}
      {isActive && (
        <View style={s.activeBadge}>
          <Text style={s.activeText}>✓ CURRENT PLAN</Text>
        </View>
      )}
      <Text style={s.planName}>{plan.name}</Text>
      <Text style={s.planPrice}>{plan.price}</Text>
      <Text style={s.planDesc}>{plan.description}</Text>
      <View style={s.features}>
        {plan.features.map(f => (
          <View key={f} style={s.featureRow}>
            <Text style={s.featureCheck}>✓</Text>
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[s.planBtn, isActive && s.planBtnActive, isPopular && s.planBtnPopular]}
        onPress={onPress}
        disabled={isPurchasing || isActive}
        activeOpacity={0.85}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.planBtnText}>
            {isActive ? 'Current Plan' : `Subscribe — ${plan.price}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function SubscriptionScreen() {
  const { isLoading, isPurchasing, isSubscribed, currentTier, plans, purchase, restore, error } = useIAP();

  const handlePurchase = (plan: SubscriptionPlan) => {
    Alert.alert(
      `Subscribe to ${plan.name}`,
      `${plan.price} billed monthly. Cancel anytime in your Apple ID settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => purchase(plan.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mix Match Pro</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.subtitle}>Unlock your full potential as a DJ</Text>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={s.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <>
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isActive={currentTier === plan.id}
                onPress={() => handlePurchase(plan)}
                isPurchasing={isPurchasing}
              />
            ))}
          </>
        )}

        <TouchableOpacity style={s.restoreBtn} onPress={restore} disabled={isPurchasing}>
          <Text style={s.restoreText}>Restore Previous Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            try { router.back(); } catch {}
            router.replace('/(tabs)' as any);
          }}
          style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}
        >
          <Text style={{ color: '#8B9DB5', fontSize: 15 }}>No thanks, continue browsing for free</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => { const {Linking}=require('react-native'); Linking.openURL('https://beat-match-production.up.railway.app/privacy'); }}
          style={{alignItems:'center', paddingVertical:10, borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.1)', marginTop:8}}>
          <Text style={{color:'#7C3AED', fontSize:14, fontWeight:'600', textDecorationLine:'underline'}}>📄 Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={s.legal}>
          Subscriptions auto-renew monthly unless cancelled at least 24 hours before the end of the current period.
          Manage or cancel subscriptions in your Apple ID account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 17 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  errorBox: { backgroundColor: Colors.error + '22', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.error + '55' },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  planCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16 },
  planCardActive: { borderColor: Colors.primary, borderWidth: 2 },
  planCardPopular: { borderColor: Colors.primaryLight },
  popularBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  activeBadge: { alignSelf: 'flex-start', backgroundColor: Colors.success + '22', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10, borderWidth: 1, borderColor: Colors.success + '55' },
  activeText: { color: Colors.success, fontSize: 11, fontWeight: '800' },
  planName: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  planDesc: { fontSize: 14, color: Colors.textMuted, marginBottom: 16 },
  features: { gap: 8, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { color: Colors.success, fontSize: 14, fontWeight: '700', width: 16 },
  featureText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  planBtn: { backgroundColor: Colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  planBtnActive: { backgroundColor: Colors.success + '22', borderColor: Colors.success },
  planBtnPopular: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  planBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  restoreBtn: { alignItems: 'center', paddingVertical: 16 },
  restoreText: { color: Colors.primary, fontSize: 14 },
  legal: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: 8 },
});







