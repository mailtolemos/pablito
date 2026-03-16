// Pyth Network — Official Price Feed IDs (stable channel)
// Source: https://pyth.network/developers/price-feed-ids
// Used via pyth-mcp: https://github.com/aditya520/pyth-mcp

export const FEED_IDS: Record<string, string> = {
  // Crypto
  'BTC/USD':   '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD':   '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD':   '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'BNB/USD':   '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'AVAX/USD':  '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'ARB/USD':   '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  'OP/USD':    '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
  'MATIC/USD': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
  'LINK/USD':  '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'UNI/USD':   '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
  'AAVE/USD':  '0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445',
  'JTO/USD':   '0xb43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2',
  'JUP/USD':   '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
  'WIF/USD':   '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc',
  'SUI/USD':   '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  'APT/USD':   '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
  'TIA/USD':   '0x09f7c1d7dfbb7df2b8fe3d3d87ee94a2259d212da4f30c1f0540d066dfa44723',
  'PENDLE/USD':'0x9a4df90b25497f66b1afb012467e316e801ca3d839456db028892fe8c70c8016',
  'EIGEN/USD': '0x6e3f3fa8253588df9326580180233eb791e03b443a3ba7a1d892e73874e19a54',
  'W/USD':     '0xeff7446475e218517566ea99e72a4abec2e1bd8498b43b7d8331e29dcb059389',
  // Commodities
  'XAU/USD':   '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  'XAG/USD':   '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
  // FX
  'EUR/USD':   '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  'GBP/USD':   '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
  'JPY/USD':   '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52',
  // Equities
  'AAPL/USD':  '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  'TSLA/USD':  '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
  'NVDA/USD':  '0x9d4294bbcd1174d6f2003ec365831e64cc31d9f6f15a791b4ce36ba5e43acba0',
  'MSFT/USD':  '0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1',
  'GOOGL/USD': '0xbf76de3669a965bc5d0d2e3050d948b20b080d56f7ef52db9f0db77eedc3a6f3',
  'AMZN/USD':  '0xb7e3904c08ddd9c0d10e09aaa4f764d5b8944e4b3d7e15e74040de8ea978c30c',
  'COIN/USD':  '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  'SPY/USD':   '0x19e09bb805456ada3979a7d1d540ef8be5f3a9dbb9a5889a00df42040e54a0de',
  'QQQ/USD':   '0x3959b82c97780e90f1ad5c01a4b9b7ea2fd9e8eb2fc6c81dbbcf8e25e8a4f3de',
};

export type PriceData = {
  price: number;
  conf: number;
  ema: number;
  publishTime: number;
};

function parsePyth(raw: string, expo: number): number {
  return parseFloat(raw) * Math.pow(10, expo);
}

const HERMES = 'https://hermes.pyth.network';
const BENCHMARKS = 'https://benchmarks.pyth.network';

// Fetch latest prices for multiple feeds — same as pyth-mcp get_latest_prices
export async function fetchPythPrices(
  pairs: string[]
): Promise<Record<string, PriceData>> {
  const ids = pairs.map(p => FEED_IDS[p]).filter(Boolean);
  if (!ids.length) return {};

  const qs = ids.map(id => `ids[]=${id}`).join('&');
  const url = `${HERMES}/v2/updates/price/latest?${qs}&parsed=true`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Pyth ${res.status}`);
  const { parsed } = await res.json();

  const out: Record<string, PriceData> = {};
  for (const f of parsed ?? []) {
    const id = '0x' + f.id;
    out[id] = {
      price:       parsePyth(f.price.price,     f.price.expo),
      conf:        parsePyth(f.price.conf,       f.price.expo),
      ema:         parsePyth(f.ema_price.price,  f.ema_price.expo),
      publishTime: f.price.publish_time,
    };
  }
  return out;
}

export type OHLCBar = { time: number; open: number; high: number; low: number; close: number };

// Map pair key to Pyth Benchmarks symbol
const BENCHMARK_MAP: Record<string, string> = {
  'BTC/USD':   'Crypto.BTC/USD',   'ETH/USD':   'Crypto.ETH/USD',
  'SOL/USD':   'Crypto.SOL/USD',   'BNB/USD':   'Crypto.BNB/USD',
  'ARB/USD':   'Crypto.ARB/USD',   'AVAX/USD':  'Crypto.AVAX/USD',
  'OP/USD':    'Crypto.OP/USD',    'LINK/USD':  'Crypto.LINK/USD',
  'UNI/USD':   'Crypto.UNI/USD',   'AAVE/USD':  'Crypto.AAVE/USD',
  'JTO/USD':   'Crypto.JTO/USD',   'JUP/USD':   'Crypto.JUP/USD',
  'WIF/USD':   'Crypto.WIF/USD',   'SUI/USD':   'Crypto.SUI/USD',
  'APT/USD':   'Crypto.APT/USD',   'MATIC/USD': 'Crypto.MATIC/USD',
  'XAU/USD':   'Metal.XAU/USD',    'XAG/USD':   'Metal.XAG/USD',
  'EUR/USD':   'FX.EUR/USD',       'GBP/USD':   'FX.GBP/USD',
  'AAPL/USD':  'Equity.US.AAPL/USD', 'TSLA/USD': 'Equity.US.TSLA/USD',
  'NVDA/USD':  'Equity.US.NVDA/USD', 'MSFT/USD': 'Equity.US.MSFT/USD',
  'COIN/USD':  'Equity.US.COIN/USD', 'GOOGL/USD':'Equity.US.GOOGL/USD',
  'AMZN/USD':  'Equity.US.AMZN/USD','SPY/USD':  'Equity.US.SPY/USD',
  'QQQ/USD':   'Equity.US.QQQ/USD',
};

// Fetch OHLC history from Pyth Benchmarks TradingView shim
export async function fetchPythHistory(
  pair: string,
  resolution: string,
  fromTs: number,
  toTs: number
): Promise<OHLCBar[]> {
  const sym = BENCHMARK_MAP[pair];
  if (!sym) return [];

  const url = `${BENCHMARKS}/v1/shims/tradingview/history?symbol=${encodeURIComponent(sym)}&resolution=${resolution}&from=${fromTs}&to=${toTs}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const d = await res.json();
  if (!d.t?.length || d.s === 'no_data') return [];

  return d.t.map((ts: number, i: number) => ({
    time:  ts * 1000,
    open:  d.o?.[i] ?? d.c[i],
    high:  d.h?.[i] ?? d.c[i],
    low:   d.l?.[i] ?? d.c[i],
    close: d.c[i],
  }));
}
