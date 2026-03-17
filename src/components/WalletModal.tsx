'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useWalletStore } from '@/lib/store';
import { fetchBalances } from '@/lib/balances';

// ─── Chain definitions ──────────────────────────────────────────────────────

type ChainDef = {
  id: number;
  name: string;
  color: string;
  symbol: string;
  type: 'evm' | 'solana';
  rpcName?: string;
};

const CHAINS: ChainDef[] = [
  { id: 1,     name: 'Ethereum',  color: '#627EEA', symbol: 'ETH',   type: 'evm' },
  { id: 42161, name: 'Arbitrum',  color: '#28A0F0', symbol: 'ETH',   type: 'evm' },
  { id: 8453,  name: 'Base',      color: '#0052FF', symbol: 'ETH',   type: 'evm' },
  { id: 10,    name: 'Optimism',  color: '#FF0420', symbol: 'ETH',   type: 'evm' },
  { id: 137,   name: 'Polygon',   color: '#8247E5', symbol: 'MATIC', type: 'evm' },
  { id: 56,    name: 'BNB Chain', color: '#F3BA2F', symbol: 'BNB',   type: 'evm' },
  { id: 900,   name: 'Solana',    color: '#9945FF', symbol: 'SOL',   type: 'solana' },
];

// ─── Wallet connectors per type ─────────────────────────────────────────────

type WalletConnector = {
  id: string;
  name: string;
  icon: string;
  type: 'evm' | 'solana' | 'both' | 'manual';
  detect?: () => boolean;
  connect: (chainId: number) => Promise<{ address: string; label: string }>;
};

declare global {
  interface Window {
    phantom?: { solana?: { connect: () => Promise<{ publicKey: { toString: () => string } }>; isPhantom?: boolean } };
    solflare?: { connect: () => Promise<void>; publicKey?: { toString: () => string }; isSolflare?: boolean };
    backpack?: { solana?: { connect: () => Promise<{ publicKey: { toString: () => string } }> } };
    solana?: { connect: () => Promise<{ publicKey: { toString: () => string } }> };
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean; isBraveWallet?: boolean };
    coinbaseWalletExtension?: { request: (args: { method: string }) => Promise<unknown> };
    rabby?: { request: (args: { method: string }) => Promise<unknown> };
  }
}

const WALLET_CONNECTORS: WalletConnector[] = [
  // ── EVM ──
  {
    id: 'metamask', name: 'MetaMask', icon: '🦊', type: 'evm',
    detect: () => !!(typeof window !== 'undefined' && window.ethereum?.isMetaMask && !window.ethereum?.isBraveWallet),
    connect: async (chainId) => {
      const accs = await window.ethereum!.request({ method: 'eth_requestAccounts' }) as string[];
      // Try to switch chain
      try {
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + chainId.toString(16) }],
        });
      } catch { /* ignore if not supported */ }
      return { address: accs[0], label: 'MetaMask' };
    },
  },
  {
    id: 'rabby', name: 'Rabby', icon: '🐰', type: 'evm',
    detect: () => !!(typeof window !== 'undefined' && (window.rabby || (window.ethereum && !window.ethereum?.isMetaMask))),
    connect: async (chainId) => {
      const provider = window.rabby ?? window.ethereum;
      const accs = await provider!.request({ method: 'eth_requestAccounts' }) as string[];
      return { address: accs[0], label: 'Rabby' };
    },
  },
  {
    id: 'coinbase', name: 'Coinbase', icon: '🔵', type: 'evm',
    detect: () => !!(typeof window !== 'undefined' && window.coinbaseWalletExtension),
    connect: async () => {
      const accs = await window.coinbaseWalletExtension!.request({ method: 'eth_requestAccounts' }) as string[];
      return { address: accs[0], label: 'Coinbase Wallet' };
    },
  },
  {
    id: 'brave', name: 'Brave', icon: '🦁', type: 'evm',
    detect: () => !!(typeof window !== 'undefined' && window.ethereum?.isBraveWallet),
    connect: async () => {
      const accs = await window.ethereum!.request({ method: 'eth_requestAccounts' }) as string[];
      return { address: accs[0], label: 'Brave Wallet' };
    },
  },
  {
    id: 'injected', name: 'Browser Wallet', icon: '🌐', type: 'evm',
    detect: () => !!(typeof window !== 'undefined' && window.ethereum),
    connect: async () => {
      const accs = await window.ethereum!.request({ method: 'eth_requestAccounts' }) as string[];
      return { address: accs[0], label: 'Injected Wallet' };
    },
  },
  // ── Solana ──
  {
    id: 'phantom', name: 'Phantom', icon: '👻', type: 'solana',
    detect: () => !!(typeof window !== 'undefined' && window.phantom?.solana?.isPhantom),
    connect: async () => {
      const resp = await window.phantom!.solana!.connect();
      return { address: resp.publicKey.toString(), label: 'Phantom' };
    },
  },
  {
    id: 'solflare', name: 'Solflare', icon: '🌟', type: 'solana',
    detect: () => !!(typeof window !== 'undefined' && window.solflare?.isSolflare),
    connect: async () => {
      await window.solflare!.connect();
      return { address: window.solflare!.publicKey!.toString(), label: 'Solflare' };
    },
  },
  {
    id: 'backpack', name: 'Backpack', icon: '🎒', type: 'solana',
    detect: () => !!(typeof window !== 'undefined' && window.backpack?.solana),
    connect: async () => {
      const resp = await window.backpack!.solana!.connect();
      return { address: resp.publicKey.toString(), label: 'Backpack' };
    },
  },
  {
    id: 'solana-injected', name: 'Solana Wallet', icon: '◎', type: 'solana',
    detect: () => !!(typeof window !== 'undefined' && window.solana),
    connect: async () => {
      const resp = await window.solana!.connect();
      return { address: resp.publicKey.toString(), label: 'Solana Wallet' };
    },
  },
  // ── Manual ──
  {
    id: 'manual', name: 'Enter address', icon: '✏️', type: 'manual',
    detect: () => true,
    connect: async () => ({ address: '', label: 'Watch-only' }),
  },
];

// ─── Main Modal ──────────────────────────────────────────────────────────────

type Step = 'chain' | 'wallet' | 'manual' | 'connecting' | 'done' | 'error';

interface Props {
  onClose: () => void;
}

export function WalletModal({ onClose }: Props) {
  const { addWallet, updateBalances } = useWalletStore();
  const [step, setStep] = useState<Step>('chain');
  const [selectedChain, setSelectedChain] = useState<ChainDef | null>(null);
  const [manualAddr, setManualAddr] = useState('');
  const [manualLabel, setManualLabel] = useState('');
  const [status, setStatus] = useState('');
  const [detected, setDetected] = useState<WalletConnector[]>([]);

  useEffect(() => {
    const d = WALLET_CONNECTORS.filter(w => w.detect?.() ?? false);
    setDetected(d);
  }, []);

  function getWalletsForChain(chain: ChainDef) {
    if (chain.type === 'solana') {
      return detected.filter(w => w.type === 'solana' || w.type === 'manual');
    }
    // For EVM, deduplicate — prefer specific ones
    const evm = detected.filter(w => w.type === 'evm' || w.type === 'manual');
    // If MetaMask detected, remove generic injected
    if (evm.find(w => w.id === 'metamask') || evm.find(w => w.id === 'rabby')) {
      return evm.filter(w => w.id !== 'injected');
    }
    return evm.length ? evm : detected.filter(w => w.type === 'manual');
  }

  async function handleConnect(wallet: WalletConnector) {
    if (!selectedChain) return;

    if (wallet.id === 'manual') {
      setStep('manual');
      return;
    }

    setStep('connecting');
    setStatus(`Connecting ${wallet.name}…`);

    try {
      const { address, label } = await wallet.connect(selectedChain.id);
      if (!address) {
        setStep('error');
        setStatus('No address returned from wallet.');
        return;
      }

      setStatus('Fetching balance…');

      const entry = {
        id: `${address.toLowerCase()}-${selectedChain.id}`,
        address,
        chainId: selectedChain.id,
        label: `${label} (${selectedChain.name})`,
        type: selectedChain.type,
        addedAt: new Date().toISOString(),
        balances: {},
      };

      addWallet(entry);

      // Fetch balance in background
      fetchBalances(address, selectedChain.id, selectedChain.type)
        .then(bals => updateBalances(entry.id, bals))
        .catch(() => {});

      setStep('done');
      setStatus(`${wallet.name} connected on ${selectedChain.name}`);
      setTimeout(onClose, 1200);
    } catch (e: unknown) {
      setStep('error');
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg.slice(0, 120));
    }
  }

  async function handleManualAdd() {
    if (!selectedChain || !manualAddr.trim()) return;
    const address = manualAddr.trim();
    const label = manualLabel.trim() || 'Watch-only';

    const entry = {
      id: `${address.toLowerCase()}-${selectedChain.id}`,
      address,
      chainId: selectedChain.id,
      label: `${label} (${selectedChain.name})`,
      type: selectedChain.type,
      addedAt: new Date().toISOString(),
      balances: {},
    };

    addWallet(entry);
    fetchBalances(address, selectedChain.id, selectedChain.type)
      .then(bals => updateBalances(entry.id, bals))
      .catch(() => {});

    setStep('done');
    setStatus(`${label} added on ${selectedChain.name}`);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-[440px] bg-[#0E1117] border border-[#1E2530] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2530]">
          <div>
            <div className="text-[14px] font-black text-slate-100">Add a Bag</div>
            <div className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
              Pablito is checking your bags…
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">

          {/* STEP: chain */}
          {step === 'chain' && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                1 / 2 — Choose chain
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHAINS.map(chain => (
                  <button
                    key={chain.id}
                    onClick={() => { setSelectedChain(chain); setStep('wallet'); }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#1E2530] bg-[#080A0D] hover:border-[#2E3540] hover:bg-[#111620] transition-all text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 border"
                      style={{ background: chain.color + '20', borderColor: chain.color + '40', color: chain.color }}
                    >
                      {chain.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-200">{chain.name}</div>
                      <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>{chain.symbol}</div>
                    </div>
                    <ChevronRight size={12} className="ml-auto text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: wallet */}
          {step === 'wallet' && selectedChain && (
            <div>
              <button
                onClick={() => setStep('chain')}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors mb-3"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ← back
              </button>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                2 / 2 — Connect wallet on{' '}
                <span style={{ color: selectedChain.color }}>{selectedChain.name}</span>
              </div>

              <div className="space-y-2">
                {getWalletsForChain(selectedChain).map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleConnect(w)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#1E2530] bg-[#080A0D] hover:border-[#2E3540] hover:bg-[#111620] transition-all text-left"
                  >
                    <span className="text-2xl w-8 text-center">{w.icon}</span>
                    <div>
                      <div className="text-[13px] font-bold text-slate-200">{w.name}</div>
                      <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
                        {w.id === 'manual' ? 'Read-only, any address' : 'Browser extension'}
                      </div>
                    </div>
                    <ChevronRight size={13} className="ml-auto text-slate-600" />
                  </button>
                ))}

                {getWalletsForChain(selectedChain).length === 0 && (
                  <div className="text-center py-6 text-slate-600 text-[12px]">
                    No {selectedChain.name} wallets detected.<br />
                    <button onClick={() => handleConnect(WALLET_CONNECTORS.find(w => w.id === 'manual')!)} className="text-cyan-400 hover:underline mt-1">
                      Enter address manually
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: manual address */}
          {step === 'manual' && selectedChain && (
            <div>
              <button
                onClick={() => setStep('wallet')}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors mb-3"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ← back
              </button>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                Watch-only address on{' '}
                <span style={{ color: selectedChain.color }}>{selectedChain.name}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block" style={{ fontFamily: 'var(--font-mono)' }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    value={manualAddr}
                    onChange={e => setManualAddr(e.target.value)}
                    placeholder={selectedChain.type === 'solana' ? 'Solana public key…' : '0x…'}
                    className="w-full bg-[#080A0D] border border-[#1E2530] rounded-xl px-3 py-2.5 text-[12px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block" style={{ fontFamily: 'var(--font-mono)' }}>
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    value={manualLabel}
                    onChange={e => setManualLabel(e.target.value)}
                    placeholder="e.g. Cold storage, DeFi wallet…"
                    className="w-full bg-[#080A0D] border border-[#1E2530] rounded-xl px-3 py-2.5 text-[12px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <button
                  onClick={handleManualAdd}
                  disabled={!manualAddr.trim()}
                  className="w-full py-2.5 rounded-xl bg-brand/15 border border-brand/30 text-brand text-[12px] font-bold hover:bg-brand/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  ADD WATCH-ONLY BAG
                </button>
              </div>
            </div>
          )}

          {/* STEP: connecting */}
          {step === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 size={36} className="text-brand animate-spin" />
              <div className="text-[13px] text-slate-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {status}
              </div>
            </div>
          )}

          {/* STEP: done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle size={40} className="text-brand" />
              <div className="text-[13px] text-slate-300 font-bold">{status}</div>
              <div className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
                Pablito is checking your bags…
              </div>
            </div>
          )}

          {/* STEP: error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <AlertCircle size={36} className="text-red-400" />
              <div className="text-[12px] text-slate-400 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
                {status}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('wallet')}
                  className="px-4 py-2 rounded-lg border border-border text-slate-400 text-[11px] hover:text-slate-200 hover:border-border-strong transition-colors"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Try again
                </button>
                <button
                  onClick={() => setStep('manual')}
                  className="px-4 py-2 rounded-lg border border-brand/30 text-brand text-[11px] hover:bg-brand/10 transition-colors"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Enter manually
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
