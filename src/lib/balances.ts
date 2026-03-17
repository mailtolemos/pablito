// Direct RPC balance fetching — no wallet connection required, just an address

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

export async function fetchEVMBalance(
  address: string,
  chainId: number
): Promise<Record<string, number>> {
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

export async function fetchSolanaBalance(
  address: string
): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });
    const { result } = await res.json();
    const lamports = result?.value ?? 0;
    const sol = lamports / 1e9;
    return { SOL: sol };
  } catch {
    return {};
  }
}

export async function fetchBalances(
  address: string,
  chainId: number,
  type: 'evm' | 'solana'
): Promise<Record<string, number>> {
  if (type === 'solana') return fetchSolanaBalance(address);
  return fetchEVMBalance(address, chainId);
}
