import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionPlan = 'monthly' | 'annual';

interface SubscriptionState {
  tier: SubscriptionTier;
  plan: SubscriptionPlan | null;
  expiryDate: string | null; // ISO date
  razorpayPaymentId: string | null;
  activate: (plan: SubscriptionPlan, expiryDate: string | null, paymentId: string | null) => void;
  downgrade: () => void;
  isPremium: () => boolean;
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      plan: null,
      expiryDate: null,
      razorpayPaymentId: null,
      activate: (plan, expiryDate, paymentId) =>
        set({ tier: 'premium', plan, expiryDate, razorpayPaymentId: paymentId }),
      downgrade: () =>
        set({ tier: 'free', plan: null, expiryDate: null, razorpayPaymentId: null }),
      isPremium: () => {
        const s = get();
        if (s.tier !== 'premium') return false;
        if (!s.expiryDate) return false;
        return new Date(s.expiryDate) > new Date();
      },
    }),
    {
      name: 'cyclealign-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        tier: s.tier,
        plan: s.plan,
        expiryDate: s.expiryDate,
        razorpayPaymentId: s.razorpayPaymentId,
      }),
    },
  ),
);
