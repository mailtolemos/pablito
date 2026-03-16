export type FeedMeta = {
  sym:   string;
  name:  string;
  pair:  string;
  icon:  string;
  color: string;
  bg:    string;
  category: 'crypto' | 'stocks' | 'commodities' | 'etfs';
};

export const FEEDS: FeedMeta[] = [
  // Crypto
  { sym:'BTC',   name:'Bitcoin',     pair:'BTC/USD',   icon:'₿', color:'#F7931A', bg:'rgba(247,147,26,0.13)',   category:'crypto' },
  { sym:'ETH',   name:'Ethereum',    pair:'ETH/USD',   icon:'Ξ', color:'#627EEA', bg:'rgba(98,126,234,0.13)',   category:'crypto' },
  { sym:'SOL',   name:'Solana',      pair:'SOL/USD',   icon:'◎', color:'#9945FF', bg:'rgba(153,69,255,0.13)',   category:'crypto' },
  { sym:'BNB',   name:'BNB Chain',   pair:'BNB/USD',   icon:'B', color:'#F3BA2F', bg:'rgba(243,186,47,0.13)',   category:'crypto' },
  { sym:'ARB',   name:'Arbitrum',    pair:'ARB/USD',   icon:'A', color:'#28A0F0', bg:'rgba(40,160,240,0.13)',   category:'crypto' },
  { sym:'AVAX',  name:'Avalanche',   pair:'AVAX/USD',  icon:'△', color:'#E84142', bg:'rgba(232,65,66,0.13)',    category:'crypto' },
  { sym:'LINK',  name:'Chainlink',   pair:'LINK/USD',  icon:'⬡', color:'#375BD2', bg:'rgba(55,91,210,0.13)',    category:'crypto' },
  { sym:'UNI',   name:'Uniswap',     pair:'UNI/USD',   icon:'🦄',color:'#FF007A', bg:'rgba(255,0,122,0.13)',    category:'crypto' },
  { sym:'AAVE',  name:'Aave',        pair:'AAVE/USD',  icon:'A', color:'#B6509E', bg:'rgba(182,80,158,0.13)',   category:'crypto' },
  { sym:'JTO',   name:'Jito',        pair:'JTO/USD',   icon:'J', color:'#9945FF', bg:'rgba(153,69,255,0.12)',   category:'crypto' },
  { sym:'JUP',   name:'Jupiter',     pair:'JUP/USD',   icon:'♃', color:'#00E5A0', bg:'rgba(0,229,160,0.12)',    category:'crypto' },
  { sym:'WIF',   name:'dogwifhat',   pair:'WIF/USD',   icon:'🐕',color:'#9945FF', bg:'rgba(153,69,255,0.12)',   category:'crypto' },
  { sym:'SUI',   name:'Sui',         pair:'SUI/USD',   icon:'S', color:'#4E78F4', bg:'rgba(78,120,244,0.13)',   category:'crypto' },
  { sym:'APT',   name:'Aptos',       pair:'APT/USD',   icon:'A', color:'#00E5A0', bg:'rgba(0,229,160,0.12)',    category:'crypto' },
  { sym:'OP',    name:'Optimism',    pair:'OP/USD',    icon:'O', color:'#FF0420', bg:'rgba(255,4,32,0.12)',     category:'crypto' },
  { sym:'MATIC', name:'Polygon',     pair:'MATIC/USD', icon:'M', color:'#8247E5', bg:'rgba(130,71,229,0.12)',   category:'crypto' },
  // Stocks
  { sym:'AAPL',  name:'Apple Inc.',  pair:'AAPL/USD',  icon:'🍎',color:'#A2AAAD', bg:'rgba(162,170,173,0.12)', category:'stocks' },
  { sym:'NVDA',  name:'Nvidia Corp.',pair:'NVDA/USD',  icon:'N', color:'#76B900', bg:'rgba(118,185,0,0.13)',    category:'stocks' },
  { sym:'TSLA',  name:'Tesla Inc.',  pair:'TSLA/USD',  icon:'T', color:'#E31937', bg:'rgba(227,25,55,0.12)',    category:'stocks' },
  { sym:'MSFT',  name:'Microsoft',   pair:'MSFT/USD',  icon:'M', color:'#0078D4', bg:'rgba(0,120,212,0.13)',    category:'stocks' },
  { sym:'GOOGL', name:'Alphabet',    pair:'GOOGL/USD', icon:'G', color:'#4285F4', bg:'rgba(66,133,244,0.13)',   category:'stocks' },
  { sym:'AMZN',  name:'Amazon',      pair:'AMZN/USD',  icon:'Z', color:'#FF9900', bg:'rgba(255,153,0,0.13)',    category:'stocks' },
  { sym:'COIN',  name:'Coinbase',    pair:'COIN/USD',  icon:'C', color:'#0052FF', bg:'rgba(0,82,255,0.13)',     category:'stocks' },
  // Commodities & FX
  { sym:'XAU',   name:'Gold',        pair:'XAU/USD',   icon:'⬡', color:'#F59E0B', bg:'rgba(245,158,11,0.13)',   category:'commodities' },
  { sym:'XAG',   name:'Silver',      pair:'XAG/USD',   icon:'⬡', color:'#94A3B8', bg:'rgba(148,163,184,0.13)', category:'commodities' },
  { sym:'EUR',   name:'EUR/USD',     pair:'EUR/USD',   icon:'€', color:'#3B82F6', bg:'rgba(59,130,246,0.12)',   category:'commodities' },
  { sym:'GBP',   name:'GBP/USD',     pair:'GBP/USD',   icon:'£', color:'#3B82F6', bg:'rgba(59,130,246,0.12)',   category:'commodities' },
  // ETFs
  { sym:'SPY',   name:'S&P 500 ETF', pair:'SPY/USD',   icon:'S', color:'#1E40AF', bg:'rgba(30,64,175,0.12)',    category:'etfs' },
  { sym:'QQQ',   name:'NASDAQ 100',  pair:'QQQ/USD',   icon:'Q', color:'#7C3AED', bg:'rgba(124,58,237,0.12)',   category:'etfs' },
];

export const FEEDS_BY_CATEGORY = FEEDS.reduce<Record<string, FeedMeta[]>>((acc, f) => {
  if (!acc[f.category]) acc[f.category] = [];
  acc[f.category].push(f);
  return acc;
}, {});

export const FEED_MAP = Object.fromEntries(FEEDS.map(f => [f.pair, f]));
export const ALL_PAIRS = FEEDS.map(f => f.pair);
