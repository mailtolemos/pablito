'use client';

import { useLivePrices } from '@/hooks/useLivePrices';
import { FEEDS } from '@/lib/feeds';
import { FEED_IDS } from '@/lib/pyth';
import { fmtPrice } from '@/lib/fmt';

const TICKER_FEEDS = FEEDS.filter(f =>
  ['BTC', 'ETH', 'SOL', 'BNB', 'ARB', 'AVAX', 'XAU', 'AAPL', 'NVDA', 'EUR', 'LINK', 'UNI', 'SUI', 'TSLA', 'SPY'].includes(f.sym)
);

export function Ticker() {
  const { prices } = useLivePrices();
  const doubled = [...TICKER_FEEDS, ...TICKER_FEEDS];

  return (
    <div className="ticker-wrap h-8 bg-bg-1 border-b border-border overflow-hidden flex items-center">
      <div className="ticker-inner flex gap-0">
        {doubled.map((f, i) => {
          const fid = FEED_IDS[f.pair];
          const p = fid ? prices[fid]?.price : undefined;
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-6 h-8 border-r border-border"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <div className="live-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: '#00E5A0' }} />
              <span className="text-[10px] text-slate-500 tracking-wider">{f.sym}</span>
              <span className="text-[10px] text-slate-200 font-bold">
                {p ? fmtPrice(p) : '···'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
