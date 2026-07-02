import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storefront } from '@/lib/retailTherapy/catalog';

export interface ImpulseOrder {
  id: string;
  storefront: Storefront;
  itemNames: string[];
  emojis: string[];
  total: number; // sale total
  createdAt: string; // ISO datetime
  status: 'active' | 'dissolved';
}

/** Orders quietly dissolve after this many days (or earlier when mood stabilises). */
export const DISSOLVE_AFTER_DAYS = 3;
/** Minimum days between flash-sale triggers. */
export const TRIGGER_COOLDOWN_DAYS = 3;
/** How long a flash sale stays open once triggered. */
export const SALE_DURATION_HOURS = 6;

interface RetailTherapyState {
  orders: ImpulseOrder[];
  /** ISO datetime the current sale ends; null = no active sale. */
  saleEndsAt: string | null;
  saleStorefront: Storefront;
  lastTriggerAt: string | null;

  startSale: (storefront: Storefront) => void;
  endSale: () => void;
  placeOrder: (order: Omit<ImpulseOrder, 'id' | 'createdAt' | 'status'>) => void;
  /** Mark expired (or all, when mood stabilised) active orders as dissolved.
   *  Returns the orders that were dissolved by this call. */
  dissolveOrders: (all?: boolean) => ImpulseOrder[];
}

export const useRetailTherapy = create<RetailTherapyState>()(
  persist(
    (set, get) => ({
      orders: [],
      saleEndsAt: null,
      saleStorefront: 'boutique',
      lastTriggerAt: null,

      startSale: (storefront) =>
        set({
          saleStorefront: storefront,
          saleEndsAt: new Date(Date.now() + SALE_DURATION_HOURS * 3600_000).toISOString(),
          lastTriggerAt: new Date().toISOString(),
        }),

      endSale: () => set({ saleEndsAt: null }),

      placeOrder: (order) =>
        set((s) => ({
          orders: [
            {
              ...order,
              id: `imp-${Date.now()}`,
              createdAt: new Date().toISOString(),
              status: 'active' as const,
            },
            ...s.orders,
          ],
        })),

      dissolveOrders: (all = false) => {
        const cutoff = Date.now() - DISSOLVE_AFTER_DAYS * 86400_000;
        const dissolved: ImpulseOrder[] = [];
        set((s) => ({
          orders: s.orders.map((o) => {
            const expired = new Date(o.createdAt).getTime() < cutoff;
            if (o.status === 'active' && (all || expired)) {
              const d = { ...o, status: 'dissolved' as const };
              dissolved.push(d);
              return d;
            }
            return o;
          }),
        }));
        return dissolved;
      },
    }),
    {
      name: 'cyclealign-retail-therapy',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** True while a triggered sale is still open. */
export function saleIsLive(saleEndsAt: string | null): boolean {
  return !!saleEndsAt && new Date(saleEndsAt).getTime() > Date.now();
}

/** True when enough days have passed since the last trigger. */
export function cooldownOver(lastTriggerAt: string | null): boolean {
  if (!lastTriggerAt) return true;
  return Date.now() - new Date(lastTriggerAt).getTime() >
    TRIGGER_COOLDOWN_DAYS * 86400_000;
}
