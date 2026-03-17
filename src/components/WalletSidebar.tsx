'use client';

import { useState, useEffect } from 'react';
import { useWalletStore, WalletEntry } from '@/lib/store';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FEED_IDS } from '@/lib/pyth';
import { CHAIN_NAMES, CHAIN_COLORS } from '@/lib/wagmi';
import { fetchBalances } from '@/lib/balances';
import { fmtAddr, fmtUSD, fmtAmount } from '@/lib/fmt';
import { Plus, Trash2, Wallet, RefreshCw, User } from 'lucide-react';
import { WalletModal } from './WalletModal';

const SOLANA_CHAIN_ID = 900;
const SOLANA_COLOR = '#9945FF';

function getChainColor(chainId: number) {
  return chainId === SOLANA_CHAIN_ID ? SOLANA_COLOR : (CHAIN_COLORS[chainId] ?? '#64748b');
}
function getChainName(chainId: number) {
  return chainId === SOLANA_CHAIN_ID ? 'Solana' : (CHAIN_NAMES[chainId] ?? `Chain ${chainId}`);
}

function BalanceRefresher({ entry }: { entry: WalletEntry }) {
  const { updateBalances } = useWalletStore();
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const bals = await fetchBalances(entry.address, entry.chainId, entry.type);
      if (!cancelled && Object.keys(bals).length > 0) updateBalances(entry.id, bals);
    };
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);
  return null;
}

function WalletCard({ entry, onRemove }: { entry: WalletEntry; onRemove: () => void }) {
  const { prices } = useLivePrices();
  const [showActions, setShowActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { updateBalances } = useWalletStore();

  let totalUSD = 0;
  const balanceRows: { sym: string; amount: number; usd: number }[] = [];
  for (const [sym, amt] of Object.entries(entry.balances ?? {})) {
    const fid = FEED_IDS[sym + '/USD'];
    const p = fid ? (prices[fid]?.price ?? 0) : 0;
    const usd = p * amt;
    totalUSD += usd;
    if (amt > 0) balanceRows.push({ sym, amount: amt, usd });
  }

  const chainColor = getChainColor(entry.chainId);
  const chainName = getChainName(entry.chainId);
  const hasBalances = Object.keys(entry.balances ?? {}).length > 0;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const bals = await fetchBalances(entry.address, entry.chainId, entry.type);
      if (Object.keys(bals).length > 0) updateBalances(entry.id, bals);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div
      className="rounded-xl border border-border bg-bg-2 p-3 mb-2 relative group cursor-pointer hover:border-border-strong transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r" style={{ background: chainColor }} />

      <div className="flex items-center gap-2 pl-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-border flex-shrink-0"
          style={{ background: chainColor + '20' }}>
          <Wallet size={13} style={{ color: chainColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-slate-200 truncate">{entry.label}</div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
            <span>{fmtAddr(entry.address)}</span>
            <span className="opacity-50">·</span>
            <span style={{ color: chainColor }}>{chainName}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[12px] font-bold text-brand" style={{ fontFamily: 'var(--font-mono)' }}>
            {totalUSD > 0.001 ? fmtUSD(totalUSD) : !hasBalances
              ? <span className="text-slate-700 text-[9px]">…</span>
              : '—'}
          </div>
        </div>
      </div>

      {balanceRows.length > 0 ? (
        <div className="pl-2 space-y-0.5 mt-1">
          {balanceRows.map(b => (
            <div key={b.sym} className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
                {fmtAmount(b.amount)} {b.sym}
              </span>
              <span className="text-[9px] text-slate-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {b.usd > 0.001 ? fmtUSD(b.usd) : '—'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="pl-2 mt-1">
          <span className="text-[9px] text-slate-700" style={{ fontFamily: 'var(--font-mono)' }}>
            {hasBalances ? `Pablito checked but found nothing on ${chainName}` : 'Fetching balance…'}
          </span>
        </div>
      )}

      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={e => { e.stopPropagation(); handleRefresh(); }}
            className="p-1 rounded text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors">
            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove(); }}
            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <Trash2 size={10} />
          </button>
        </div>
      )}

      <BalanceRefresher entry={entry} />
    </div>
  );
}

interface WalletSidebarProps {
  onOpenAuth: () => void;
}

export function WalletSidebar({ onOpenAuth }: WalletSidebarProps) {
  const { wallets, removeWallet, profile } = useWalletStore();
  const { prices } = useLivePrices();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const totalUSD = wallets.reduce((sum, w) => {
    for (const [sym, amt] of Object.entries(w.balances ?? {})) {
      const fid = FEED_IDS[sym + '/USD'];
      const p = fid ? (prices[fid]?.price ?? 0) : 0;
      sum += p * amt;
    }
    return sum;
  }, 0);

  const chainBreakdown = wallets.reduce<Record<string, number>>((acc, w) => {
    let usd = 0;
    for (const [sym, amt] of Object.entries(w.balances ?? {})) {
      const fid = FEED_IDS[sym + '/USD'];
      const p = fid ? (prices[fid]?.price ?? 0) : 0;
      usd += p * amt;
    }
    const cn = getChainName(w.chainId);
    acc[cn] = (acc[cn] ?? 0) + usd;
    return acc;
  }, {});

  return (
    <>
      <div className="flex flex-col h-full">
        <div onClick={onOpenAuth}
          className="px-4 py-3 border-b border-border flex items-center gap-2 cursor-pointer hover:bg-bg-2 transition-colors">
          {profile ? (
            <>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black text-[#080A0D] flex-shrink-0"
                style={{ background: profile.avatarColor }}>
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-200 truncate">{profile.displayName}</div>
                <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
                  {profile.email ?? 'Local profile'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-bg-3 border border-border flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-slate-600" />
              </div>
              <div className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
                Sign in / Create profile
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-4 border-b border-border">
          <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            Pablito found
          </div>
          <div className="text-[26px] font-black text-slate-100 leading-none mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {wallets.length ? fmtUSD(totalUSD) : '—'}
          </div>
          {wallets.length > 0 && (
            <div className="text-[10px] text-brand" style={{ fontFamily: 'var(--font-mono)' }}>
              {wallets.length} bag{wallets.length !== 1 ? 's' : ''} checked
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-2">
          <button onClick={() => setShowWalletModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand/30 bg-brand/8 text-brand text-[11px] font-bold hover:bg-brand/15 hover:border-brand/50 transition-all"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
            <Plus size={13} />
            ADD A BAG
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
              <Wallet size={28} className="text-slate-700" />
              <div>
                <div className="text-[11px] font-bold text-slate-500">No bags yet</div>
                <div className="text-[9px] text-slate-700 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                  ETH · SOL · Base · Arbitrum · more
                </div>
              </div>
            </div>
          ) : (
            wallets.map(w => (
              <WalletCard key={w.id} entry={w} onRemove={() => removeWallet(w.id)} />
            ))
          )}
        </div>

        {Object.keys(chainBreakdown).length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
              Bags by chain
            </div>
            <div className="space-y-1">
              {Object.entries(chainBreakdown).sort((a, b) => b[1] - a[1]).map(([chain, usd]) => (
                <div key={chain} className="flex justify-between">
                  <span className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>{chain}</span>
                  <span className="text-[10px] text-slate-300 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{fmtUSD(usd)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-border">
          <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            Pablito keeps your bags in browser storage
          </span>
        </div>
      </div>

      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
    </>
  );
}
