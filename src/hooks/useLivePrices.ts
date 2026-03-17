'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import { fetchPythPrices, FEED_IDS, PriceData } from '@/lib/pyth';
import { ALL_PAIRS } from '@/lib/feeds';

export type PriceMap = Record<string, PriceData>;

// ─── CoinGecko → feed ID mapping (crypto only) ───────────────────────────────
const CG_SYM_TO_FEED_ID: Record<string, string> = {
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

// ─── Yahoo Finance → feed ID mapping (stocks, FX, commodities, ETFs) ─────────
const YAHOO_PAIR_TO_FEED_ID: Record<string, string> = {
  'AAPL/USD':  FEED_IDS['AAPL/USD'],
  'NVDA/USD':  FEED_IDS['NVDA/USD'],
  'TSLA/USD':  FEED_IDS['TSLA/USD'],
  'MSFT/USD':  FEED_IDS['MSFT/USD'],
  'GOOGL/USD': FEED_IDS['GOOGL/USD'],
  'AMZN/USD':  FEED_IDS['AMZN/USD'],
  'COIN/USD':  FEED_IDS['COIN/USD'],
  'SPY/USD':   FEED_IDS['SPY/USD'],
  'QQQ/USD':   FEED_IDS['QQQ/USD'],
  'EUR/USD':   FEED_IDS['EUR/USD'],
  'GBP/USD':   FEED_IDS['GBP/USD'],
  'XAU/USD':   FEED_IDS['XAU/USD'],
  'XAG/USD':   FEED_IDS['XAG/USD'],
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchCGPrices(): Promise<PriceMap> {
  const res = await fetch('/api/cg-prices', { cache: 'no-store' });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const { prices } = await res.json();
  const out: PriceMap = {};
  for (const [sym, data] of Object.entries(prices as Record<string, { price: number }>)) {
    const feedId = CG_SYM_TO_FEED_ID[sym];
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

async function fetchStockPrices(): Promise<PriceMap> {
  const res = await fetch('/api/stock-prices', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const { prices } = await res.json();
  const out: PriceMap = {};
  for (const [pair, data] of Object.entries(prices as Record<string, { price: number }>)) {
    const feedId = YAHOO_PAIR_TO_FEED_ID[pair];
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

// ─── Main hook ────────────────────────────────────────────────────────────────
// Three sources, merged:
//   1. CoinGecko  — reliable crypto prices (refreshes every 15s)
//   2. Yahoo      — stocks, ETFs, FX, commodities (refreshes every 30s)
//   3. Pyth       — high-frequency override for everything (refreshes every 5s)
//
// Priority: Pyth > Yahoo > CoinGecko (Pyth is most precise when available)
export function useLivePrices() {
  const { data: cgPrices } = useQuery<PriceMap>({
    queryKey:        ['cg-prices'],
    queryFn:         fetchCGPrices,
    refetchInterval: 15_000,
    staleTime:       14_000,
    retry:           3,
    retryDelay:      2_000,
  });

  const { data: stockPrices } = useQuery<PriceMap>({
    queryKey:        ['stock-prices'],
    queryFn:         fetchStockPrices,
    refetchInterval: 30_000,
    staleTime:       29_000,
    retry:           3,
    retryDelay:      2_000,
  });

  const { data: pythPrices, isPending: pythPending } = useQuery<PriceMap>({
    queryKey:        ['pyth-prices'],
    queryFn:         () => fetchPythPrices(ALL_PAIRS),
    refetchInterval: 5_000,
    staleTime:       4_000,
    retry:           3,
    retryDelay:      1_000,
  });

  // Merge all three — later sources override earlier ones
  const prices: PriceMap = {
    ...(cgPrices    ?? {}),   // base: crypto from CoinGecko
    ...(stockPrices ?? {}),   // layer: stocks/FX/commodities from Yahoo
    ...(pythPrices  ?? {}),   // top: Pyth overrides everything when available
  };

  const loading = pythPending && !cgPrices && !stockPrices;

  return { prices, loading };
}

// ─── Derived hooks ────────────────────────────────────────────────────────────

export function usePairPrice(pair: string): PriceData | undefined {
  const { prices } = useLivePrices();
  const feedId = FEED_IDS[pair];
  if (!feedId) return undefined;
  return prices[feedId];
}

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
