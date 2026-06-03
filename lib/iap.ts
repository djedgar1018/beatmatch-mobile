export type SubscriptionTier = 'starter' | 'pro' | 'elite' | 'free';
// IAP stub - Mix-Match uses reader app model
// Subscriptions are managed on the web platform
// This file is a placeholder for future IAP implementation

export const IAP_PRODUCTS = {
  starter: 'com.ten18.mixmatch.starter',
  pro: 'com.ten18.mixmatch.pro', 
  elite: 'com.ten18.mixmatch.elite',
};

export function useIAP() {
  return {
    products: [],
    isLoading: false,
    purchase: async (productId: string) => {
      // Redirect to web for subscription management
      console.log('IAP not yet implemented - use web platform');
    },
    restore: async () => {},
    currentSubscription: null,
  };
}
