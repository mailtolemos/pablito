'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, arbitrum, optimism, base, polygon, bsc } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';

// WalletConnect Project ID — get one free at https://cloud.walletconnect.com
// Set NEXT_PUBLIC_WC_PROJECT_ID in your .env.local
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo_project_id';

const metadata = {
  name: 'Pablito',
  description: 'Pablito is checking your bags… Multi-chain portfolio tracker with live Pyth Network price feeds',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://pablito.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [mainnet, arbitrum, optimism, base, polygon, bsc] as const;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,  // WalletConnect QR
  enableInjected: true,        // MetaMask, Rabby, Brave, etc.
  enableEIP6963: true,         // Modern multi-wallet detection
  enableCoinbase: true,        // Coinbase Wallet
});

// Web3Modal — handles ALL EVM wallets including:
// MetaMask, WalletConnect, Rabby, Coinbase, Brave, Rainbow, etc.
export function initWeb3Modal() {
  createWeb3Modal({
    wagmiConfig,
    projectId,
    defaultChain: mainnet,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#00E5A0',
      '--w3m-border-radius-master': '8px',
      '--w3m-font-family': '"Space Mono", monospace',
    },
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    ],
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchInterval: 5_000,
    },
  },
});

export const CHAIN_NAMES: Record<number, string> = {
  1:     'Ethereum',
  10:    'Optimism',
  56:    'BSC',
  137:   'Polygon',
  8453:  'Base',
  42161: 'Arbitrum',
};

export const CHAIN_COLORS: Record<number, string> = {
  1:     '#627EEA',
  10:    '#FF0420',
  56:    '#F3BA2F',
  137:   '#8247E5',
  8453:  '#0052FF',
  42161: '#28A0F0',
};
