import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubscriptionStatus, SiteSettings, Toast, WalletType } from '@/types';

interface AppState {

  wallet: string | null;
  walletType: WalletType | null;
  setWallet: (wallet: string | null, type: WalletType | null) => void;

  subscription: SubscriptionStatus | null;
  setSubscription: (sub: SubscriptionStatus | null) => void;

  settings: SiteSettings | null;
  setSettings: (settings: SiteSettings | null) => void;

  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;

  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;

  selectedMonth: string | null;
  setSelectedMonth: (month: string | null) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({

      wallet: null,
      walletType: null,
      setWallet: (wallet, type) => set({ wallet, walletType: type }),

      subscription: null,
      setSubscription: (subscription) => set({ subscription }),

      settings: null,
      setSettings: (settings) => set({ settings }),

      isAdmin: false,
      setIsAdmin: (isAdmin) => set({ isAdmin }),

      toasts: [],
      addToast: (type, message) => {
        const id = Math.random().toString(36).substring(7);
        set({ toasts: [...get().toasts, { id, type, message }] });
        setTimeout(() => {
          set({ toasts: get().toasts.filter((t) => t.id !== id) });
        }, 5000);
      },
      removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      selectedMonth: null,
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),

      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'hussayn-signal-storage',
      partialize: (state) => ({
        wallet: state.wallet,
        walletType: state.walletType,

        isAdmin: state.isAdmin,
      }),
    }
  )
);
