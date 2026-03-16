'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFearGreed, fetchGlobalMarket } from '@/lib/market';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FEED_IDS } from '@/lib/pyth';
import { fmtUSD, fmtPct, fmtPrice, fgColor } from '@/lib/fmt';
import clsx from 'clsx';

function MetricCard({
  label, value, sub, accent, loading
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl bg-bg-1 border border-border p-3 relative overflow-hidden"
      style={accent ? { borderColor: `${accent}30` } : {}}
    >
      {accent && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: accent }} />
      )}
      <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
      {loading ? (
        <div className="flex gap-1 mt-2">
          <div className="ldot" /><div className="ldot" /><div className="ldot" />
        </div>
      ) : (
        <>
          <div className="text-[17px] font-bold text-slate-100 leading-tight" style={{ fontFamily: 'var(--font-mono)' }}>
            {value}
          </div>
          {sub && (
            <div className="text-[9px] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function MarketCarousel() {
  const { data: fg, isLoading: fgLoading } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: fetchFearGreed,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: gm, isLoading: gmLoading } = useQuery({
    queryKey: ['global-market'],
    queryFn: fetchGlobalMarket,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { prices } = useLivePrices();
  const btcPrice = prices[FEED_IDS['BTC/USD']];
  const ethPrice = prices[FEED_IDS['ETH/USD']];

  return (
    <div className="flex gap-2.5 mb-5">
      {/* Fear & Greed */}
      <MetricCard
        label="Fear & Greed"
        loading={fgLoading}
        accent={fg ? fgColor(fg.value) : undefined}
        value={
          fg ? (
            <span style={{ color: fgColor(fg.value) }}>{fg.value}</span>
          ) : '—'
        }
        sub={
          fg ? (
            <span style={{ color: fgColor(fg.value) }}>{fg.label.toUpperCase()}</span>
          ) : null
        }
      />

      {/* BTC Dominance */}
      <MetricCard
        label="BTC Dominance"
        loading={gmLoading}
        accent="#00E5A0"
        value={gm ? `${gm.btcDominance.toFixed(1)}%` : '—'}
        sub={gm ? <span className="text-slate-500">ETH: {gm.ethDominance.toFixed(1)}%</span> : null}
      />

      {/* Total Market Cap */}
      <MetricCard
        label="Crypto Mkt Cap"
        loading={gmLoading}
        accent="#3B82F6"
        value={gm ? fmtUSD(gm.totalMcap) : '—'}
        sub={
          gm ? (
            <span className={gm.mcapChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {fmtPct(gm.mcapChange24h)} 24h
            </span>
          ) : null
        }
      />

      {/* BTC Price — live Pyth */}
      <MetricCard
        label="BTC / USD · Pyth"
        loading={!btcPrice}
        accent="#F7931A"
        value={btcPrice ? fmtPrice(btcPrice.price) : '—'}
        sub={
          btcPrice ? (
            <span className="text-slate-500">±{fmtPrice(btcPrice.conf)}</span>
          ) : null
        }
      />

      {/* ETH Price — live Pyth */}
      <MetricCard
        label="ETH / USD · Pyth"
        loading={!ethPrice}
        accent="#627EEA"
        value={ethPrice ? fmtPrice(ethPrice.price) : '—'}
        sub={
          ethPrice ? (
            <span className="text-slate-500">±{fmtPrice(ethPrice.conf)}</span>
          ) : null
        }
      />

      {/* 24h Volume */}
      <MetricCard
        label="24h Volume"
        loading={gmLoading}
        value={gm ? fmtUSD(gm.totalVol24h) : '—'}
        sub={gm ? <span className="text-slate-500">{gm.activeCryptos.toLocaleString()} assets</span> : null}
      />
    </div>
  );
}
