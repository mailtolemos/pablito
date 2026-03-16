import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WalletEntry = {
  id: string;
  address: string;
  chainId: number;
  label: string;
  type: 'evm' | 'solana';
  addedAt: string;
  // On-chain balances (keyed by symbol)
  balances: Record<string, number>;
};

type WalletStore = {
  wallets: WalletEntry[];
  addWallet: (w: WalletEntry) => void;
  removeWallet: (id: string) => void;
  updateBalances: (id: string, balances: Record<string, number>) => void;
  updateLabel: (id: string, label: string) => void;
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallets: [],
      addWallet: (w) =>
        set((s) => {
          // Don't add duplicate addresses
          if (s.wallets.find(x => x.address.toLowerCase() === w.address.toLowerCase())) return s;
          return { wallets: [...s.wallets, w] };
        }),
      removeWallet: (id) =>
        set((s) => ({ wallets: s.wallets.filter(w => w.id !== id) })),
      updateBalances: (id, balances) =>
        set((s) => ({
          wallets: s.wallets.map(w => w.id === id ? { ...w, balances } : w),
        })),
      updateLabel: (id, label) =>
        set((s) => ({
          wallets: s.wallets.map(w => w.id === id ? { ...w, label } : w),
        })),
    }),
    { name: 'pablito-wallets-v1' }
  )
);
