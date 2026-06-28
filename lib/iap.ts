import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useIAP as useExpoIAP } from 'expo-iap';
import type { Purchase } from 'expo-iap';

// Product IDs — must match App Store Connect exactly
export const IAP_PRODUCTS = {
  starter: 'com.ten18.mixnmatch.starter.v2',
  pro: 'com.ten18.mixnmatch.pro.v2',
  elite: 'com.ten18.mixnmatch.elite.v2',
};

export const ALL_PRODUCT_IDS = Object.values(IAP_PRODUCTS);

export const SUBSCRIPTION_KEY = '@mixmatch:subscription';
export const SUBSCRIPTION_TIER_KEY = '@mixmatch:subscription_tier';

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
    price: '$5/mo',
    description: 'For DJs starting out',
    features: ['5 bookings/month', 'Basic profile', 'Standard support'],
  },
  {
    id: IAP_PRODUCTS.pro,
    name: 'Pro',
    price: '$10/mo',
    description: 'For working DJs',
    features: ['Unlimited bookings', 'Featured listing', 'Contract generator', 'Priority support'],
  },
  {
    id: IAP_PRODUCTS.elite,
    name: 'Elite',
    price: '$25/mo',
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

export function useIAP(): IAPState {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Restore subscription state on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SUBSCRIPTION_KEY),
      AsyncStorage.getItem(SUBSCRIPTION_TIER_KEY),
    ]).then(([status, tier]) => {
      if (status === 'active') {
        setIsSubscribed(true);
        setCurrentTier(tier);
      }
    }).catch(() => {});
  }, []);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    restorePurchases,
    finishTransaction,
    hasActiveSubscriptions,
  } = useExpoIAP({
    onPurchaseSuccess: async (p: Purchase) => {
      try {
        await finishTransaction({ purchase: p, isConsumable: false });
      } catch {
        // Already finished
      }
      setIsSubscribed(true);
      const tier = p.productId || null;
      setCurrentTier(tier);
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
      if (tier) await AsyncStorage.setItem(SUBSCRIPTION_TIER_KEY, tier);
      setIsPurchasing(false);
    },
    onPurchaseError: (err) => {
      const code = err.code as string;
      if (code !== 'user-cancelled' && code !== 'E_USER_CANCELLED') {
        const msg =
          code === 'not-prepared' || code === 'E_NOT_PREPARED'
            ? 'Store unavailable. Please try again.'
            : code === 'network-error' || code === 'E_NETWORK_ERROR'
            ? 'Network error. Check your connection.'
            : 'Unable to complete purchase. Please try again.';
        setError(msg);
      }
      setIsPurchasing(false);
    },
  });

  // Fetch products + check active subscriptions when connected
  useEffect(() => {
    if (!connected) return;
    const init = async () => {
      setIsFetching(true);
      try {
        await fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'subs' });
        const active = await hasActiveSubscriptions(ALL_PRODUCT_IDS);
        if (active) setIsSubscribed(true);
      } catch {
        // Store unavailable in sandbox/simulator
      } finally {
        setIsFetching(false);
      }
    };
    init();
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const purchase = useCallback(async (productId: string) => {
    if (!connected) {
      setError('Store not available. Please try again later.');
      return;
    }
    setError(null);
    setIsPurchasing(true);
    try {
      await requestPurchase({
        type: 'subs',
        request: Platform.OS === 'ios'
          ? { apple: { sku: productId } }
          : { google: { skus: [productId] } },
      });
    } catch (err: any) {
      if (err?.code !== 'user-cancelled') {
        setError(err?.message ?? 'Purchase failed. Please try again.');
      }
      setIsPurchasing(false);
    }
  }, [connected, requestPurchase]);

  const restore = useCallback(async () => {
    if (!connected) {
      setError('Store not available. Please try again later.');
      return;
    }
    setError(null);
    setIsFetching(true);
    try {
      await restorePurchases();
      const active = await hasActiveSubscriptions(ALL_PRODUCT_IDS);
      if (active) {
        setIsSubscribed(true);
        await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
      } else {
        setError('No previous subscription found for this Apple ID.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Restore failed. Please try again.');
    } finally {
      setIsFetching(false);
    }
  }, [connected, restorePurchases, hasActiveSubscriptions]);

  return {
    isLoading: isFetching && !isPurchasing,
    isPurchasing,
    isSubscribed,
    currentTier,
    plans: PLANS,
    purchase,
    restore,
    error,
  };
}
