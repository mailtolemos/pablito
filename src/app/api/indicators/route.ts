import { NextResponse } from 'next/server';

export type Indicator = {
  key:      string;
  label:    string;
  value:    number;
  change:   number;   // absolute change
  changePct: number;  // % change
  suffix:   string;   // '', '%', etc.
  group:    'yields' | 'indices' | 'fear' | 'commodities';
};

// ─── Ticker → display meta ────────────────────────────────────────────────────

const META: Record<string, {
  label:  string;
  group:  Indicator['group'];
  suffix: string;
}> = {
  '^TNX':     { label: 'US 10Y',    group: 'yields',      suffix: '%' },
  '^TYX':     { label: 'US 30Y',    group: 'yields',      suffix: '%' },
  '^FVX':     { label: 'US 5Y',     group: 'yields',      suffix: '%' },
  '^IRX':     { label: 'US 3M',     group: 'yields',      suffix: '%' },
  '^VIX':     { label: 'VIX',       group: 'fear',        suffix: '' },
  'DX-Y.NYB': { label: 'DXY',       group: 'fear',        suffix: '' },
  '^GSPC':    { label: 'S&P 500',   group: 'indices',     suffix: '' },
  '^DJI':     { label: 'Dow Jones', group: 'indices',     suffix: '' },
  '^IXIC':    { label: 'Nasdaq',    group: 'indices',     suffix: '' },
  '^RUT':     { label: 'Russell 2K',group: 'indices',     suffix: '' },
  'GC=F':     { label: 'Gold',      group: 'commodities', suffix: '' },
  'CL=F':     { label: 'WTI Oil',   group: 'commodities', suffix: '' },
  'NG=F':     { label: 'Nat Gas',   group: 'commodities', suffix: '' },
  'HG=F':     { label: 'Copper',    group: 'commodities', suffix: '' },
};

const TICKERS = Object.keys(META);

// ─── Yahoo Finance fetcher ────────────────────────────────────────────────────

async function fetchYahoo(): Promise<Map<string, { price: number; change: number; changePct: number; prev: number }>> {
  const result = new Map<string, { price: number; change: number; changePct: number; prev: number }>();
  const symStr = TICKERS.join(',');

  // Try v7 batch endpoint first
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symStr)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; pablito/1.0)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json();
      const quotes = data?.quoteResponse?.result ?? [];
      for (const q of quotes) {
        if (q.regularMarketPrice != null) {
          result.set(q.symbol, {
            price:     q.regularMarketPrice,
            change:    q.regularMarketChange ?? 0,
            changePct: q.regularMarketChangePercent ?? 0,
            prev:      q.regularMarketPreviousClose ?? q.regularMarketPrice,
          });
        }
      }
      if (result.size >= TICKERS.length * 0.5) return result;
    }
  } catch { /* fall through */ }

  // v8 fallback — chart endpoint, parallel
  await Promise.allSettled(
    TICKERS.map(async (ticker) => {
      try {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(6_000),
        });
        if (!res.ok) return;
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return;
        const price = meta.regularMarketPrice as number;
        const prev  = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
        result.set(ticker, {
          price,
          change:    price - prev,
          changePct: prev ? ((price - prev) / prev) * 100 : 0,
          prev,
        });
      } catch { /* skip */ }
    })
  );

  return result;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const raw = await fetchYahoo();

  const indicators: Indicator[] = [];
  for (const [ticker, meta] of Object.entries(META)) {
    const d = raw.get(ticker);
    if (!d) continue;
    indicators.push({
      key:       ticker,
      label:     meta.label,
      value:     d.price,
      change:    d.change,
      changePct: d.changePct,
      suffix:    meta.suffix,
      group:     meta.group,
    });
  }

  // Group ordering
  const ORDER: Indicator['group'][] = ['yields', 'indices', 'fear', 'commodities'];
  indicators.sort((a, b) =>
    ORDER.indexOf(a.group) - ORDER.indexOf(b.group)
  );

  return NextResponse.json(
    { indicators, lastUpdated: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
