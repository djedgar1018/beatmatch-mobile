import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

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
        const [status, tier] = await Promise.all([
          AsyncStorage.getItem(SUBSCRIPTION_KEY),
          AsyncStorage.getItem(SUBSCRIPTION_TIER_KEY),
        ]);
        if (status === 'active') { setIsSubscribed(true); setCurrentTier(tier); }
        if (Purchases) {
          await Purchases.configure({ apiKey: RC_API_KEY_IOS });
          const info = await Purchases.getCustomerInfo();
          if (Object.keys(info.entitlements.active).length > 0) {
            setIsSubscribed(true);
            await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
          }
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
        // Try direct product purchase (works without offerings configured)
        try {
          const products = await Purchases.getProducts([productId], 'SUBSCRIPTION');
          if (products && products.length > 0) {
            const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
            if (customerInfo.entitlements.active['premium'] || Object.keys(customerInfo.entitlements.active).length > 0) {
              await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
              await AsyncStorage.setItem(SUBSCRIPTION_TIER_KEY, productId);
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
            if (customerInfo.entitlements.active['premium'] || Object.keys(customerInfo.entitlements.active).length > 0) {
              await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
              await AsyncStorage.setItem(SUBSCRIPTION_TIER_KEY, productId);
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
        const info = await Purchases.restorePurchases();
        if (Object.keys(info.entitlements.active).length > 0) {
          setIsSubscribed(true);
          await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'active');
          Alert.alert('Restored', 'Your subscription has been restored.');
          return;
        }
      }
      setError('No previous subscription found.');
    } catch (err: any) {
      setError(err?.message ?? 'Restore failed.');
    }
  }, []);

  return { isLoading, isPurchasing, isSubscribed, currentTier, plans: PLANS, purchase, restore, error };
}




