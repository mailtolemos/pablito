'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { fetchPythHistory, FEED_IDS } from '@/lib/pyth';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FeedMeta } from '@/lib/feeds';
import { fmtPrice, fmtPct } from '@/lib/fmt';
import { X } from 'lucide-react';

type Range = { label: string; res: string; secs: number };
const RANGES: Range[] = [
  { label: '1H',  res: '1',  secs: 3_600          },
  { label: '4H',  res: '5',  secs: 14_400         },
  { label: '1D',  res: '60', secs: 86_400         },
  { label: '1W',  res: 'D',  secs: 86_400 * 7     },
  { label: '1M',  res: 'D',  secs: 86_400 * 30    },
  { label: '3M',  res: 'W',  secs: 86_400 * 90    },
  { label: '1Y',  res: 'W',  secs: 86_400 * 365   },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-3 border border-border rounded-lg px-3 py-2">
      <div className="text-[9px] text-slate-500 mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
        {label ? new Date(label).toLocaleString() : ''}
      </div>
      <div className="text-[12px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
        {fmtPrice(payload[0]?.value)}
      </div>
    </div>
  );
};

interface ChartModalProps {
  feed: FeedMeta;
  onClose: () => void;
}

export function ChartModal({ feed, onClose }: ChartModalProps) {
  const [range, setRange] = useState<Range>(RANGES[2]); // 1D default
  const { prices } = useLivePrices();
  const fid = FEED_IDS[feed.pair];
  const livePrice = fid ? prices[fid]?.price : undefined;

  const { data: bars = [], isLoading } = useQuery({
    queryKey: ['chart', feed.pair, range.label],
    queryFn: () => {
      const now = Math.floor(Date.now() / 1000);
      return fetchPythHistory(feed.pair, range.res, now - range.secs, now);
    },
    staleTime: 30_000,
    retry: 2,
  });

  const chartData = bars.map(b => ({ time: b.time, price: b.close }));
  const pctChange =
    chartData.length >= 2
      ? ((chartData.at(-1)!.price - chartData[0].price) / chartData[0].price) * 100
      : null;

  const hi = bars.length ? Math.max(...bars.map(b => b.high)) : null;
  const lo = bars.length ? Math.min(...bars.map(b => b.low)) : null;
  const isUp = pctChange === null || pctChange >= 0;
  const lineColor = isUp ? '#00E5A0' : '#f43f5e';
  const gradId = `grad-${feed.sym}`;

  const fmtXAxis = (t: number) => {
    const d = new Date(t);
    if (['1Y', '3M', '1M'].includes(range.label))
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (range.label === '1W')
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div
      className="modal-bg"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-card bg-bg-1 border border-border rounded-2xl w-[860px] max-w-[96vw] p-6 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm border border-border"
                style={{ background: feed.bg }}
              >
                {feed.icon}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">
                  {feed.sym}/USD
                </h2>
                <div className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
                  {feed.pair} · Pablito via Pyth Benchmarks
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-[28px] font-black text-slate-100" style={{ fontFamily: 'var(--font-mono)' }}>
                {livePrice ? fmtPrice(livePrice) : fmtPrice(chartData.at(-1)?.price)}
              </span>
              {pctChange !== null && (
                <span
                  className="text-[14px] font-bold"
                  style={{ color: isUp ? '#00E5A0' : '#f43f5e', fontFamily: 'var(--font-mono)' }}
                >
                  {fmtPct(pctChange)} ({range.label})
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-bg-3"
          >
            <X size={20} />
          </button>
        </div>

        {/* Range selector */}
        <div className="flex gap-1 mb-4">
          {RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={`text-[10px] px-3 py-1.5 rounded transition-all border ${
                range.label === r.label
                  ? 'text-brand border-brand/40 bg-brand/10'
                  : 'text-slate-500 border-border hover:text-slate-300 hover:border-border-strong'
              }`}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[280px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex gap-2">
                <div className="ldot" /><div className="ldot" /><div className="ldot" />
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-600 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                Pablito couldn't find data for this range
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={fmtXAxis}
                  tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Space Mono' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={fmtPrice}
                  tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Space Mono' }}
                  tickLine={false}
                  axisLine={false}
                  width={76}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: lineColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-border">
          {[
            { label: 'HIGH', value: hi ? fmtPrice(hi) : '—', color: '#00E5A0' },
            { label: 'LOW',  value: lo ? fmtPrice(lo) : '—', color: '#f43f5e' },
            { label: 'CHANGE', value: fmtPct(pctChange), color: isUp ? '#00E5A0' : '#f43f5e' },
            { label: 'LIVE', value: livePrice ? fmtPrice(livePrice) : '—', color: '#94a3b8' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[8px] tracking-widest text-slate-600 mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                {s.label}
              </div>
              <div className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
          <div className="ml-auto">
            <div className="text-[8px] tracking-widest text-slate-600 mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
              FEED ID
            </div>
            <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
              {FEED_IDS[feed.pair]?.slice(0, 20)}…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
