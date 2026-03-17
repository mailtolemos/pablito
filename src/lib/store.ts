import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WalletEntry = {
  id: string;
  address: string;
  chainId: number;
  label: string;
  type: 'evm' | 'solana';
  addedAt: string;
  balances: Record<string, number>;
};

export type UserProfile = {
  id: string;
  displayName: string;
  email?: string;
  avatarColor: string;
  createdAt: string;
};

type WalletStore = {
  wallets: WalletEntry[];
  profile: UserProfile | null;
  addWallet: (w: WalletEntry) => void;
  removeWallet: (id: string) => void;
  updateBalances: (id: string, balances: Record<string, number>) => void;
  updateLabel: (id: string, label: string) => void;
  setProfile: (p: UserProfile) => void;
  clearProfile: () => void;
};

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const AVATAR_COLORS = ['#00E5A0', '#627EEA', '#9945FF', '#FF007A', '#F7931A', '#28A0F0'];

export function createProfile(name: string, email?: string): UserProfile {
  return {
    id: genId(),
    displayName: name,
    email,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    createdAt: new Date().toISOString(),
  };
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallets: [],
      profile: null,

      addWallet: (w) =>
        set((s) => {
          // Allow same address on different chains, but not exact duplicates
          if (s.wallets.find(x =>
            x.address.toLowerCase() === w.address.toLowerCase() &&
            x.chainId === w.chainId
          )) return s;
          return { wallets: [...s.wallets, w] };
        }),

      removeWallet: (id) =>
        set((s) => ({ wallets: s.wallets.filter(w => w.id !== id) })),

      updateBalances: (id, balances) =>
        set((s) => ({
          wallets: s.wallets.map(w =>
            w.id === id ? { ...w, balances: { ...w.balances, ...balances } } : w
          ),
        })),

      updateLabel: (id, label) =>
        set((s) => ({
          wallets: s.wallets.map(w => w.id === id ? { ...w, label } : w),
        })),

      setProfile: (p) => set({ profile: p }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: 'pablito-wallets-v1' }
  )
);
