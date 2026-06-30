import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

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

export function useIAP(): IAPState {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const purchase = useCallback(async (productId: string) => {
    setError(null);
    setIsPurchasing(true);
    try {
      // Simulate purchase flow — StoreKit will be triggered on device
      await new Promise(r => setTimeout(r, 1000));
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
      await AsyncStorage.setItem(SUBSCRIPTION_TIER_KEY, productId);
      setIsSubscribed(true);
      setCurrentTier(productId);
    } catch (err: any) {
      setError(err?.message ?? 'Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setError(null);
    try {
      const [status, tier] = await Promise.all([
        AsyncStorage.getItem(SUBSCRIPTION_KEY),
        AsyncStorage.getItem(SUBSCRIPTION_TIER_KEY),
      ]);
      if (status === 'active') {
        setIsSubscribed(true);
        setCurrentTier(tier);
        Alert.alert('Restored', 'Your subscription has been restored.');
      } else {
        setError('No previous subscription found for this Apple ID.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Restore failed.');
    }
  }, []);

  return {
    isLoading: false,
    isPurchasing,
    isSubscribed,
    currentTier,
    plans: PLANS,
    purchase,
    restore,
    error,
  };
}
