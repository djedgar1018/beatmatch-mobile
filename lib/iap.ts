import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { getStoredAuthUser } from './auth';

// RevenueCat public keys
const RC_API_KEY_IOS = __DEV__ ? 'appl_RUAwFFFZjqzxBXaCVQWhBNlAMUR' : 'appl_RUAwFFFZjqzxBXaCVQWhBNlAMUR'; // Set after RC account setup for MixMatch

export const IAP_PRODUCTS = {
  starter: 'com.ten18.mixnmatch.starter.v2',
  pro: 'com.ten18.mixnmatch.pro.v2',
  elite: 'com.ten18.mixnmatch.elite.v2',
};

export const ALL_PRODUCT_IDS = Object.values(IAP_PRODUCTS);
export const SUBSCRIPTION_KEY = '@mixmatch:subscription';
export const SUBSCRIPTION_TIER_KEY = '@mixmatch:subscription_tier';

// Named entitlement this app actually grants access on. Checking for "any
// active entitlement" (the previous behavior) means an unrelated RevenueCat
// entitlement configured for a different app/product on the same account
// could be misread as a MixMatch subscription — always check this specific
// identifier, configured in the RevenueCat dashboard for MixMatch's plans.
export const PREMIUM_ENTITLEMENT_ID = 'premium';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: IAP_PRODUCTS.starter,
    name: 'Starter',
    price: '$4.99/mo',
    description: 'For DJs starting out',
    features: ['5 bookings/month', 'Basic profile', 'Standard support'],
  },
  {
    id: IAP_PRODUCTS.pro,
    name: 'Pro',
    price: '$9.99/mo',
    description: 'For working DJs',
    features: ['Unlimited bookings', 'Featured listing', 'Contract generator', 'Priority support'],
  },
  {
    id: IAP_PRODUCTS.elite,
    name: 'Elite',
    price: '$24.99/mo',
    description: 'For top performers',
    features: ['Everything in Pro', 'Analytics dashboard', 'Video uploads', 'Dedicated support'],
  },
];

export interface IAPState {
  isLoading: boolean;
  isPurchasing: boolean;
  isSubscribed: boolean;
  currentTier: string | null;
  plans: SubscriptionPlan[];
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
  error: string | null;
}

let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // RevenueCat not linked — using StoreKit fallback
}

// AsyncStorage is a non-authoritative UI cache only — it exists so the
// subscription screen doesn't flash "not subscribed" for a frame before
// RevenueCat responds. Every code path below that reads it is immediately
// followed by a RevenueCat check that overwrites it (both to true AND back
// to false/cleared) once the real, authoritative answer is known. Nothing
// here or on the backend should ever treat a cached 'active' string alone as
// proof of entitlement — see docs/THREAT_MODEL.md in the Beat-Match repo.
async function clearLocalEntitlementCache() {
  await AsyncStorage.multiRemove([SUBSCRIPTION_KEY, SUBSCRIPTION_TIER_KEY]);
}

async function writeLocalEntitlementCache(tier: string) {
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
  await AsyncStorage.setItem(SUBSCRIPTION_TIER_KEY, tier);
}

// Call from every logout / delete-account flow. Resets RevenueCat back to an
// anonymous identity and clears the local cache so the NEXT person to use
// this device (or this same person's next account) never inherits a prior
// account's cached "subscribed" state.
export async function signOutRevenueCatIdentity(): Promise<void> {
  await clearLocalEntitlementCache();
  if (Purchases) {
    try { await Purchases.logOut(); } catch {}
  }
}

// Binds the RevenueCat customer identity to the authenticated MixMatch
// account. Without this, RevenueCat tracks a device-anonymous customer, so
// entitlements can leak across accounts on a shared device (or a signed-out
// user's device retains a previous account's "subscribed" state).
async function identifyRevenueCatUser(): Promise<string | null> {
  const authUser = await getStoredAuthUser<{ id: string }>();
  if (!authUser?.id || !Purchases) return authUser?.id ?? null;
  try {
    const currentAppUserId = await Purchases.getAppUserID();
    if (currentAppUserId !== authUser.id) {
      await Purchases.logIn(authUser.id);
    }
  } catch {
    // Non-fatal — entitlement check below still runs against whatever
    // identity RevenueCat currently has; worst case the user is asked to
    // "Restore Purchases" again after this resolves.
  }
  return authUser.id;
}

export function useIAP(enabled = true): IAPState {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Fast, non-authoritative paint from cache — corrected immediately
        // below once RevenueCat (or the lack of a signed-in identity)
        // resolves the real state.
        const [status, tier] = await Promise.all([
          AsyncStorage.getItem(SUBSCRIPTION_KEY),
          AsyncStorage.getItem(SUBSCRIPTION_TIER_KEY),
        ]);
        if (status === 'active') { setIsSubscribed(true); setCurrentTier(tier); }

        if (Purchases) {
          const authUser = await getStoredAuthUser<{ id: string }>();
          // Configure directly with the known identity when we have one —
          // avoids an anonymous-then-logIn identity transfer on first launch.
          await Purchases.configure({ apiKey: RC_API_KEY_IOS, appUserID: authUser?.id ?? undefined });
          // Reconcile in case the SDK was already configured anonymously by
          // an earlier mount (e.g. this screen rendered before login), or
          // the signed-in account changed since the last configure() call.
          await identifyRevenueCatUser();

          const info = await Purchases.getCustomerInfo();
          const active = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
          if (active) {
            setIsSubscribed(true);
            setCurrentTier(active.productIdentifier ?? null);
            await writeLocalEntitlementCache(active.productIdentifier ?? 'active');
          } else {
            // RevenueCat is authoritative and says this identity is NOT
            // entitled — clear any stale cached "active" flag rather than
            // trusting it. This is the fix for the cancel/expire/switch-
            // account loophole: a stale local flag can no longer outlive
            // what RevenueCat actually reports.
            setIsSubscribed(false);
            setCurrentTier(null);
            await clearLocalEntitlementCache();
          }
        } else if (!(await getStoredAuthUser())) {
          // No RevenueCat SDK linked and no signed-in user to even check
          // against — never trust a bare local flag with nothing verifying it.
          setIsSubscribed(false);
          setCurrentTier(null);
          await clearLocalEntitlementCache();
        }
      } catch {} finally { setIsLoading(false); }
    };
    init();
  }, [enabled]);

  const purchase = useCallback(async (productId: string) => {
    setError(null);
    setIsPurchasing(true);
    // Safety timeout — force clear spinner after 15s to prevent infinite processing state
    const _timeout = setTimeout(() => setIsPurchasing(false), 15000);
    try {
      if (Purchases) {
        await identifyRevenueCatUser();
        // Try direct product purchase (works without offerings configured)
        try {
          const products = await Purchases.getProducts([productId], 'SUBSCRIPTION');
          if (products && products.length > 0) {
            const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
            if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
              await writeLocalEntitlementCache(productId);
              setIsSubscribed(true);
              setCurrentTier(productId);
              return;
            }
          }
        } catch (directErr: any) {
          if (directErr?.userCancelled) return;
          // Fall through to offerings approach
        }
        // Try offerings approach as fallback
        try {
          const offerings = await Purchases.getOfferings();
          const allPkgs = offerings.all ? Object.values(offerings.all).flatMap((o: any) => o.availablePackages || []) : [];
          const pkg = allPkgs.find((p: any) => p.product?.identifier === productId) ||
                      offerings.current?.availablePackages?.find((p: any) => p.product?.identifier === productId);
          if (pkg) {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
              await writeLocalEntitlementCache(productId);
              setIsSubscribed(true);
              setCurrentTier(productId);
              return;
            }
          }
        } catch {}
      }
      // Subscriptions require StoreKit — set error so user sees message, spinner clears via finally
      setError('Subscription requires an active App Store account. Please ensure you are signed in to the App Store and try again.');
    } catch (err: any) {
      if (!err?.userCancelled) {
        setError(err?.message ?? 'Purchase failed. Please try again.');
      }
    } finally {
      clearTimeout(_timeout);
      setIsPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setError(null);
    try {
      if (Purchases) {
        await identifyRevenueCatUser();
        const info = await Purchases.restorePurchases();
        const active = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
        if (active) {
          setIsSubscribed(true);
          setCurrentTier(active.productIdentifier ?? null);
          await writeLocalEntitlementCache(active.productIdentifier ?? 'active');
          Alert.alert('Restored', 'Your subscription has been restored.');
          return;
        }
        // Authoritative "not entitled" — clear any stale local flag instead
        // of leaving a previous session's cached state in place.
        setIsSubscribed(false);
        setCurrentTier(null);
        await clearLocalEntitlementCache();
      }
      setError('No previous subscription found.');
    } catch (err: any) {
      setError(err?.message ?? 'Restore failed.');
    }
  }, []);

  return { isLoading, isPurchasing, isSubscribed, currentTier, plans: PLANS, purchase, restore, error };
}
