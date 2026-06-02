import { useEffect, useState, useCallback } from 'react';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  restorePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type SubscriptionProduct,
  type Purchase,
  type PurchaseError,
} from 'expo-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://beat-match-production.up.railway.app';

export const PRODUCT_IDS = {
  starter: 'com.ten18.beatmatch.starter',
  pro: 'com.ten18.beatmatch.pro',
  elite: 'com.ten18.beatmatch.elite',
} as const;

export type SubscriptionTier = keyof typeof PRODUCT_IDS;

export interface SubscriptionStatus {
  tier: SubscriptionTier | null;
  productId: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

const STORAGE_KEY = 'subscription_status';

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tier: null, productId: null, expiresAt: null, isActive: false };
}

async function saveSubscriptionStatus(status: SubscriptionStatus) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

async function validateReceiptWithServer(
  tier: SubscriptionTier,
  receipt: string
): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ tier, appleReceipt: receipt }),
    });
    return res.ok;
  } catch {
    // Network failure — optimistically allow (server will re-validate)
    return true;
  }
}

function productIdToTier(productId: string): SubscriptionTier | null {
  for (const [tier, pid] of Object.entries(PRODUCT_IDS)) {
    if (pid === productId) return tier as SubscriptionTier;
  }
  return null;
}

export function useIAP() {
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    tier: null,
    productId: null,
    expiresAt: null,
    isActive: false,
  });
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize store connection
  useEffect(() => {
    let purchaseUpdateSub: ReturnType<typeof purchaseUpdatedListener> | null = null;
    let purchaseErrorSub: ReturnType<typeof purchaseErrorListener> | null = null;

    async function setup() {
      try {
        await initConnection();
        setConnected(true);

        // Load persisted subscription status
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);

        // Fetch products from StoreKit
        const skus = Object.values(PRODUCT_IDS);
        const subs = await getSubscriptions({ skus });
        setProducts(subs);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to connect to store');
      } finally {
        setLoading(false);
      }

      // Listen for purchase updates
      purchaseUpdateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        const tier = productIdToTier(purchase.productId);
        if (!tier) return;

        const receipt = purchase.transactionReceipt ?? '';
        const valid = await validateReceiptWithServer(tier, receipt);

        if (valid) {
          await finishTransaction({ purchase, isConsumable: false });
          const status: SubscriptionStatus = {
            tier,
            productId: purchase.productId,
            expiresAt: null,
            isActive: true,
          };
          await saveSubscriptionStatus(status);
          setSubscriptionStatus(status);
        }

        setPurchasing(false);
      });

      // Listen for purchase errors
      purchaseErrorSub = purchaseErrorListener((err: PurchaseError) => {
        if (err.code !== 'E_USER_CANCELLED') {
          setError(err.message ?? 'Purchase failed');
        }
        setPurchasing(false);
      });
    }

    setup();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
    };
  }, []);

  const purchase = useCallback(
    async (tier: SubscriptionTier) => {
      if (!connected || purchasing) return;
      setError(null);
      setPurchasing(true);
      try {
        await requestSubscription({
          sku: PRODUCT_IDS[tier],
        } as Parameters<typeof requestSubscription>[0]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Purchase failed');
        setPurchasing(false);
      }
    },
    [connected, purchasing]
  );

  const restore = useCallback(async () => {
    if (!connected) return;
    setError(null);
    setLoading(true);
    try {
      const purchases = await restorePurchases();
      if (purchases && purchases.length > 0) {
        // Use the most recent purchase
        const latest = purchases[purchases.length - 1];
        const tier = productIdToTier(latest.productId);
        if (tier) {
          const status: SubscriptionStatus = {
            tier,
            productId: latest.productId,
            expiresAt: null,
            isActive: true,
          };
          await saveSubscriptionStatus(status);
          setSubscriptionStatus(status);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setLoading(false);
    }
  }, [connected]);

  const getProductForTier = useCallback(
    (tier: SubscriptionTier): SubscriptionProduct | undefined => {
      return products.find((p) => p.productId === PRODUCT_IDS[tier]);
    },
    [products]
  );

  return {
    connected,
    products,
    subscriptionStatus,
    purchasing,
    loading,
    error,
    purchase,
    restore,
    getProductForTier,
  };
}
