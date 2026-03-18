'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FeedMeta, FEED_MAP } from '@/lib/feeds';
import { fmtPrice } from '@/lib/fmt';
import { Spark } from '@/components/Spark';

// ─── Types ────────────────────────────────────────────────────────────────────

type CoinItem = {
  rank:      number;
  id:        string;
  sym:       string;
  name:      string;
  image:     string;
  price:     number;
  change24h: number;
  marketCap: number;
  sparkline: number[];
};

type MarketItem = {
  pair:      string;
  sym:       string;
  name:      string;
  price:     number;
  change24h: number;
  category:  string;
  pythPair?: string;
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchCGMarkets(): Promise<CoinItem[]> {
  const res = await fetch('/api/cg-markets', { cache: 'no-store' });
  if (!res.ok) throw new Error(`cg-markets ${res.status}`);
  const { coins } = await res.json();
  return coins ?? [];
}

async function fetchMarketItems(): Promise<MarketItem[]> {
  const res = await fetch('/api/stock-prices', { cache: 'no-store' });
  if (!res.ok) throw new Error(`stock-prices ${res.status}`);
  const { items } = await res.json();
  return items ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtChange(c: number) {
  const sign = c >= 0 ? '+' : '';
  return `${sign}${c.toFixed(2)}%`;
}

// Minimal 5-point synthetic sparkline from 24h change direction
function syntheticSpark(change24h: number): number[] {
  const base = 100;
  const end  = base * (1 + change24h / 100);
  const mid  = (base + end) / 2;
  const bump = Math.abs(end - base) * 0.12;
  return change24h >= 0
    ? [base, base + bump, mid, mid + bump, end]
    : [base, base - bump, mid, mid - bump, end];
}

// ─── Row components ───────────────────────────────────────────────────────────

function CoinRow({ coin, onClick }: { coin: CoinItem; onClick?: () => void }) {
  const isUp   = coin.change24h >= 0;
  const color  = isUp ? '#00E5A0' : '#f43f5e';
  const sparks = coin.sparkline?.length > 1 ? coin.sparkline : syntheticSpark(coin.change24h);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all border border-transparent ${
        onClick ? 'cursor-pointer hover:border-border hover:bg-bg-2' : ''
      }`}
    >
      {/* Rank */}
      <span className="text-[9px] text-slate-600 w-5 flex-shrink-0 text-right" style={{ fontFamily: 'var(--font-mono)' }}>
        {coin.rank}
      </span>

      {/* Logo */}
      <img src={coin.image} alt={coin.sym} className="w-5 h-5 rounded-full flex-shrink-0" loading="lazy"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-200">{coin.sym}</div>
        <div className="text-[9px] text-slate-600 truncate" style={{ fontFamily: 'var(--font-mono)' }}>{coin.name}</div>
      </div>

      {/* Sparkline (7d) */}
      <div className="flex-shrink-0 opacity-75">
        <Spark data={sparks} color={color} width={44} height={20} strokeWidth={1.2} />
      </div>

      {/* Price + change */}
      <div className="text-right flex-shrink-0">
        <div className="text-[11px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
          {fmtPrice(coin.price)}
        </div>
        <div className="text-[9px] font-medium" style={{ fontFamily: 'var(--font-mono)', color }}>
          {fmtChange(coin.change24h)}
        </div>
      </div>
    </div>
  );
}

function MarketRow({ item, onClick }: { item: MarketItem; onClick?: () => void }) {
  const isUp  = item.change24h >= 0;
  const color = isUp ? '#00E5A0' : '#f43f5e';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all border border-transparent ${
        onClick ? 'cursor-pointer hover:border-border hover:bg-bg-2' : ''
      }`}
    >
      {/* Symbol badge */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border border-border bg-bg-3 text-[8px] font-black text-slate-400" style={{ fontFamily: 'var(--font-mono)' }}>
        {item.sym.slice(0, 4)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-200">{item.sym}</div>
        <div className="text-[9px] text-slate-600 truncate" style={{ fontFamily: 'var(--font-mono)' }}>{item.name}</div>
      </div>

      {/* Sparkline */}
      <div className="flex-shrink-0 opacity-75">
        <Spark data={syntheticSpark(item.change24h)} color={color} width={44} height={20} strokeWidth={1.2} />
      </div>

      {/* Price + change */}
      <div className="text-right flex-shrink-0">
        <div className="text-[11px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
          {fmtPrice(item.price)}
        </div>
        <div className="text-[9px] font-medium" style={{ fontFamily: 'var(--font-mono)', color }}>
          {fmtChange(item.change24h)}
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-1 px-1 py-2">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 animate-pulse">
          <div className="w-5 h-5 rounded-full bg-bg-3 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2.5 bg-bg-3 rounded w-14" />
            <div className="h-2   bg-bg-3 rounded w-20" />
          </div>
          <div className="w-10 h-5 bg-bg-3 rounded flex-shrink-0" />
          <div className="space-y-1 text-right">
            <div className="h-2.5 bg-bg-3 rounded w-14 ml-auto" />
            <div className="h-2   bg-bg-3 rounded w-10 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'crypto' | 'stocks' | 'etfs' | 'fx' | 'commodities';
const TABS: { key: Tab; label: string }[] = [
  { key: 'crypto',      label: 'Crypto'  },
  { key: 'stocks',      label: 'Stocks'  },
  { key: 'etfs',        label: 'ETFs'    },
  { key: 'fx',          label: 'FX'      },
  { key: 'commodities', label: 'Commod.' },
];

interface PriceFeedsProps {
  onSelectFeed: (feed: FeedMeta) => void;
}

export function PriceFeeds({ onSelectFeed }: PriceFeedsProps) {
  const [tab, setTab]     = useState<Tab>('crypto');
  const [search, setSearch] = useState('');

  const { data: coins, isLoading: coinsLoading, dataUpdatedAt: coinsUpdated } = useQuery<CoinItem[]>({
    queryKey:        ['cg-markets'],
    queryFn:         fetchCGMarkets,
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           3,
    retryDelay:      3_000,
  });

  const { data: marketItems, isLoading: marketLoading, dataUpdatedAt: marketUpdated } = useQuery<MarketItem[]>({
    queryKey:        ['market-items'],
    queryFn:         fetchMarketItems,
    refetchInterval: 30_000,
    staleTime:       29_000,
    retry:           3,
    retryDelay:      2_000,
  });

  const filteredCoins = search.trim()
    ? (coins ?? []).filter(c =>
        c.sym.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : (coins ?? []);

  const itemsByCategory = (cat: string) =>
    (marketItems ?? []).filter(i => i.category === cat);

  const now = Date.now();
  const updatedAgo = (ts: number) => {
    if (!ts) return 'loading…';
    const s = Math.floor((now - ts) / 1000);
    if (s < 5)  return 'just now';
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  const isLoading = tab === 'crypto' ? coinsLoading  : marketLoading;
  const updatedTs = tab === 'crypto' ? coinsUpdated   : marketUpdated;
  const listCount = tab === 'crypto' ? filteredCoins.length : itemsByCategory(tab).length;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] tracking-[2px] text-slate-500 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Markets
          </span>
          <div className="flex items-center gap-1.5">
            <div className="live-dot" />
            <span className="text-[8px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
              {updatedAgo(updatedTs)}
            </span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
              className={`text-[9px] px-2 py-0.5 rounded transition-all border ${
                tab === t.key
                  ? 'bg-bg-3 text-slate-200 border-border-strong'
                  : 'text-slate-600 border-border hover:text-slate-400'
              }`}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search — crypto only */}
        {tab === 'crypto' && (
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search 200 coins…"
            className="mt-2 w-full bg-bg-3 border border-border rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-600 outline-none focus:border-border-strong"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        )}

        <div className="mt-1 text-[8px] text-slate-700" style={{ fontFamily: 'var(--font-mono)' }}>
          {tab === 'crypto'
            ? (search ? `${listCount} matching "${search}"` : `top ${listCount} · 7d sparkline · CoinGecko`)
            : `${listCount} assets · 24h sparkline`
          }
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {isLoading ? (
          <Skeleton />
        ) : tab === 'crypto' ? (
          filteredCoins.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-[11px]">No coins found for &ldquo;{search}&rdquo;</div>
          ) : (
            filteredCoins.map(coin => {
              const feedMeta = FEED_MAP[`${coin.sym}/USD`];
              return <CoinRow key={coin.id} coin={coin} onClick={feedMeta ? () => onSelectFeed(feedMeta) : undefined} />;
            })
          )
        ) : (
          itemsByCategory(tab).length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-[11px]">Fetching prices…</div>
          ) : (
            itemsByCategory(tab).map(item => {
              const feedMeta = item.pythPair ? FEED_MAP[item.pythPair] : undefined;
              return <MarketRow key={item.pair} item={item} onClick={feedMeta ? () => onSelectFeed(feedMeta) : undefined} />;
            })
          )
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border">
        <div className="text-[8px] text-slate-700 leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
          {tab === 'crypto'
            ? <><a href="https://coingecko.com" target="_blank" rel="noreferrer" className="text-cyan-900 hover:text-cyan-700">CoinGecko</a> · click row to open Pyth chart</>
            : <><a href="https://finance.yahoo.com" target="_blank" rel="noreferrer" className="text-cyan-900 hover:text-cyan-700">Yahoo Finance</a> · 15-min delay for stocks</>
          }
        </div>
      </div>
    </div>
  );
}
