import { NextResponse } from 'next/server';

type MarketItem = {
  pair:      string;
  sym:       string;
  name:      string;
  price:     number;
  change24h: number;
  category:  'stocks' | 'etfs' | 'fx' | 'commodities';
  pythPair?: string; // set for assets that also have a Pyth feed
};

// Full ticker → metadata map
const TICKER_META: Record<string, { name: string; category: MarketItem['category']; displaySym: string; pair: string; pythPair?: string }> = {
  // ── Stocks ──────────────────────────────────────────────────────────────────
  'AAPL':   { name: 'Apple Inc.',          category: 'stocks',      displaySym: 'AAPL',  pair: 'AAPL/USD',  pythPair: 'AAPL/USD'  },
  'NVDA':   { name: 'Nvidia Corp.',        category: 'stocks',      displaySym: 'NVDA',  pair: 'NVDA/USD',  pythPair: 'NVDA/USD'  },
  'MSFT':   { name: 'Microsoft',           category: 'stocks',      displaySym: 'MSFT',  pair: 'MSFT/USD',  pythPair: 'MSFT/USD'  },
  'GOOGL':  { name: 'Alphabet',            category: 'stocks',      displaySym: 'GOOGL', pair: 'GOOGL/USD', pythPair: 'GOOGL/USD' },
  'AMZN':   { name: 'Amazon',              category: 'stocks',      displaySym: 'AMZN',  pair: 'AMZN/USD',  pythPair: 'AMZN/USD'  },
  'META':   { name: 'Meta Platforms',      category: 'stocks',      displaySym: 'META',  pair: 'META/USD'   },
  'TSLA':   { name: 'Tesla Inc.',          category: 'stocks',      displaySym: 'TSLA',  pair: 'TSLA/USD',  pythPair: 'TSLA/USD'  },
  'COIN':   { name: 'Coinbase',            category: 'stocks',      displaySym: 'COIN',  pair: 'COIN/USD',  pythPair: 'COIN/USD'  },
  'NFLX':   { name: 'Netflix',             category: 'stocks',      displaySym: 'NFLX',  pair: 'NFLX/USD'   },
  'AMD':    { name: 'AMD',                 category: 'stocks',      displaySym: 'AMD',   pair: 'AMD/USD'    },
  'INTC':   { name: 'Intel Corp.',         category: 'stocks',      displaySym: 'INTC',  pair: 'INTC/USD'   },
  'QCOM':   { name: 'Qualcomm',            category: 'stocks',      displaySym: 'QCOM',  pair: 'QCOM/USD'   },
  'CRM':    { name: 'Salesforce',          category: 'stocks',      displaySym: 'CRM',   pair: 'CRM/USD'    },
  'ORCL':   { name: 'Oracle',              category: 'stocks',      displaySym: 'ORCL',  pair: 'ORCL/USD'   },
  'TSM':    { name: 'TSMC',                category: 'stocks',      displaySym: 'TSM',   pair: 'TSM/USD'    },
  'ASML':   { name: 'ASML Holding',        category: 'stocks',      displaySym: 'ASML',  pair: 'ASML/USD'   },
  'V':      { name: 'Visa',                category: 'stocks',      displaySym: 'V',     pair: 'V/USD'      },
  'MA':     { name: 'Mastercard',          category: 'stocks',      displaySym: 'MA',    pair: 'MA/USD'     },
  'JPM':    { name: 'JPMorgan Chase',      category: 'stocks',      displaySym: 'JPM',   pair: 'JPM/USD'    },
  'BAC':    { name: 'Bank of America',     category: 'stocks',      displaySym: 'BAC',   pair: 'BAC/USD'    },
  'GS':     { name: 'Goldman Sachs',       category: 'stocks',      displaySym: 'GS',    pair: 'GS/USD'     },
  'JNJ':    { name: 'Johnson & Johnson',   category: 'stocks',      displaySym: 'JNJ',   pair: 'JNJ/USD'    },
  'UNH':    { name: 'UnitedHealth',        category: 'stocks',      displaySym: 'UNH',   pair: 'UNH/USD'    },
  'WMT':    { name: 'Walmart',             category: 'stocks',      displaySym: 'WMT',   pair: 'WMT/USD'    },
  'HD':     { name: 'Home Depot',          category: 'stocks',      displaySym: 'HD',    pair: 'HD/USD'     },
  'DIS':    { name: 'Walt Disney',         category: 'stocks',      displaySym: 'DIS',   pair: 'DIS/USD'    },
  'PYPL':   { name: 'PayPal',              category: 'stocks',      displaySym: 'PYPL',  pair: 'PYPL/USD'   },
  'SQ':     { name: 'Block Inc.',          category: 'stocks',      displaySym: 'SQ',    pair: 'SQ/USD'     },
  'PLTR':   { name: 'Palantir',            category: 'stocks',      displaySym: 'PLTR',  pair: 'PLTR/USD'   },
  'UBER':   { name: 'Uber',                category: 'stocks',      displaySym: 'UBER',  pair: 'UBER/USD'   },
  'ABNB':   { name: 'Airbnb',              category: 'stocks',      displaySym: 'ABNB',  pair: 'ABNB/USD'   },
  'SHOP':   { name: 'Shopify',             category: 'stocks',      displaySym: 'SHOP',  pair: 'SHOP/USD'   },
  'ARM':    { name: 'Arm Holdings',        category: 'stocks',      displaySym: 'ARM',   pair: 'ARM/USD'    },
  'HOOD':   { name: 'Robinhood',           category: 'stocks',      displaySym: 'HOOD',  pair: 'HOOD/USD'   },
  'MU':     { name: 'Micron Technology',   category: 'stocks',      displaySym: 'MU',    pair: 'MU/USD'     },
  'BABA':   { name: 'Alibaba',             category: 'stocks',      displaySym: 'BABA',  pair: 'BABA/USD'   },
  'SPOT':   { name: 'Spotify',             category: 'stocks',      displaySym: 'SPOT',  pair: 'SPOT/USD'   },
  'SNAP':   { name: 'Snap Inc.',           category: 'stocks',      displaySym: 'SNAP',  pair: 'SNAP/USD'   },

  // ── ETFs & Indexes ───────────────────────────────────────────────────────────
  'SPY':    { name: 'S&P 500 ETF',         category: 'etfs',        displaySym: 'SPY',   pair: 'SPY/USD',   pythPair: 'SPY/USD'   },
  'QQQ':    { name: 'Nasdaq 100 ETF',      category: 'etfs',        displaySym: 'QQQ',   pair: 'QQQ/USD',   pythPair: 'QQQ/USD'   },
  'DIA':    { name: 'Dow Jones ETF',       category: 'etfs',        displaySym: 'DIA',   pair: 'DIA/USD'    },
  'IWM':    { name: 'Russell 2000 ETF',    category: 'etfs',        displaySym: 'IWM',   pair: 'IWM/USD'    },
  'VTI':    { name: 'Vanguard Total Mkt',  category: 'etfs',        displaySym: 'VTI',   pair: 'VTI/USD'    },
  'VOO':    { name: 'Vanguard S&P 500',    category: 'etfs',        displaySym: 'VOO',   pair: 'VOO/USD'    },
  'GLD':    { name: 'Gold ETF (SPDR)',     category: 'etfs',        displaySym: 'GLD',   pair: 'GLD/USD'    },
  'SLV':    { name: 'Silver ETF (iShares)',category: 'etfs',        displaySym: 'SLV',   pair: 'SLV/USD'    },
  'TLT':    { name: '20Y Treasury Bonds',  category: 'etfs',        displaySym: 'TLT',   pair: 'TLT/USD'    },
  'XLF':    { name: 'Financials ETF',      category: 'etfs',        displaySym: 'XLF',   pair: 'XLF/USD'    },
  'XLK':    { name: 'Technology ETF',      category: 'etfs',        displaySym: 'XLK',   pair: 'XLK/USD'    },
  'ARKK':   { name: 'ARK Innovation ETF',  category: 'etfs',        displaySym: 'ARKK',  pair: 'ARKK/USD'   },
  'EEM':    { name: 'Emerging Mkts ETF',   category: 'etfs',        displaySym: 'EEM',   pair: 'EEM/USD'    },
  'VGK':    { name: 'Vanguard Europe ETF', category: 'etfs',        displaySym: 'VGK',   pair: 'VGK/USD'    },
  'IBIT':   { name: 'iShares Bitcoin ETF', category: 'etfs',        displaySym: 'IBIT',  pair: 'IBIT/USD'   },
  'FBTC':   { name: 'Fidelity Bitcoin ETF',category: 'etfs',        displaySym: 'FBTC',  pair: 'FBTC/USD'   },

  // ── FX ───────────────────────────────────────────────────────────────────────
  'EURUSD=X':  { name: 'Euro',             category: 'fx',          displaySym: 'EUR',   pair: 'EUR/USD',   pythPair: 'EUR/USD'   },
  'GBPUSD=X':  { name: 'British Pound',    category: 'fx',          displaySym: 'GBP',   pair: 'GBP/USD',   pythPair: 'GBP/USD'   },
  'JPYUSD=X':  { name: 'Japanese Yen',     category: 'fx',          displaySym: 'JPY',   pair: 'JPY/USD'    },
  'CADUSD=X':  { name: 'Canadian Dollar',  category: 'fx',          displaySym: 'CAD',   pair: 'CAD/USD'    },
  'AUDUSD=X':  { name: 'Australian Dollar',category: 'fx',          displaySym: 'AUD',   pair: 'AUD/USD'    },
  'CHFUSD=X':  { name: 'Swiss Franc',      category: 'fx',          displaySym: 'CHF',   pair: 'CHF/USD'    },
  'CNYUSD=X':  { name: 'Chinese Yuan',     category: 'fx',          displaySym: 'CNY',   pair: 'CNY/USD'    },
  'BRLUSD=X':  { name: 'Brazilian Real',   category: 'fx',          displaySym: 'BRL',   pair: 'BRL/USD'    },
  'MXNUSD=X':  { name: 'Mexican Peso',     category: 'fx',          displaySym: 'MXN',   pair: 'MXN/USD'    },
  'KRWUSD=X':  { name: 'South Korean Won', category: 'fx',          displaySym: 'KRW',   pair: 'KRW/USD'    },

  // ── Commodities ──────────────────────────────────────────────────────────────
  'GC=F':   { name: 'Gold',                category: 'commodities', displaySym: 'XAU',   pair: 'XAU/USD',   pythPair: 'XAU/USD'   },
  'SI=F':   { name: 'Silver',              category: 'commodities', displaySym: 'XAG',   pair: 'XAG/USD',   pythPair: 'XAG/USD'   },
  'CL=F':   { name: 'WTI Crude Oil',       category: 'commodities', displaySym: 'OIL',   pair: 'OIL/USD'    },
  'BZ=F':   { name: 'Brent Crude Oil',     category: 'commodities', displaySym: 'BRENT', pair: 'BRENT/USD'  },
  'NG=F':   { name: 'Natural Gas',         category: 'commodities', displaySym: 'GAS',   pair: 'GAS/USD'    },
  'HG=F':   { name: 'Copper',              category: 'commodities', displaySym: 'CU',    pair: 'CU/USD'     },
  'PL=F':   { name: 'Platinum',            category: 'commodities', displaySym: 'XPT',   pair: 'XPT/USD'    },
  'PA=F':   { name: 'Palladium',           category: 'commodities', displaySym: 'XPD',   pair: 'XPD/USD'    },
  'ZC=F':   { name: 'Corn Futures',        category: 'commodities', displaySym: 'CORN',  pair: 'CORN/USD'   },
  'ZW=F':   { name: 'Wheat Futures',       category: 'commodities', displaySym: 'WHEAT', pair: 'WHEAT/USD'  },
  'ZS=F':   { name: 'Soybean Futures',     category: 'commodities', displaySym: 'SOY',   pair: 'SOY/USD'    },
};

async function fetchYahoo(symbols: string[]): Promise<Map<string, { price: number; change24h: number }>> {
  const result = new Map<string, { price: number; change24h: number }>();
  const symStr = symbols.join(',');

  // Try v7 first
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symStr)}&fields=regularMarketPrice,regularMarketChangePercent`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; pablito/1.0)' },
    });
    if (res.ok) {
      const data = await res.json();
      const quotes = data?.quoteResponse?.result ?? [];
      for (const q of quotes) {
        if (q.regularMarketPrice != null) {
          result.set(q.symbol, {
            price:     q.regularMarketPrice,
            change24h: q.regularMarketChangePercent ?? 0,
          });
        }
      }
      if (result.size > 0) return result;
    }
  } catch { /* fall through to v8 */ }

  // v8 fallback — chart endpoint
  await Promise.allSettled(
    symbols.map(async (ticker) => {
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
        const price = meta.regularMarketPrice as number;
        const prev  = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
        result.set(ticker, {
          price,
          change24h: prev ? ((price - prev) / prev) * 100 : 0,
        });
      } catch { /* skip */ }
    })
  );

  return result;
}

export async function GET() {
  const tickers = Object.keys(TICKER_META);
  const raw = await fetchYahoo(tickers);

  const items: MarketItem[] = [];
  const prices: Record<string, { price: number; change24h: number }> = {};

  for (const [ticker, meta] of Object.entries(TICKER_META)) {
    const data = raw.get(ticker);
    if (!data) continue;

    items.push({
      pair:      meta.pair,
      sym:       meta.displaySym,
      name:      meta.name,
      price:     data.price,
      change24h: data.change24h,
      category:  meta.category,
      pythPair:  meta.pythPair,
    });

    // Backward-compat prices dict (used by useLivePrices)
    prices[meta.pair] = { price: data.price, change24h: data.change24h };
  }

  return NextResponse.json({ items, prices }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
