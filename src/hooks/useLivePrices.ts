'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import { fetchPythPrices, FEED_IDS, PriceData } from '@/lib/pyth';
import { ALL_PAIRS } from '@/lib/feeds';

export type PriceMap = Record<string, PriceData>;

// Central live price hook — polls Pyth Hermes every 5 seconds
export function useLivePrices() {
  const { data, isPending } = useQuery<PriceMap>({
    queryKey: ['pyth-prices'],
    queryFn: () => fetchPythPrices(ALL_PAIRS),
    refetchInterval: 5_000,
    staleTime: 4_000,
    retry: 3,
    retryDelay: 1_000,
  });

  return { prices: data ?? {}, loading: isPending };
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
