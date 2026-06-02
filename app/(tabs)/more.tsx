import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const SUBSCRIPTION_TIERS = [
  {
    name: 'Starter',
    price: '$29/mo',
    color: Colors.textSecondary,
    features: ['5 booking requests/mo', 'Basic profile', 'Standard support'],
  },
  {
    name: 'Pro',
    price: '$79/mo',
    color: Colors.primary,
    features: ['Unlimited bookings', 'Featured listing', 'Priority support', 'Analytics'],
    popular: true,
  },
  {
    name: 'Elite',
    price: '$149/mo',
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
  function openWeb() {
    Linking.openURL('https://beat-match-production.up.railway.app');
  }

  function handleSubscription(tier: string) {
    Alert.alert(
      'Upgrade to ' + tier,
      'DJ subscriptions are managed through in-app purchase. Feature coming soon!',
      [{ text: 'OK' }]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* DJ Subscription section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DJ Subscription Plans</Text>
          <Text style={styles.sectionSub}>Unlock more bookings and visibility</Text>
        </View>

        {SUBSCRIPTION_TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.name}
            style={[styles.tierCard, tier.popular && styles.tierCardPopular]}
            onPress={() => handleSubscription(tier.name)}
            activeOpacity={0.85}
          >
            {tier.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={styles.tierPrice}>{tier.price}</Text>
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
              <Text
                style={[
                  styles.tierBtnText,
                  tier.name === 'Starter' && { color: Colors.textSecondary },
                ]}
              >
                {tier.name === 'Starter' ? 'Current Plan' : `Get ${tier.name}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

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
            onPress={() => Linking.openURL('mailto:support@beatmatch.io')}
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

        <Text style={styles.version}>Beatmatch v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
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
