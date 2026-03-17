import { NextRequest, NextResponse } from 'next/server';

// EVM RPC endpoints — called server-side (no CORS restrictions)
const EVM_RPCS: Record<number, string> = {
  1:     'https://cloudflare-eth.com',
  10:    'https://mainnet.optimism.io',
  56:    'https://bsc-dataseed.binance.org',
  137:   'https://polygon-rpc.com',
  8453:  'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc',
};

const EVM_NATIVE: Record<number, string> = {
  1:     'ETH',
  10:    'ETH',
  56:    'BNB',
  137:   'MATIC',
  8453:  'ETH',
  42161: 'ETH',
};

async function fetchEVMBalance(address: string, chainId: number): Promise<Record<string, number>> {
  const rpc = EVM_RPCS[chainId];
  if (!rpc) return {};
  try {
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
      cache: 'no-store',
    });
    const { result } = await res.json();
    if (!result) return {};
    const wei = BigInt(result);
    const amount = Number(wei) / 1e18;
    const sym = EVM_NATIVE[chainId] ?? 'ETH';
    return { [sym]: amount };
  } catch {
    return {};
  }
}

async function fetchSolanaBalance(address: string): Promise<Record<string, number>> {
  // Try multiple RPC endpoints for reliability
  const endpoints = [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
  ];
  for (const rpc of endpoints) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getBalance',
          params: [address],
        }),
        cache: 'no-store',
      });
      const { result } = await res.json();
      const lamports = result?.value ?? 0;
      const sol = lamports / 1e9;
      return { SOL: sol };
    } catch {
      continue;
    }
  }
  return {};
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const address = searchParams.get('address');
  const chainId  = parseInt(searchParams.get('chainId') ?? '0', 10);
  const type     = searchParams.get('type') as 'evm' | 'solana' | null;

  if (!address || !type) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const balances = type === 'solana'
    ? await fetchSolanaBalance(address)
    : await fetchEVMBalance(address, chainId);

  return NextResponse.json({ balances }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
