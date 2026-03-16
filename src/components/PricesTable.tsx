'use client';

import { useState, useEffect, useRef } from 'react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FEEDS, FEEDS_BY_CATEGORY, FeedMeta } from '@/lib/feeds';
import { FEED_IDS } from '@/lib/pyth';
import { fmtPrice } from '@/lib/fmt';
import { Spark } from './Spark';

const CATS = ['crypto', 'stocks', 'commodities', 'etfs'] as const;
type Cat = typeof CATS[number];

function PriceTableRow({
  feed,
  onClick,
}: {
  feed: FeedMeta;
  onClick: () => void;
}) {
  const { prices } = useLivePrices();
  const fid = FEED_IDS[feed.pair];
  const live = fid ? prices[fid] : undefined;

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

  const confPct = live?.price && live?.conf ? (live.conf / live.price) * 100 : null;
  const confColor =
    confPct === null ? '#475569'
    : confPct < 0.05 ? '#00E5A0'
    : confPct < 0.2  ? '#eab308'
    : '#f43f5e';

  return (
    <div
      className={`grid grid-cols-[2fr_1.5fr_1.5fr_1fr_90px] gap-2 px-4 py-3 border-b border-border cursor-pointer hover:bg-bg-2 transition-colors items-center ${
        flash === 'up' ? 'flash-green' : flash === 'down' ? 'flash-red' : ''
      }`}
      onClick={onClick}
    >
      {/* Asset */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border border-border"
          style={{ background: feed.bg }}
        >
          {feed.icon}
        </div>
        <div>
          <div className="text-[13px] font-bold text-slate-200">{feed.sym}</div>
          <div className="text-[9px] text-slate-600">{feed.name}</div>
        </div>
      </div>

      {/* Price */}
      <div className="text-[13px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
        {live ? fmtPrice(live.price) : <span className="text-slate-700">···</span>}
      </div>

      {/* EMA */}
      <div className="text-[12px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
        {live?.ema ? fmtPrice(live.ema) : '—'}
      </div>

      {/* Confidence */}
      <div style={{ fontFamily: 'var(--font-mono)' }}>
        {confPct !== null ? (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: confColor }} />
            <span className="text-[10px]" style={{ color: confColor }}>
              {confPct.toFixed(3)}%
            </span>
          </div>
        ) : (
          <span className="text-slate-700 text-[10px]">—</span>
        )}
      </div>

      {/* Spark */}
      <div className="flex items-center justify-end">
        <Spark data={hist} width={80} height={26} />
      </div>
    </div>
  );
}

interface PricesTableProps {
  onSelectFeed: (feed: FeedMeta) => void;
}

export function PricesTable({ onSelectFeed }: PricesTableProps) {
  const [cat, setCat] = useState<Cat>('crypto');
  const { prices, loading } = useLivePrices();

  const feeds = FEEDS_BY_CATEGORY[cat] ?? [];
  const loadedCount = feeds.filter(f => {
    const fid = FEED_IDS[f.pair];
    return fid && prices[fid];
  }).length;

  return (
    <div>
      {/* Tabs + status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-[10px] px-3 py-1.5 rounded-lg transition-all border ${
                cat === c
                  ? 'bg-bg-3 text-slate-200 border-border-strong'
                  : 'text-slate-500 border-border hover:text-slate-400'
              }`}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            {loading ? 'Pablito is checking your bags…' : `${loadedCount}/${feeds.length} feeds live · updates every 5s`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-bg-1">
        {/* Header */}
        <div
          className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_90px] gap-2 px-4 py-2.5 bg-bg-2 border-b border-border"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {['Asset', 'Price (Pyth)', 'EMA Price', 'Confidence', 'Spark (5s)'].map((h, i) => (
            <div key={i} className="text-[9px] text-slate-600 uppercase tracking-widest">
              {i === 4 ? <span className="text-right block">{h}</span> : h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {feeds.map(f => (
          <PriceTableRow key={f.pair} feed={f} onClick={() => onSelectFeed(f)} />
        ))}
      </div>
    </div>
  );
}
