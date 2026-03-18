'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWalletStore, WalletEntry } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeFiToken = {
  symbol: string;
  name:   string;
  amount: number;
  price:  number;
  value:  number;
  logo?:  string;
};

type DeFiPosition = {
  type:       string;
  netValue:   number;
  assetValue: number;
  debtValue:  number;
  supplied:   DeFiToken[];
  borrowed:   DeFiToken[];
  rewards:    DeFiToken[];
  staked:     DeFiToken[];
};

type DeFiProtocol = {
  id:        string;
  name:      string;
  logo:      string;
  url:       string;
  chain:     string;
  netValue:  number;
  positions: DeFiPosition[];
};

type DeFiData = {
  protocols:  DeFiProtocol[];
  totalValue: number;
  error?:     string;
};

// ─── Solana types ─────────────────────────────────────────────────────────────

type SolDeFiToken = {
  mint:        string;
  symbol:      string;
  name:        string;
  amount:      number;
  price:       number;
  value:       number;
  protocol:    string;
  protocolUrl: string;
  type:        string;
};

type SolDeFiResult = {
  positions:  SolDeFiToken[];
  totalValue: number;
  error?:     string;
};

// ─── Chain badge colors ───────────────────────────────────────────────────────

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: '#627EEA', Arbitrum: '#28A0F0', Optimism: '#FF0420',
  Polygon:  '#8247E5', Base:     '#0052FF', BNB:      '#F3BA2F',
  Avalanche:'#E84142', Fantom:   '#1969FF', zkSync:   '#8B5CF6',
  Linea:    '#61DFFF', Scroll:   '#FFDBB0', Mantle:   '#00E0C5',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.01) return '<$0.01';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtAmt(n: number, sym: string): string {
  const s = n < 0.001 ? n.toExponential(2) : n >= 1000 ? n.toFixed(0) : n < 1 ? n.toFixed(4) : n.toFixed(3);
  return `${s} ${sym}`;
}

// ─── Token chip ───────────────────────────────────────────────────────────────

function TokenChip({ t, label }: { t: DeFiToken; label?: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-bg-3 border border-border rounded-lg px-2 py-1">
      {t.logo && (
        <img src={t.logo} alt={t.symbol} className="w-3.5 h-3.5 rounded-full"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div>
        {label && <div className="text-[8px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>{label}</div>}
        <div className="text-[10px] text-slate-300" style={{ fontFamily: 'var(--font-mono)' }}>
          {fmtAmt(t.amount, t.symbol)}
        </div>
        <div className="text-[8px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>{fmt$(t.value)}</div>
      </div>
    </div>
  );
}

// ─── Protocol card (EVM) ──────────────────────────────────────────────────────

function ProtocolCard({ protocol }: { protocol: DeFiProtocol }) {
  const [open, setOpen] = useState(false);
  const chainColor = CHAIN_COLORS[protocol.chain] ?? '#64748b';

  const totalRewards = protocol.positions.reduce(
    (s, p) => s + p.rewards.reduce((r, t) => r + t.value, 0), 0
  );
  const totalDebt = protocol.positions.reduce((s, p) => s + p.debtValue, 0);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg-1 mb-2">
      <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-bg-2 transition-colors"
        onClick={() => setOpen(v => !v)}>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-bg-3 border border-border">
          {protocol.logo ? (
            <img src={protocol.logo} alt={protocol.name} className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
              {protocol.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-200">{protocol.name}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: chainColor + '22', color: chainColor, fontFamily: 'var(--font-mono)' }}>
              {protocol.chain}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
              {protocol.positions.map(p => p.type).join(' · ')}
            </span>
            {totalRewards > 0.01 && (
              <span className="text-[9px] font-bold" style={{ color: '#00E5A0', fontFamily: 'var(--font-mono)' }}>
                +{fmt$(totalRewards)} rewards
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-[13px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
              {fmt$(protocol.netValue)}
            </div>
            {totalDebt > 0.01 && (
              <div className="text-[9px]" style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                -{fmt$(totalDebt)} debt
              </div>
            )}
          </div>
          <a href={protocol.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-border bg-bg-3 hover:border-brand hover:text-brand text-slate-500 transition-all"
            title={`Open ${protocol.name}`}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.5 2.5h7v7M9.5 2.5l-7 7" />
            </svg>
          </a>
          <span className="text-slate-600 text-[10px]">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-3 py-2.5 space-y-3 bg-bg-0">
          {protocol.positions.map((pos, i) => (
            <div key={i}>
              <div className="text-[9px] tracking-widest text-slate-500 uppercase mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                {pos.type} · {fmt$(pos.netValue)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pos.supplied.map((t, j)  => <TokenChip key={`s${j}`} t={t} label="supplied" />)}
                {pos.staked.map((t, j)    => <TokenChip key={`k${j}`} t={t} label="staked" />)}
                {pos.borrowed.map((t, j)  => <TokenChip key={`b${j}`} t={t} label="borrowed" />)}
                {pos.rewards.map((t, j)   => <TokenChip key={`r${j}`} t={t} label="rewards" />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Solana position card ─────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  staked: 'Liquid Staking',
  lp:     'Liquidity Pool',
  yield:  'Yield Farming',
  lending:'Lending',
};

function SolPositionCard({ pos }: { pos: SolDeFiToken }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg-1 mb-2">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Protocol dot */}
        <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-bg-3 border border-border flex items-center justify-center text-[11px] font-black text-slate-400"
          style={{ fontFamily: 'var(--font-mono)' }}>
          {pos.symbol.slice(0, 3)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-200">{pos.symbol}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: '#9945FF22', color: '#9945FF', fontFamily: 'var(--font-mono)' }}>
              SOL
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-slate-500 border border-border"
              style={{ fontFamily: 'var(--font-mono)' }}>
              {TYPE_LABELS[pos.type] ?? pos.type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <a href={pos.protocolUrl} target="_blank" rel="noreferrer"
              className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}>
              {pos.protocol} ↗
            </a>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-[13px] font-bold text-slate-200" style={{ fontFamily: 'var(--font-mono)' }}>
            {fmt$(pos.value)}
          </div>
          <div className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            {fmtAmt(pos.amount, pos.symbol)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function DeFiSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="border border-border rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-3" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-bg-3 rounded w-24" />
              <div className="h-2 bg-bg-3 rounded w-16" />
            </div>
            <div className="h-4 bg-bg-3 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fallback links ───────────────────────────────────────────────────────────

const TRACKERS = [
  { name: 'DeBank',  url: (a: string) => `https://debank.com/profile/${a}`,    color: '#00E5A0' },
  { name: 'Zapper',  url: (a: string) => `https://zapper.xyz/account/${a}`,    color: '#784FFB' },
  { name: 'Zerion',  url: (a: string) => `https://app.zerion.io/${a}`,         color: '#4C82FB' },
];

const SOL_TRACKERS = [
  { name: 'Step Finance', url: (a: string) => `https://app.step.finance/en/dashboard?watching=${a}`, color: '#00E5A0' },
  { name: 'Sonar Watch',  url: (a: string) => `https://sonar.watch/profile/${a}`,                   color: '#5E72EB' },
  { name: 'AssetDash',    url: (a: string) => `https://www.assetdash.com/portfolio/${a}`,            color: '#9945FF' },
];

function FallbackLinks({ address, error, isSolana = false }: { address: string; error: string; isSolana?: boolean }) {
  const trackers = isSolana ? SOL_TRACKERS : TRACKERS;
  return (
    <div className="rounded-xl border border-border bg-bg-1 p-4">
      <div className="text-[10px] text-slate-500 mb-3 font-mono">
        {error?.includes('429') ? '⚠ Rate limit reached' : isSolana ? '⚠ Could not scan on-chain positions' : '⚠ Could not fetch live positions'}
        {' — view on external tracker:'}
      </div>
      <div className="flex flex-col gap-2">
        {trackers.map(t => (
          <a key={t.name} href={t.url(address)} target="_blank" rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-border-strong bg-bg-3 transition-all group">
            <span className="text-[12px] font-bold" style={{ color: t.color }}>{t.name}</span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#64748b" strokeWidth="1.5">
              <path d="M2.5 2.5h7v7M9.5 2.5l-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Per-wallet EVM DeFi ──────────────────────────────────────────────────────

function EvmWalletDeFi({ wallet }: { wallet: WalletEntry }) {
  const { data, isLoading, error } = useQuery<DeFiData>({
    queryKey:        ['defi-evm', wallet.address],
    queryFn:         async () => {
      const res = await fetch(`/api/defi?address=${encodeURIComponent(wallet.address)}`);
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           2,
  });

  if (isLoading) return <DeFiSkeleton />;

  if (!data || error || data.error) {
    return <FallbackLinks address={wallet.address} error={String(data?.error ?? error ?? '')} />;
  }

  if (data.protocols.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-1 p-4 text-center">
        <div className="text-[13px] text-slate-500 mb-1">No DeFi positions found</div>
        <div className="text-[10px] text-slate-600 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
        </div>
        <div className="flex justify-center gap-2">
          {TRACKERS.map(t => (
            <a key={t.name} href={t.url(wallet.address)} target="_blank" rel="noreferrer"
              className="text-[9px] px-2 py-1 rounded border border-border text-slate-500 hover:text-slate-300 hover:border-border-strong transition-all"
              style={{ fontFamily: 'var(--font-mono)' }}>
              {t.name} ↗
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
          {data.protocols.length} protocol{data.protocols.length !== 1 ? 's' : ''} · DeBank
        </span>
        <span className="text-[13px] font-bold text-brand" style={{ fontFamily: 'var(--font-mono)' }}>
          {fmt$(data.totalValue)} total
        </span>
      </div>
      {data.protocols.map(p => <ProtocolCard key={p.id} protocol={p} />)}
      <div className="flex gap-2 mt-3 flex-wrap">
        {TRACKERS.map(t => (
          <a key={t.name} href={t.url(wallet.address)} target="_blank" rel="noreferrer"
            className="text-[9px] px-2.5 py-1.5 rounded-lg border border-border bg-bg-3 text-slate-500 hover:text-slate-300 hover:border-border-strong transition-all flex items-center gap-1"
            style={{ fontFamily: 'var(--font-mono)' }}>
            {t.name}
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2.5 2.5h7v7M9.5 2.5l-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Per-wallet Solana DeFi ───────────────────────────────────────────────────

function SolWalletDeFi({ wallet }: { wallet: WalletEntry }) {
  const { data, isLoading, error } = useQuery<SolDeFiResult>({
    queryKey:        ['defi-solana', wallet.address],
    queryFn:         async () => {
      const res = await fetch(`/api/defi-solana?address=${encodeURIComponent(wallet.address)}`);
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           2,
  });

  if (isLoading) return <DeFiSkeleton />;

  if (!data || error || data.error || data.positions.length === 0) {
    return (
      <div className="space-y-3">
        {data?.positions?.length === 0 && !data?.error && (
          <div className="rounded-xl border border-border bg-bg-1 p-4 text-center mb-2">
            <div className="text-[13px] text-slate-500 mb-1">No known DeFi positions found</div>
            <div className="text-[10px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
              mSOL · jitoSOL · stSOL · bSOL · jupSOL · JLP · and more scanned
            </div>
          </div>
        )}
        <FallbackLinks address={wallet.address} error={String(data?.error ?? error ?? '')} isSolana />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
          {data.positions.length} position{data.positions.length !== 1 ? 's' : ''} · on-chain scan
        </span>
        <span className="text-[13px] font-bold text-brand" style={{ fontFamily: 'var(--font-mono)' }}>
          {fmt$(data.totalValue)} total
        </span>
      </div>
      {data.positions.map(pos => <SolPositionCard key={pos.mint} pos={pos} />)}
      <div className="flex gap-2 mt-3 flex-wrap">
        {SOL_TRACKERS.map(t => (
          <a key={t.name} href={t.url(wallet.address)} target="_blank" rel="noreferrer"
            className="text-[9px] px-2.5 py-1.5 rounded-lg border border-border bg-bg-3 text-slate-500 hover:text-slate-300 hover:border-border-strong transition-all flex items-center gap-1"
            style={{ fontFamily: 'var(--font-mono)' }}>
            {t.name}
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2.5 2.5h7v7M9.5 2.5l-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeFiPanel() {
  const { wallets } = useWalletStore();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="text-2xl mb-3">⟡</div>
        <div className="text-[13px] font-bold text-slate-300 mb-1">No wallets connected</div>
        <div className="text-[11px] text-slate-600">
          Add a wallet to see your DeFi positions, yields, and earnings
        </div>
      </div>
    );
  }

  const activeWallet = wallets.find(w => w.id === selectedWalletId) ?? wallets[0];

  return (
    <div>
      {/* Wallet selector */}
      {wallets.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {wallets.map(w => (
            <button key={w.id} onClick={() => setSelectedWalletId(w.id)}
              className={`text-[9px] px-2.5 py-1 rounded-lg border transition-all ${
                w.id === activeWallet.id
                  ? 'bg-bg-3 border-border-strong text-slate-200'
                  : 'border-border text-slate-600 hover:text-slate-400 hover:border-border-strong'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}>
              {w.label || `${w.address.slice(0, 6)}…${w.address.slice(-4)}`}
            </button>
          ))}
        </div>
      )}

      {/* Active wallet chip */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-bg-1 border border-border">
        <div className="live-dot" />
        <span className="text-[10px] text-slate-400 font-mono flex-1 truncate">
          {activeWallet.label && <span className="text-slate-300 font-bold mr-2">{activeWallet.label}</span>}
          {activeWallet.address.slice(0, 10)}…{activeWallet.address.slice(-8)}
        </span>
        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
          style={{
            background: activeWallet.type === 'solana' ? '#9945FF22' : '#627EEA22',
            color:      activeWallet.type === 'solana' ? '#9945FF'   : '#627EEA',
            fontFamily: 'var(--font-mono)',
          }}>
          {activeWallet.type === 'solana' ? 'SOL' : 'EVM'}
        </span>
      </div>

      {activeWallet.type === 'solana'
        ? <SolWalletDeFi wallet={activeWallet} />
        : <EvmWalletDeFi wallet={activeWallet} />
      }
    </div>
  );
}
