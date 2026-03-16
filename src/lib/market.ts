// Alternative.me — Fear & Greed Index (free, no API key)
export type FearGreedData = {
  value: number;
  label: string;
  prev: number;
  updatedAt: string;
};

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=2', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return {
      value:     parseInt(data[0].value),
      label:     data[0].value_classification,
      prev:      parseInt(data[1]?.value ?? data[0].value),
      updatedAt: new Date(parseInt(data[0].timestamp) * 1000).toLocaleDateString(),
    };
  } catch { return null; }
}

// CoinGecko — Global market data (free demo tier, no key for /global)
export type GlobalMarket = {
  totalMcap:     number;
  totalVol24h:   number;
  btcDominance:  number;
  ethDominance:  number;
  activeCryptos: number;
  mcapChange24h: number;
  defiVol24h:    number;
};

export async function fetchGlobalMarket(): Promise<GlobalMarket | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return {
      totalMcap:     data.total_market_cap?.usd ?? 0,
      totalVol24h:   data.total_volume?.usd ?? 0,
      btcDominance:  data.market_cap_percentage?.btc ?? 0,
      ethDominance:  data.market_cap_percentage?.eth ?? 0,
      activeCryptos: data.active_cryptocurrencies ?? 0,
      mcapChange24h: data.market_cap_change_percentage_24h_usd ?? 0,
      defiVol24h:    (data.total_volume?.usd ?? 0) * 0.12, // approx
    };
  } catch { return null; }
}
