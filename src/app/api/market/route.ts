import { NextResponse } from 'next/server';

// Aggregates Fear & Greed + CoinGecko global market data server-side
export async function GET() {
  const [fngRes, cgRes] = await Promise.allSettled([
    fetch('https://api.alternative.me/fng/?limit=2', { next: { revalidate: 300 } }),
    fetch('https://api.coingecko.com/api/v3/global', { next: { revalidate: 60 } }),
  ]);

  let fearGreed = null;
  if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
    try {
      const { data } = await fngRes.value.json();
      fearGreed = {
        value: parseInt(data[0].value),
        label: data[0].value_classification,
        prev: parseInt(data[1]?.value ?? data[0].value),
      };
    } catch { /* ignore */ }
  }

  let global = null;
  if (cgRes.status === 'fulfilled' && cgRes.value.ok) {
    try {
      const { data } = await cgRes.value.json();
      global = {
        totalMcap: data.total_market_cap?.usd ?? 0,
        totalVol24h: data.total_volume?.usd ?? 0,
        btcDominance: data.market_cap_percentage?.btc ?? 0,
        ethDominance: data.market_cap_percentage?.eth ?? 0,
        mcapChange24h: data.market_cap_change_percentage_24h_usd ?? 0,
        activeCryptos: data.active_cryptocurrencies ?? 0,
      };
    } catch { /* ignore */ }
  }

  return NextResponse.json({ fearGreed, global }, {
    headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
  });
}
