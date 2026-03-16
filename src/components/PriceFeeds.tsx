'use client';

import { useState, useEffect, useRef } from 'react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FEEDS_BY_CATEGORY, FeedMeta } from '@/lib/feeds';
import { FEED_IDS } from '@/lib/pyth';
import { fmtPrice } from '@/lib/fmt';
import { Spark } from './Spark';

const CATS = ['crypto', 'stocks', 'commodities', 'etfs'] as const;
type Cat = typeof CATS[number];
const CAT_LABELS: Record<Cat, string> = { crypto: 'Crypto', stocks: 'Stocks', commodities: 'Commod.', etfs: 'ETFs' };

function PriceRow({ feed, onClick }: { feed: FeedMeta; onClick: () => void }) {
  const { prices } = useLivePrices();
  const fid = FEED_IDS[feed.pair];
  const live = fid ? prices[fid] : undefined;

  // Rolling spark data
  const histRef = useRef<number[]>([]);
  const [hist, setHist] = useState<number[]>([]);
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const p = live?.price;
    if (!p) return;
    if (prevRef.current !== null && prevRef.current !== p) {
      setFlash(p > prevRef.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
    prevRef.current = p;
    histRef.current = [...histRef.current.slice(-29), p];
    setHist([...histRef.current]);
  }, [live?.price]);

  const isUp = hist.length > 1 ? hist[hist.length - 1] >= hist[0] : true;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-100 border border-transparent hover:border-border hover:bg-bg-2 group ${
        flash === 'up' ? 'flash-green' : flash === 'down' ? 'flash-red' : ''
      }`}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 border border-border"
        style={{ background: feed.bg }}
      >
        {feed.icon}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-slate-200">{feed.sym}</div>
        <div className="text-[9px] text-slate-600 truncate" style={{ fontFamily: 'var(--font-mono)' }}>{feed.name}</div>
      </div>

      {/* Spark */}
      <Spark data={hist} width={50} height={20} />

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <div className="text-[12px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
          {live ? fmtPrice(live.price) : <span className="text-slate-600">···</span>}
        </div>
        {live && (
          <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            ±{fmtPrice(live.conf)}
          </div>
        )}
      </div>
    </div>
  );
}

interface PriceFeedsProps {
  onSelectFeed: (feed: FeedMeta) => void;
}

export function PriceFeeds({ onSelectFeed }: PriceFeedsProps) {
  const [cat, setCat] = useState<Cat>('crypto');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-2.5" style={{ fontFamily: 'var(--font-mono)' }}>
          Price Feeds · Pyth Network
        </div>
        <div className="flex gap-1">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-[9px] px-2 py-1 rounded transition-all border ${
                cat === c
                  ? 'bg-bg-3 text-slate-200 border-border-strong'
                  : 'text-slate-600 border-border hover:text-slate-400'
              }`}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
            >
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {(FEEDS_BY_CATEGORY[cat] ?? []).map(f => (
          <PriceRow key={f.pair} feed={f} onClick={() => onSelectFeed(f)} />
        ))}
      </div>

      {/* Pyth attribution */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="live-dot" />
          <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            Pablito checks prices via{' '}
            <a href="https://pyth.network" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              Pyth Network
            </a>
            {' '}·{' '}
            <a href="https://github.com/aditya520/pyth-mcp" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              pyth-mcp
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
