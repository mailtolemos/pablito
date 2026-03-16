'use client';

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useBalance, useChainId, useChains } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWalletStore, WalletEntry } from '@/lib/store';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FEED_IDS } from '@/lib/pyth';
import { CHAIN_NAMES, CHAIN_COLORS } from '@/lib/wagmi';
import { fmtAddr, fmtUSD, fmtAmount } from '@/lib/fmt';
import { Plus, Trash2, ChevronRight, Wallet, Cloud } from 'lucide-react';
import clsx from 'clsx';

// Fetch native ETH balance for a connected wallet
function WalletBalanceSync({ entry }: { entry: WalletEntry }) {
  const { data: balData } = useBalance({
    address: entry.address as `0x${string}`,
    chainId: entry.chainId,
    query: { refetchInterval: 30_000 },
  });
  const { updateBalances } = useWalletStore();

  useEffect(() => {
    if (!balData) return;
    const sym = balData.symbol; // ETH, MATIC, etc.
    updateBalances(entry.id, { [sym]: parseFloat(balData.formatted) });
  }, [balData, entry.id, updateBalances]);

  return null;
}

function WalletCard({ entry, onRemove }: { entry: WalletEntry; onRemove: () => void }) {
  const { prices } = useLivePrices();
  const [showRemove, setShowRemove] = useState(false);

  // Compute USD value of known balances
  let totalUSD = 0;
  const balanceRows: { sym: string; amount: number; usd: number }[] = [];
  for (const [sym, amt] of Object.entries(entry.balances ?? {})) {
    const pair = sym + '/USD';
    const fid = FEED_IDS[pair];
    const p = fid ? (prices[fid]?.price ?? 0) : 0;
    const usd = p * amt;
    totalUSD += usd;
    balanceRows.push({ sym, amount: amt, usd });
  }

  const chainColor = CHAIN_COLORS[entry.chainId] ?? '#64748b';
  const chainName = CHAIN_NAMES[entry.chainId] ?? `Chain ${entry.chainId}`;

  return (
    <div
      className="rounded-xl border border-border bg-bg-2 p-3 mb-2 relative group cursor-pointer hover:border-border-strong transition-colors"
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
    >
      {/* Chain color strip */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r" style={{ background: chainColor }} />

      {/* Header */}
      <div className="flex items-center gap-2 pl-2 mb-2">
        <div
          className="text-sm w-7 h-7 rounded-lg flex items-center justify-center border border-border"
          style={{ background: chainColor + '20' }}
        >
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
            {totalUSD > 0 ? fmtUSD(totalUSD) : '—'}
          </div>
        </div>
      </div>

      {/* Balances */}
      {balanceRows.length > 0 && (
        <div className="pl-2 space-y-1">
          {balanceRows.map(b => (
            <div key={b.sym} className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
                {fmtAmount(b.amount)} {b.sym}
              </span>
              <span className="text-[9px] text-slate-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {b.usd > 0 ? fmtUSD(b.usd) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Remove button */}
      {showRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* Balance sync in background */}
      <WalletBalanceSync entry={entry} />
    </div>
  );
}

export function WalletSidebar() {
  const { open } = useWeb3Modal();
  const { address, isConnected, chainId, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { wallets, addWallet, removeWallet } = useWalletStore();
  const { prices } = useLivePrices();

  // When wagmi connects, auto-add to store
  useEffect(() => {
    if (!isConnected || !address || !chainId) return;
    addWallet({
      id: `${address}-${chainId}`,
      address,
      chainId,
      label: connector?.name ?? 'Wallet',
      type: 'evm',
      addedAt: new Date().toISOString(),
      balances: {},
    });
  }, [isConnected, address, chainId, connector, addWallet]);

  // Total portfolio across all stored wallets
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
    const cn = CHAIN_NAMES[w.chainId] ?? 'Other';
    acc[cn] = (acc[cn] ?? 0) + usd;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Portfolio Value */}
      <div className="px-4 py-4 border-b border-border">
        <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
          Pablito found
        </div>
        <div
          className="text-[26px] font-black text-slate-100 leading-none mb-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {wallets.length ? fmtUSD(totalUSD) : '—'}
        </div>
        {wallets.length > 0 && (
          <div className="text-[10px] text-brand" style={{ fontFamily: 'var(--font-mono)' }}>
            {wallets.length} bag{wallets.length !== 1 ? 's' : ''} checked
          </div>
        )}
      </div>

      {/* Connect button */}
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={() => open()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand/30 bg-brand/8 text-brand text-[11px] font-bold hover:bg-brand/15 hover:border-brand/50 transition-all"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
        >
          <Plus size={13} />
          ADD A BAG
        </button>
      </div>

      {/* Wallet list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
            <Wallet size={28} className="text-slate-700" />
            <div>
              <div className="text-[11px] font-bold text-slate-500">No bags yet</div>
              <div className="text-[9px] text-slate-700 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                Pablito is ready to check your bags.<br />Add MetaMask, Rabby, WalletConnect & more</div>
            </div>
          </div>
        ) : (
          wallets.map(w => (
            <WalletCard
              key={w.id}
              entry={w}
              onRemove={() => {
                removeWallet(w.id);
                if (w.address === address) disconnect();
              }}
            />
          ))
        )}
      </div>

      {/* Chain breakdown */}
      {Object.keys(chainBreakdown).length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            Bags by chain
          </div>
          <div className="space-y-1">
            {Object.entries(chainBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([chain, usd]) => (
                <div key={chain} className="flex justify-between">
                  <span className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>{chain}</span>
                  <span className="text-[10px] text-slate-300 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                    {fmtUSD(usd)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Storage note */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Cloud size={10} className="text-slate-600" />
          <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            Pablito keeps your bags in browser storage
          </span>
        </div>
      </div>
    </div>
  );
}
