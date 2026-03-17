import { NextResponse } from 'next/server';

// CoinGecko symbol → coingecko coin ID map (crypto only)
const CG_IDS: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  BNB:   'binancecoin',
  ARB:   'arbitrum',
  AVAX:  'avalanche-2',
  LINK:  'chainlink',
  UNI:   'uniswap',
  AAVE:  'aave',
  JTO:   'jito-governance-token',
  JUP:   'jupiter-exchange-solana',
  WIF:   'dogwifcoin',
  SUI:   'sui',
  APT:   'aptos',
  OP:    'optimism',
  MATIC: 'matic-network',
  TIA:   'celestia',
  PENDLE:'pendle',
  EIGEN: 'eigenlayer',
  W:     'wormhole',
};

// Reverse map: coinId → symbol
const ID_TO_SYM = Object.fromEntries(Object.entries(CG_IDS).map(([s, id]) => [id, s]));

export async function GET() {
  const coinIds = Object.values(CG_IDS).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'pablito-app/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `CoinGecko ${res.status}` }, { status: res.status });
    }

    const raw = await res.json();

    // Transform to { SYM: { price, change24h } }
    const prices: Record<string, { price: number; change24h: number }> = {};
    for (const [coinId, data] of Object.entries(raw as Record<string, Record<string, number>>)) {
      const sym = ID_TO_SYM[coinId];
      if (sym && data.usd) {
        prices[sym] = {
          price:     data.usd,
          change24h: data.usd_24h_change ?? 0,
        };
      }
    }

    return NextResponse.json({ prices }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'upstream error', detail: String(e) }, { status: 502 });
  }
}
