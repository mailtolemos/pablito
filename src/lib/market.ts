// Market data — fetched through /api/market proxy to avoid CORS

export type FearGreedData = {
  value: number;
  label: string;
  prev: number;
};

export type GlobalMarket = {
  totalMcap: number;
  totalVol24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptos: number;
  mcapChange24h: number;
};

export type MarketData = {
  fearGreed: FearGreedData | null;
  global: GlobalMarket | null;
};

export async function fetchMarketData(): Promise<MarketData> {
  try {
    const res = await fetch('/api/market', { cache: 'no-store' });
    if (!res.ok) return { fearGreed: null, global: null };
    return await res.json();
  } catch {
    return { fearGreed: null, global: null };
  }
}
