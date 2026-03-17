import { NextResponse } from 'next/server';

// Yahoo Finance ticker → app pair key
// Stocks and ETFs use their normal ticker; FX uses =X suffix; commodities use futures codes
const YAHOO_TICKERS: Record<string, string> = {
  // Stocks
  'AAPL':    'AAPL/USD',
  'NVDA':    'NVDA/USD',
  'TSLA':    'TSLA/USD',
  'MSFT':    'MSFT/USD',
  'GOOGL':   'GOOGL/USD',
  'AMZN':    'AMZN/USD',
  'COIN':    'COIN/USD',
  // ETFs
  'SPY':     'SPY/USD',
  'QQQ':     'QQQ/USD',
  // Forex (=X suffix = spot rates)
  'EURUSD=X': 'EUR/USD',
  'GBPUSD=X': 'GBP/USD',
  // Commodities (futures)
  'GC=F':    'XAU/USD',   // Gold
  'SI=F':    'XAG/USD',   // Silver
};

export async function GET() {
  const symbols = Object.keys(YAHOO_TICKERS).join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketPreviousClose`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; pablito-app/1.0)',
      },
    });

    if (!res.ok) {
      // Try the v8 endpoint as fallback
      return await fetchV8(symbols);
    }

    const data = await res.json();
    const results = data?.quoteResponse?.result ?? [];

    if (!results.length) {
      return await fetchV8(symbols);
    }

    const prices: Record<string, { price: number; change24h: number }> = {};
    for (const quote of results) {
      const pair = YAHOO_TICKERS[quote.symbol];
      if (pair && quote.regularMarketPrice != null) {
        prices[pair] = {
          price:     quote.regularMarketPrice,
          change24h: quote.regularMarketChangePercent ?? 0,
        };
      }
    }

    return NextResponse.json({ prices }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'upstream error', detail: String(e) }, { status: 502 });
  }
}

// v8 fallback (chart endpoint — works when v7 is blocked)
async function fetchV8(symbols: string): Promise<NextResponse> {
  const tickers = symbols.split(',');
  const prices: Record<string, { price: number; change24h: number }> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        });
        if (!res.ok) return;
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return;

        const pair = YAHOO_TICKERS[ticker];
        if (!pair) return;

        const price = meta.regularMarketPrice as number;
        const prev  = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
        const change24h = prev ? ((price - prev) / prev) * 100 : 0;

        prices[pair] = { price, change24h };
      } catch {
        // skip failed ticker
      }
    })
  );

  return NextResponse.json({ prices }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
