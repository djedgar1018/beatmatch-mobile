import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { useIAP, type SubscriptionTier } from '../../lib/iap';

const SUBSCRIPTION_TIERS: {
  name: string;
  tier: SubscriptionTier;
  fallbackPrice: string;
  color: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    name: 'Starter',
    tier: 'starter',
    fallbackPrice: '$29/mo',
    color: Colors.textSecondary,
    features: ['5 booking requests/mo', 'Basic profile', 'Standard support'],
  },
  {
    name: 'Pro',
    tier: 'pro',
    fallbackPrice: '$79/mo',
    color: Colors.primary,
    features: ['Unlimited bookings', 'Featured listing', 'Priority support', 'Analytics'],
    popular: true,
  },
  {
    name: 'Elite',
    tier: 'elite',
    fallbackPrice: '$149/mo',
    color: Colors.gold,
    features: [
      'Everything in Pro',
      'Top placement',
      'Dedicated manager',
      'Custom branding',
      'Early access',
    ],
  },
];

function SettingsRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { subscriptionStatus, purchasing, loading, error, purchase, restore, getProductForTier } =
    useIAP();

  function openWeb() {
    Linking.openURL('https://beat-match-production.up.railway.app');
  }

  async function handlePurchase(tier: SubscriptionTier, tierName: string) {
    if (subscriptionStatus.tier === tier && subscriptionStatus.isActive) {
      Alert.alert('Already Subscribed', `You are currently on the ${tierName} plan.`);
      return;
    }
    Alert.alert(
      `Subscribe to ${tierName}`,
      'Your subscription will auto-renew monthly. You can cancel anytime in your App Store settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => purchase(tier),
        },
      ]
    );
  }

  async function handleRestore() {
    Alert.alert('Restore Purchases', 'Restoring your previous purchases...', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: () =>
          restore().then(() => {
            Alert.alert('Done', 'Your purchases have been restored.');
          }),
      },
    ]);
  }

  if (error) {
    Alert.alert('Store Error', error);
  }

  const currentTierName =
    subscriptionStatus.isActive && subscriptionStatus.tier
      ? SUBSCRIPTION_TIERS.find((t) => t.tier === subscriptionStatus.tier)?.name ?? null
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Current plan banner */}
        {currentTierName && (
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.currentPlanBanner}
          >
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <Text style={styles.currentPlanName}>{currentTierName}</Text>
          </LinearGradient>
        )}

        {/* DJ Subscription section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DJ Subscription Plans</Text>
          <Text style={styles.sectionSub}>Unlock more bookings and visibility</Text>
        </View>

        {SUBSCRIPTION_TIERS.map((tier) => {
          const product = getProductForTier(tier.tier);
          const price = product?.localizedPrice ?? tier.fallbackPrice;
          const isActive =
            subscriptionStatus.isActive && subscriptionStatus.tier === tier.tier;
          const isPurchasing = purchasing;

          return (
            <TouchableOpacity
              key={tier.name}
              style={[
                styles.tierCard,
                tier.popular && styles.tierCardPopular,
                isActive && styles.tierCardActive,
              ]}
              onPress={() => handlePurchase(tier.tier, tier.name)}
              activeOpacity={0.85}
              disabled={isPurchasing || loading}
            >
              {tier.popular && !isActive && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              {isActive && (
                <View style={[styles.popularBadge, { backgroundColor: Colors.success }]}>
                  <Text style={styles.popularText}>Active Plan</Text>
                </View>
              )}
              <View style={styles.tierHeader}>
                <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                <Text style={styles.tierPrice}>{price}/mo</Text>
              </View>
              {tier.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={{ color: tier.color, fontSize: 14 }}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
              <LinearGradient
                colors={
                  tier.name === 'Elite'
                    ? [Colors.gold, '#8B6914']
                    : tier.name === 'Pro'
                    ? [Colors.primary, Colors.primaryDark]
                    : [Colors.surface, Colors.card]
                }
                style={styles.tierBtn}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.tierBtnText,
                      tier.name === 'Starter' &&
                        !isActive && { color: Colors.textSecondary },
                    ]}
                  >
                    {isActive ? '✓ Current Plan' : `Get ${tier.name}`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Restore Purchases */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Legal disclosure — required by Apple */}
        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            Subscriptions automatically renew monthly unless canceled at least 24 hours before the
            end of the current period. Manage or cancel your subscription in your App Store account
            settings. Payment is charged to your Apple ID account at confirmation of purchase.
          </Text>
        </View>

        {/* Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings & Support</Text>
        </View>

        <View style={styles.settingsCard}>
          <SettingsRow icon="🌐" label="Open Web App" onPress={openWeb} />
          <View style={styles.separator} />
          <SettingsRow
            icon="📧"
            label="Contact Support"
            onPress={() => Linking.openURL('mailto:support@mix-match.io')}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="📋"
            label="Terms of Service"
            onPress={() =>
              Linking.openURL('https://beat-match-production.up.railway.app/terms')
            }
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() =>
              Linking.openURL('https://beat-match-production.up.railway.app/privacy')
            }
          />
        </View>

        <Text style={styles.version}>Mix-Match v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  currentPlanBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPlanLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  currentPlanName: { color: '#fff', fontSize: 17, fontWeight: '800' },

  sectionHeader: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  sectionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  tierCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  tierCardPopular: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  tierCardActive: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: { fontSize: 20, fontWeight: '800' },
  tierPrice: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  featureText: { fontSize: 14, color: Colors.textSecondary },
  tierBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  tierBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  restoreText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  legalBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  legalText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  settingsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  rowChevron: { fontSize: 20, color: Colors.textMuted },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: 52 },
  version: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 24,
  },
});
