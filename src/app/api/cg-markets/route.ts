import { NextResponse } from 'next/server';

type CoinItem = {
  rank:      number;
  id:        string;
  sym:       string;
  name:      string;
  image:     string;
  price:     number;
  change24h: number;
  marketCap: number;
  sparkline: number[];   // downsampled 7d hourly prices (~30 points)
};

// Downsample an array to at most `n` points
function downsample(arr: number[], n: number): number[] {
  if (!arr || arr.length === 0) return [];
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)] ?? arr[arr.length - 1]);
}

async function fetchPage(page: number): Promise<CoinItem[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=true&price_change_percentage=24h`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json', 'User-Agent': 'pablito-app/1.0' },
  });
  if (!res.ok) throw new Error(`CoinGecko page ${page}: ${res.status}`);
  const data = await res.json();
  return data.map((c: {
    market_cap_rank: number;
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    sparkline_in_7d?: { price: number[] };
  }): CoinItem => ({
    rank:      c.market_cap_rank,
    id:        c.id,
    sym:       c.symbol.toUpperCase(),
    name:      c.name,
    image:     c.image,
    price:     c.current_price ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap ?? 0,
    sparkline: downsample(c.sparkline_in_7d?.price ?? [], 30),
  }));
}

export async function GET() {
  try {
    // Fetch pages 1 + 2 in parallel → top 200 by market cap
    const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(2)]);
    const coins = [...page1, ...page2];

    return NextResponse.json({ coins }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
