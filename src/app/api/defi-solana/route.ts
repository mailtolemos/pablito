import { NextRequest, NextResponse } from 'next/server';

// ─── Known DeFi token mints ────────────────────────────────────────────────
// These are yield-bearing / protocol tokens that indicate DeFi positions

type TokenMeta = {
  symbol:      string;
  name:        string;
  protocol:    string;
  protocolUrl: string;
  type:        'staked' | 'lp' | 'yield' | 'lending';
  cgId:        string;
  decimals:    number;
};

const KNOWN_MINTS: Record<string, TokenMeta> = {
  // ── Liquid Staking ─────────────────────────────────────────────────────
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
    symbol: 'mSOL', name: 'Marinade Staked SOL',
    protocol: 'Marinade Finance', protocolUrl: 'https://marinade.finance',
    type: 'staked', cgId: 'msol', decimals: 9,
  },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': {
    symbol: 'jitoSOL', name: 'Jito Staked SOL',
    protocol: 'Jito', protocolUrl: 'https://www.jito.network',
    type: 'staked', cgId: 'jito-staked-sol', decimals: 9,
  },
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': {
    symbol: 'stSOL', name: 'Lido Staked SOL',
    protocol: 'Lido on Solana', protocolUrl: 'https://solana.lido.fi',
    type: 'staked', cgId: 'lido-staked-sol', decimals: 9,
  },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': {
    symbol: 'bSOL', name: 'BlazeStake SOL',
    protocol: 'BlazeStake', protocolUrl: 'https://stake.solblaze.org',
    type: 'staked', cgId: 'blaze-staked-sol', decimals: 9,
  },
  'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v': {
    symbol: 'jupSOL', name: 'Jupiter Staked SOL',
    protocol: 'Jupiter', protocolUrl: 'https://jup.ag/stake',
    type: 'staked', cgId: 'jupiter-staked-sol', decimals: 9,
  },
  'he1iusmfkpAdwvxLNGV8Y1iSbj4rAydjeNuiUKAjcc': {
    symbol: 'hSOL', name: 'Helius Staked SOL',
    protocol: 'Helius', protocolUrl: 'https://www.helius.dev',
    type: 'staked', cgId: 'msol', decimals: 9,
  },
  'Jito8mBcNNsT7Dv1C2bLz4zWbAMHtUZqSFk8RkUFsVP': {
    symbol: 'jSOL', name: 'Jpool Staked SOL',
    protocol: 'JPool', protocolUrl: 'https://jpool.one',
    type: 'staked', cgId: 'msol', decimals: 9,
  },
  // ── Jupiter Perps LP ───────────────────────────────────────────────────
  '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4': {
    symbol: 'JLP', name: 'Jupiter LP Token',
    protocol: 'Jupiter Perps', protocolUrl: 'https://jup.ag/perps',
    type: 'lp', cgId: 'jupiter-perpetuals-liquidity-provider-token', decimals: 6,
  },
  // ── Kamino / Lending ───────────────────────────────────────────────────
  'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS': {
    symbol: 'KMNO', name: 'Kamino Finance',
    protocol: 'Kamino', protocolUrl: 'https://kamino.finance',
    type: 'lending', cgId: 'kamino', decimals: 6,
  },
  // ── Raydium LP tokens (common pools) ──────────────────────────────────
  '8HoQnePLqPj4M7PUDzfw8e3Ymdwgap5dx9hFPKEAQaES': {
    symbol: 'RAY-USDC LP', name: 'Raydium RAY-USDC LP',
    protocol: 'Raydium', protocolUrl: 'https://raydium.io',
    type: 'lp', cgId: 'raydium', decimals: 6,
  },
  // ── Orca LP ────────────────────────────────────────────────────────────
  'FZthQCuYHhcfiDma7QrX7buDHwrZEd4fZe73d9fmanor': {
    symbol: 'ORCA-USDC LP', name: 'Orca ORCA-USDC Whirlpool',
    protocol: 'Orca', protocolUrl: 'https://www.orca.so',
    type: 'lp', cgId: 'orca', decimals: 6,
  },
  // ── Drift ─────────────────────────────────────────────────────────────
  'DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7': {
    symbol: 'DRIFT', name: 'Drift Protocol',
    protocol: 'Drift', protocolUrl: 'https://drift.trade',
    type: 'yield', cgId: 'drift-protocol', decimals: 6,
  },
  // ── Marginfi ──────────────────────────────────────────────────────────
  'MFGsXSHFc4mkv5GcGNY2rH7KzGQFLJcUr1LYLwVp1P': {
    symbol: 'MRGN', name: 'MarginFi',
    protocol: 'marginfi', protocolUrl: 'https://app.marginfi.com',
    type: 'lending', cgId: 'marginfi', decimals: 6,
  },
};

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const SOL_RPC_URLS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
];

// ─── Solana RPC caller ─────────────────────────────────────────────────────

async function solRpc(method: string, params: unknown[]): Promise<unknown> {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  for (const rpc of SOL_RPC_URLS) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (json.error) continue;
      return json.result;
    } catch { /* try next */ }
  }
  throw new Error('All Solana RPCs failed');
}

// ─── CoinGecko price fetcher ───────────────────────────────────────────────

async function cgPrices(cgIds: string[]): Promise<Record<string, number>> {
  if (cgIds.length === 0) return {};
  const idStr = cgIds.join(',');
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(idStr)}&vs_currencies=usd`,
      { cache: 'no-store', signal: AbortSignal.timeout(5_000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const [id, vals] of Object.entries(data as Record<string, { usd: number }>)) {
      out[id] = vals.usd ?? 0;
    }
    return out;
  } catch { return {}; }
}

// ─── Types ────────────────────────────────────────────────────────────────

export type SolDeFiToken = {
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

export type SolDeFiResult = {
  positions: SolDeFiToken[];
  totalValue: number;
};

// ─── Route ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address required', positions: [], totalValue: 0 }, { status: 400 });
  }

  try {
    // Fetch all SPL token accounts owned by this address
    const result = await solRpc('getTokenAccountsByOwner', [
      address,
      { programId: TOKEN_PROGRAM },
      { encoding: 'jsonParsed', commitment: 'confirmed' },
    ]) as {
      value: Array<{
        account: {
          data: {
            parsed: {
              info: {
                mint: string;
                tokenAmount: { uiAmount: number | null };
              };
            };
          };
        };
      }>;
    };

    const accounts = result?.value ?? [];

    // Find tokens that match our known DeFi mints
    const found: { mint: string; meta: TokenMeta; amount: number }[] = [];
    for (const acc of accounts) {
      const info = acc.account?.data?.parsed?.info;
      if (!info) continue;
      const { mint, tokenAmount } = info;
      const amount = tokenAmount?.uiAmount ?? 0;
      if (amount <= 0) continue;
      const meta = KNOWN_MINTS[mint];
      if (meta) {
        found.push({ mint, meta, amount });
      }
    }

    if (found.length === 0) {
      return NextResponse.json({ positions: [], totalValue: 0 });
    }

    // Fetch CoinGecko prices for all found tokens
    const cgIdSet = new Set(found.map(f => f.meta.cgId));
    const uniqueCgIds = Array.from(cgIdSet);
    const prices = await cgPrices(uniqueCgIds);

    // Build positions
    const positions: SolDeFiToken[] = found.map(({ mint, meta, amount }) => {
      const price = prices[meta.cgId] ?? 0;
      return {
        mint,
        symbol:      meta.symbol,
        name:        meta.name,
        amount,
        price,
        value:       amount * price,
        protocol:    meta.protocol,
        protocolUrl: meta.protocolUrl,
        type:        meta.type,
      };
    });

    // Sort by value descending
    positions.sort((a, b) => b.value - a.value);

    const totalValue = positions.reduce((s, p) => s + p.value, 0);

    return NextResponse.json({ positions, totalValue }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });

  } catch (e) {
    return NextResponse.json({ error: String(e), positions: [], totalValue: 0 });
  }
}
