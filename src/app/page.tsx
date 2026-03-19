'use client';

import { useState } from 'react';
import { Ticker } from '@/components/Ticker';
import { MarketCarousel } from '@/components/MarketCarousel';
import { WalletSidebar } from '@/components/WalletSidebar';
import { PriceFeeds } from '@/components/PriceFeeds';
import { HoldingsTable } from '@/components/HoldingsTable';
import { DeFiPanel } from '@/components/DeFiPanel';
import { WorldMonitor } from '@/components/WorldMonitor';
import { ChartModal } from '@/components/ChartModal';
import { AuthModal } from '@/components/AuthModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FeedMeta, FEED_MAP } from '@/lib/feeds';
import { useWalletStore } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

// On desktop: holdings | defi | monitor (center panel tabs)
// On mobile: monitor | holdings | defi | markets | wallet (full-screen tabs)
type ActiveTab = 'monitor' | 'holdings' | 'defi' | 'markets' | 'wallet';

const CHAINS = ['all', 'ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc', 'solana'];

// ─── Mobile bottom nav icon ───────────────────────────────────────────────────

function NavIcon({ tab }: { tab: ActiveTab }) {
  switch (tab) {
    case 'monitor':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      );
    case 'holdings':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      );
    case 'defi':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
    case 'markets':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      );
    case 'wallet':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
        </svg>
      );
  }
}

const NAV_ITEMS: { key: ActiveTab; label: string }[] = [
  { key: 'monitor',  label: 'Monitor'  },
  { key: 'holdings', label: 'Holdings' },
  { key: 'defi',     label: 'DeFi'     },
  { key: 'markets',  label: 'Markets'  },
  { key: 'wallet',   label: 'Wallet'   },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  // Monitor is the default tab (homepage)
  const [activeTab, setActiveTab] = useState<ActiveTab>('monitor');
  const [chainFilter, setChainFilter] = useState('all');
  const [chartFeed, setChartFeed]   = useState<FeedMeta | null>(null);
  const [showAuth, setShowAuth]     = useState(false);
  const { profile } = useWalletStore();

  const openChartByPair = (pair: string) => {
    const f = FEED_MAP[pair];
    if (f) setChartFeed(f);
  };

  // Desktop center tab (holdings / defi / monitor only)
  type CenterTab = 'monitor' | 'holdings' | 'defi';
  const [centerTab, setCenterTab] = useState<CenterTab>('monitor');

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-bg-0 text-slate-200">
      {/* Ticker — hide on small mobile to save space */}
      <div className="hidden sm:block">
        <Ticker />
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3 md:px-5 h-12 bg-bg-1 border-b border-border flex-shrink-0 gap-2 safe-area-top">

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="13" fill="#00E5A0" opacity="0.9"/>
            <text x="13" y="18" textAnchor="middle" fill="#080A0D" fontSize="14" fontWeight="900" fontFamily="serif" style={{ fontStyle: 'italic' }}>P</text>
          </svg>
          <span className="text-[16px] font-black tracking-[-0.5px] text-slate-100">Pablito</span>
          {/* Status pill — desktop only */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-3 border border-border">
            <div className="live-dot" />
            <span className="text-[9px] text-cyan-400 tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
              CHECKING YOUR BAGS…
            </span>
          </div>
        </div>

        {/* Desktop chain filter — only on holdings center tab */}
        {centerTab === 'holdings' && (
          <div className="hidden md:flex gap-1 overflow-x-auto flex-1 justify-center">
            {CHAINS.map(c => {
              const label = c === 'all' ? 'ALL' : c.charAt(0).toUpperCase() + c.slice(1);
              const isActive = chainFilter === c;
              return (
                <button key={c} onClick={() => setChainFilter(c)}
                  className={`text-[9px] px-2 py-1 rounded-full transition-all border whitespace-nowrap flex-shrink-0 ${
                    isActive ? 'bg-bg-3 text-slate-200 border-border-strong' : 'text-slate-600 border-border hover:text-slate-400 hover:border-border-strong'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile chain filter — only on holdings mobile tab */}
        {activeTab === 'holdings' && (
          <div className="flex md:hidden gap-1 overflow-x-auto flex-1">
            {CHAINS.map(c => {
              const label = c === 'all' ? 'ALL' : c.slice(0, 3).toUpperCase();
              const isActive = chainFilter === c;
              return (
                <button key={c} onClick={() => setChainFilter(c)}
                  className={`text-[8px] px-2 py-0.5 rounded-full transition-all border whitespace-nowrap flex-shrink-0 ${
                    isActive ? 'bg-bg-3 text-slate-200 border-border-strong' : 'text-slate-600 border-border'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-slate-700 bg-bg-3 text-slate-300 hover:border-brand/30 hover:text-brand"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}
          >
            {profile ? (
              <>
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-[#080A0D]"
                  style={{ background: profile.avatarColor }}>
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{profile.displayName}</span>
              </>
            ) : (
              <>
                <span>⟡</span>
                <span className="hidden sm:inline">SIGN IN</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}

      {/* ── DESKTOP layout (md+): 3-column fixed ──────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">

        {/* Left — wallet sidebar */}
        <aside className="w-[260px] flex-shrink-0 border-r border-border bg-bg-1 overflow-hidden flex flex-col">
          <WalletSidebar onOpenAuth={() => setShowAuth(true)} />
        </aside>

        {/* Center */}
        <main className="flex-1 overflow-y-auto bg-bg-0">
          <div className="px-5 py-4">
            <MarketCarousel />

            {/* Tab bar */}
            <div className="flex items-center gap-0.5 mb-5 border-b border-border pb-0">
              <button onClick={() => setCenterTab('holdings')}
                className={`px-4 py-2.5 text-[10px] font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
                  centerTab === 'holdings' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Holdings
              </button>

              <button onClick={() => setCenterTab('defi')}
                className={`px-4 py-2.5 text-[10px] font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
                  centerTab === 'defi' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                ⟡ DeFi
              </button>

              <button onClick={() => setCenterTab('monitor')}
                className={`px-4 py-2.5 text-[10px] font-bold transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
                  centerTab === 'monitor' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                📡 Monitor
                <span className="live-badge">LIVE</span>
              </button>
            </div>

            {centerTab === 'holdings' && (
              <HoldingsTable chainFilter={chainFilter} onSelectFeedPair={openChartByPair} />
            )}
            {centerTab === 'defi' && <DeFiPanel />}
            {centerTab === 'monitor' && <WorldMonitor />}
          </div>
        </main>

        {/* Right — markets */}
        <aside className="w-[300px] flex-shrink-0 border-l border-border bg-bg-1 overflow-hidden flex flex-col">
          <PriceFeeds onSelectFeed={f => setChartFeed(f)} />
        </aside>
      </div>

      {/* ── MOBILE layout (<md): full-screen single panel ─────────────────── */}
      <div className="flex md:hidden flex-1 overflow-hidden flex-col">

        {/* Mobile content area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'monitor' && (
            <div className="px-4 py-4">
              <WorldMonitor />
            </div>
          )}

          {activeTab === 'holdings' && (
            <div className="px-3 py-3">
              <MarketCarousel />
              <div className="mt-3">
                <HoldingsTable chainFilter={chainFilter} onSelectFeedPair={openChartByPair} />
              </div>
            </div>
          )}

          {activeTab === 'defi' && (
            <div className="px-3 py-3">
              <DeFiPanel />
            </div>
          )}

          {activeTab === 'markets' && (
            <div className="h-full flex flex-col">
              <PriceFeeds onSelectFeed={f => setChartFeed(f)} />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="h-full flex flex-col">
              <WalletSidebar onOpenAuth={() => setShowAuth(true)} />
            </div>
          )}
        </div>

        {/* Mobile bottom navigation */}
        <nav className="flex-shrink-0 border-t border-border bg-bg-1 safe-area-bottom">
          <div className="flex items-stretch">
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all ${
                    isActive ? 'text-brand' : 'text-slate-600'
                  }`}
                >
                  <NavIcon tab={item.key} />
                  <span className="text-[9px] font-bold" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
                    {item.label}
                  </span>
                  {item.key === 'monitor' && (
                    <span className="absolute mt-[-18px] ml-[28px] w-1.5 h-1.5 rounded-full bg-brand" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {chartFeed && <ChartModal feed={chartFeed} onClose={() => setChartFeed(null)} />}
      {showAuth  && <AuthModal  onClose={() => setShowAuth(false)} />}
    </div>
  );
}
