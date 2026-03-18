'use client';

import { useState } from 'react';
import { Ticker } from '@/components/Ticker';
import { MarketCarousel } from '@/components/MarketCarousel';
import { WalletSidebar } from '@/components/WalletSidebar';
import { PriceFeeds } from '@/components/PriceFeeds';
import { HoldingsTable } from '@/components/HoldingsTable';
import { ChartModal } from '@/components/ChartModal';
import { AuthModal } from '@/components/AuthModal';
import { FeedMeta, FEED_MAP } from '@/lib/feeds';
import { CHAIN_NAMES } from '@/lib/wagmi';
import { useWalletStore } from '@/lib/store';

const CHAINS = ['all', 'ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc', 'solana'];

export default function Dashboard() {
  const [chainFilter, setChainFilter] = useState('all');
  const [chartFeed, setChartFeed] = useState<FeedMeta | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const { profile } = useWalletStore();

  const openChartByPair = (pair: string) => {
    const f = FEED_MAP[pair];
    if (f) setChartFeed(f);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-slate-200">
      <Ticker />

      {/* Header */}
      <header className="flex items-center justify-between px-5 h-12 bg-bg-1 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#00E5A0" opacity="0.9"/>
              <text x="13" y="18" textAnchor="middle" fill="#080A0D" fontSize="14" fontWeight="900" fontFamily="serif" style={{ fontStyle: 'italic' }}>P</text>
            </svg>
            <span className="text-[17px] font-black tracking-[-0.5px] text-slate-100">Pablito</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-3 border border-border">
            <div className="live-dot" />
            <span className="text-[9px] text-cyan-400 tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
              CHECKING YOUR BAGS…
            </span>
          </div>
        </div>

        {/* Chain filter pills */}
        <div className="flex gap-1">
          {CHAINS.map(c => {
            const label = c === 'all' ? 'ALL' : c.charAt(0).toUpperCase() + c.slice(1);
            const isActive = chainFilter === c;
            return (
              <button key={c} onClick={() => setChainFilter(c)}
                className={`text-[9px] px-2.5 py-1 rounded-full transition-all border ${
                  isActive ? 'bg-bg-3 text-slate-200 border-border-strong' : 'text-slate-600 border-border hover:text-slate-400 hover:border-border-strong'
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Auth / Profile button */}
        <button
          onClick={() => setShowAuth(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all border border-slate-700 bg-bg-3 text-slate-300 hover:border-brand/30 hover:text-brand"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
        >
          {profile ? (
            <>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-[#080A0D]"
                style={{ background: profile.avatarColor }}>
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              {profile.displayName}
            </>
          ) : (
            '⟡ SIGN IN'
          )}
        </button>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — wallet sidebar */}
        <aside className="w-[260px] flex-shrink-0 border-r border-border bg-bg-1 overflow-hidden flex flex-col">
          <WalletSidebar onOpenAuth={() => setShowAuth(true)} />
        </aside>

        {/* Center — holdings */}
        <main className="flex-1 overflow-y-auto bg-bg-0">
          <div className="px-5 py-4">
            <MarketCarousel />
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-bold text-brand border-b-2 border-brand pb-2.5"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                Holdings
              </span>
            </div>
            <HoldingsTable chainFilter={chainFilter} onSelectFeedPair={openChartByPair} />
          </div>
        </main>

        {/* Right — full markets panel */}
        <aside className="w-[290px] flex-shrink-0 border-l border-border bg-bg-1 overflow-hidden flex flex-col">
          <PriceFeeds onSelectFeed={f => setChartFeed(f)} />
        </aside>
      </div>

      {chartFeed && <ChartModal feed={chartFeed} onClose={() => setChartFeed(null)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
