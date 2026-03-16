'use client';

import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, queryClient, initWeb3Modal } from '@/lib/wagmi';

// Initialize Web3Modal once — must be done before WagmiProvider renders
let initialized = false;

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initialized = true;
      initWeb3Modal();
    }
    setMounted(true);
  }, []);

  // Suppress hydration mismatch by waiting for mount
  if (!mounted) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-bg-0 gap-4">
        <div className="flex items-center gap-2 mb-1">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#00E5A0" opacity="0.9"/>
            <text x="16" y="22" textAnchor="middle" fill="#080A0D" fontSize="18" fontWeight="900" fontFamily="serif" fontStyle="italic">P</text>
          </svg>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, color: '#E2E8F0', letterSpacing: '-0.5px' }}>Pablito</span>
        </div>
        <div className="flex gap-2">
          <div className="ldot" /><div className="ldot" /><div className="ldot" />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569', letterSpacing: '1px' }}>
          Pablito is checking your bags…
        </span>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
