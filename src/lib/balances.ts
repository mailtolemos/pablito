// Balance fetching — routes through /api/balance server proxy to avoid browser CORS

export async function fetchBalances(
  address: string,
  chainId: number,
  type: 'evm' | 'solana'
): Promise<Record<string, number>> {
  try {
    const params = new URLSearchParams({ address, chainId: String(chainId), type });
    const res = await fetch(`/api/balance?${params}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const { balances } = await res.json();
    return balances ?? {};
  } catch {
    return {};
  }
}
