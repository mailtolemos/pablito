'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletStore } from '@/lib/store';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FEED_IDS } from '@/lib/pyth';
import { FEED_MAP } from '@/lib/feeds';
import { fmtPrice, fmtUSD, fmtAmount, fmtAddr } from '@/lib/fmt';
import { CHAIN_NAMES, CHAIN_COLORS } from '@/lib/wagmi';
import { Spark } from './Spark';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Row = {
  id: string;
  sym: string;
  pair: string;
  amount: number;
  wallet: string;
  chainId: number;
};

function HoldingRow({ row, onChart }: { row: Row; onChart: () => void }) {
  const { prices } = useLivePrices();
  const fid = FEED_IDS[row.pair];
  const live = fid ? prices[fid] : undefined;
  const feed = FEED_MAP[row.pair];

  // Spark history
  const histRef = useRef<number[]>([]);
  const [hist, setHist] = useState<number[]>([]);
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const p = live?.price;
    if (!p) return;
    if (prevRef.current !== null && prevRef.current !== p) {
      const d = p > prevRef.current ? 'up' : 'down';
      setFlash(d);
      setTimeout(() => setFlash(null), 700);
    }
    prevRef.current = p;
    histRef.current = [...histRef.current.slice(-29), p];
    setHist([...histRef.current]);
  }, [live?.price]);

  const value = live?.price ? live.price * row.amount : null;
  const isUp = hist.length > 1 ? hist.at(-1)! >= hist[0] : true;
  const chainColor = CHAIN_COLORS[row.chainId] ?? '#64748b';
  const chainName = CHAIN_NAMES[row.chainId] ?? `Chain ${row.chainId}`;

  return (
    <div
      className={`grid grid-cols-[2fr_1.2fr_1fr_1fr_80px_40px] gap-2 px-4 py-3 border-b border-border cursor-pointer hover:bg-bg-2 transition-colors items-center ${
        flash === 'up' ? 'flash-green' : flash === 'down' ? 'flash-red' : ''
      }`}
      onClick={onChart}
    >
      {/* Asset */}
      <div className="flex items-center gap-2.5 min-w-0">
        {feed ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] flex-shrink-0 border border-border"
            style={{ background: feed.bg }}
          >
            {feed.icon}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center text-[11px] text-slate-500 flex-shrink-0 border border-border">
            {row.sym[0]}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-200">{row.sym}</span>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: chainColor + '20', color: chainColor, fontFamily: 'var(--font-mono)' }}
            >
              {chainName}
            </span>
          </div>
          <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            {fmtAddr(row.wallet)}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-[12px] text-slate-300" style={{ fontFamily: 'var(--font-mono)' }}>
        {live ? fmtPrice(live.price) : <span className="text-slate-700">···</span>}
      </div>

      {/* Balance */}
      <div className="text-[11px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
        {fmtAmount(row.amount)} {row.sym}
      </div>

      {/* Value */}
      <div className="text-[13px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
        {value ? fmtUSD(value) : '—'}
      </div>

      {/* Spark */}
      <div className="flex items-center">
        <Spark data={hist} width={72} height={24} />
      </div>

      {/* Direction */}
      <div className="flex justify-center">
        {hist.length > 1 ? (
          isUp
            ? <TrendingUp size={14} className="text-emerald-400" />
            : <TrendingDown size={14} className="text-red-400" />
        ) : null}
      </div>
    </div>
  );
}

interface HoldingsTableProps {
  chainFilter: string;
  onSelectFeedPair: (pair: string) => void;
}

export function HoldingsTable({ chainFilter, onSelectFeedPair }: HoldingsTableProps) {
  const { wallets } = useWalletStore();

  const rows: Row[] = [];
  for (const w of wallets) {
    for (const [sym, amt] of Object.entries(w.balances ?? {})) {
      if (amt <= 0) continue;
      const match =
        chainFilter === 'all' ||
        (CHAIN_NAMES[w.chainId] ?? '').toLowerCase() === chainFilter;
      if (!match) continue;
      rows.push({
        id: `${w.id}-${sym}`,
        sym,
        pair: sym + '/USD',
        amount: amt,
        wallet: w.address,
        chainId: w.chainId,
      });
    }
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">🧳</div>
        <div className="text-center">
          <div className="text-[15px] font-bold text-slate-300 mb-1">Pablito is checking your bags…</div>
          <div className="text-[11px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            Add a bag (wallet) to get started — MetaMask, WalletConnect, Rabby and more
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="text-[11px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
          Pablito checked but found nothing on {chainFilter === 'all' ? 'any connected chain' : chainFilter}.
          <br />
          <span className="text-slate-700 text-[10px]">Native balances are fetched automatically from chain RPC</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-bg-1">
      {/* Header */}
      <div
        className="grid grid-cols-[2fr_1.2fr_1fr_1fr_80px_40px] gap-2 px-4 py-2.5 bg-bg-2 border-b border-border"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {['Asset', 'Price', 'Balance', 'Value (USD)', 'Trend', ''].map((h, i) => (
          <div key={i} className="text-[9px] text-slate-600 uppercase tracking-widest">{h}</div>
        ))}
      </div>

      {/* Rows */}
      {rows.map(r => (
        <HoldingRow
          key={r.id}
          row={r}
          onChart={() => {
            const feedId = FEED_IDS[r.pair];
            if (feedId) onSelectFeedPair(r.pair);
          }}
        />
      ))}
    </div>
  );
}
