'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import { fetchPythPrices, FEED_IDS, PriceData } from '@/lib/pyth';
import { ALL_PAIRS } from '@/lib/feeds';

export type PriceMap = Record<string, PriceData>;

// CoinGecko symbol → Pyth feed ID lookup (for merging)
// Only crypto has CoinGecko coverage; stocks/FX/commodities use Pyth only
const SYM_TO_FEED_ID: Record<string, string> = {
  BTC:   FEED_IDS['BTC/USD'],
  ETH:   FEED_IDS['ETH/USD'],
  SOL:   FEED_IDS['SOL/USD'],
  BNB:   FEED_IDS['BNB/USD'],
  ARB:   FEED_IDS['ARB/USD'],
  AVAX:  FEED_IDS['AVAX/USD'],
  LINK:  FEED_IDS['LINK/USD'],
  UNI:   FEED_IDS['UNI/USD'],
  AAVE:  FEED_IDS['AAVE/USD'],
  JTO:   FEED_IDS['JTO/USD'],
  JUP:   FEED_IDS['JUP/USD'],
  WIF:   FEED_IDS['WIF/USD'],
  SUI:   FEED_IDS['SUI/USD'],
  APT:   FEED_IDS['APT/USD'],
  OP:    FEED_IDS['OP/USD'],
  MATIC: FEED_IDS['MATIC/USD'],
};

async function fetchCGPrices(): Promise<PriceMap> {
  const res = await fetch('/api/cg-prices', { cache: 'no-store' });
  if (!res.ok) throw new Error(`CoinGecko proxy ${res.status}`);
  const { prices } = await res.json();
  // Convert CoinGecko response → PriceMap keyed by Pyth feed ID
  const out: PriceMap = {};
  for (const [sym, data] of Object.entries(prices as Record<string, { price: number; change24h: number }>)) {
    const feedId = SYM_TO_FEED_ID[sym];
    if (feedId) {
      out[feedId] = {
        price:       data.price,
        conf:        0,
        ema:         data.price,
        publishTime: Math.floor(Date.now() / 1000),
      };
    }
  }
  return out;
}

// Central live price hook — polls CoinGecko every 15s + Pyth every 5s
// CoinGecko fills crypto prices; Pyth adds stocks, FX, commodities + live updates
export function useLivePrices() {
  // CoinGecko — reliable for crypto, refreshes every 15s (free tier friendly)
  const { data: cgPrices } = useQuery<PriceMap>({
    queryKey: ['cg-prices'],
    queryFn:  fetchCGPrices,
    refetchInterval: 15_000,
    staleTime:       14_000,
    retry: 3,
    retryDelay: 2_000,
  });

  // Pyth — best for stocks/FX/commodities + higher-freq crypto updates
  const { data: pythPrices, isPending: pythPending } = useQuery<PriceMap>({
    queryKey: ['pyth-prices'],
    queryFn:  () => fetchPythPrices(ALL_PAIRS),
    refetchInterval: 5_000,
    staleTime:       4_000,
    retry: 3,
    retryDelay: 1_000,
  });

  // Merge: CoinGecko base + Pyth overrides (Pyth is more precise when available)
  const prices: PriceMap = { ...(cgPrices ?? {}), ...(pythPrices ?? {}) };

  // Consider loading only if BOTH are pending and we have no prices yet
  const loading = pythPending && !cgPrices && Object.keys(prices).length === 0;

  return { prices, loading };
}

// Get price for a single pair (e.g. 'BTC/USD')
export function usePairPrice(pair: string): PriceData | undefined {
  const { prices } = useLivePrices();
  const feedId = FEED_IDS[pair];
  if (!feedId) return undefined;
  return prices[feedId];
}

// Rolling spark history for mini sparklines
export function useSparkHistory(feedId: string, maxLen = 30) {
  const { prices } = useLivePrices();
  const histRef = useRef<number[]>([]);
  const [hist, setHist] = useState<number[]>([]);

  useEffect(() => {
    const p = prices[feedId]?.price;
    if (!p) return;
    histRef.current = [...histRef.current.slice(-(maxLen - 1)), p];
    setHist([...histRef.current]);
  }, [prices, feedId, maxLen]);

  return hist;
}

// Price change direction for flash animation
export function usePriceDirection(pair: string): 'up' | 'down' | null {
  const { prices } = useLivePrices();
  const feedId = FEED_IDS[pair];
  const prevRef = useRef<number | null>(null);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const curr = feedId ? prices[feedId]?.price : null;
    if (curr == null) return;
    if (prevRef.current != null) {
      setDir(curr > prevRef.current ? 'up' : curr < prevRef.current ? 'down' : null);
      const t = setTimeout(() => setDir(null), 800);
      return () => clearTimeout(t);
    }
    prevRef.current = curr;
  }, [prices, feedId]);

  return dir;
}
