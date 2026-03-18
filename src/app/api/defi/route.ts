import { NextRequest, NextResponse } from 'next/server';

// ─── DeBank response types ────────────────────────────────────────────────────

type DebankToken = {
  id:        string;
  chain:     string;
  name:      string;
  symbol:    string;
  price:     number;
  amount:    number;
  logo_url?: string;
};

type DebankPositionDetail = {
  supply_token_list?: DebankToken[];
  borrow_token_list?: DebankToken[];
  reward_token_list?: DebankToken[];
  token_list?:        DebankToken[];   // LP / staking positions
  description?:       string;
};

type DebankPortfolioItem = {
  name:   string;   // "Lending", "Liquidity Pool", "Staked", "Yield", "Locked", "Farming", etc.
  stats:  { asset_usd_value: number; debt_usd_value: number; net_usd_value: number };
  detail: DebankPositionDetail;
};

type DebankProtocol = {
  id:                  string;
  chain:               string;
  name:                string;
  logo_url:            string;
  site_url:            string;
  portfolio_item_list: DebankPortfolioItem[];
  tvl?:                number;
};

// ─── Public types (returned to client) ───────────────────────────────────────

export type DeFiToken = {
  symbol:   string;
  name:     string;
  amount:   number;
  price:    number;
  value:    number;
  logo?:    string;
};

export type DeFiPosition = {
  type:    string;   // "Lending", "LP", "Staked", etc.
  netValue:   number;
  assetValue: number;
  debtValue:  number;
  supplied:  DeFiToken[];
  borrowed:  DeFiToken[];
  rewards:   DeFiToken[];
  staked:    DeFiToken[];
};

export type DeFiProtocol = {
  id:        string;
  name:      string;
  logo:      string;
  url:       string;
  chain:     string;
  netValue:  number;
  positions: DeFiPosition[];
};

// ─── Chain display map ────────────────────────────────────────────────────────

const CHAIN_LABELS: Record<string, string> = {
  eth:   'Ethereum', arb: 'Arbitrum', op: 'Optimism', matic: 'Polygon',
  base:  'Base',     bsc: 'BNB',      avax: 'Avalanche', ftm: 'Fantom',
  cro:   'Cronos',   celo: 'Celo',   linea: 'Linea',    zora: 'Zora',
  era:   'zkSync',   mantle: 'Mantle', scroll: 'Scroll',
};

function mapToken(t: DebankToken): DeFiToken {
  return {
    symbol: t.symbol,
    name:   t.name,
    amount: t.amount,
    price:  t.price,
    value:  t.amount * t.price,
    logo:   t.logo_url,
  };
}

function mapProtocol(p: DebankProtocol): DeFiProtocol {
  let totalNet = 0;

  const positions: DeFiPosition[] = p.portfolio_item_list.map(item => {
    const net = item.stats.net_usd_value ?? 0;
    totalNet += net;
    return {
      type:       item.name,
      netValue:   net,
      assetValue: item.stats.asset_usd_value ?? 0,
      debtValue:  item.stats.debt_usd_value ?? 0,
      supplied:   (item.detail.supply_token_list ?? []).map(mapToken),
      borrowed:   (item.detail.borrow_token_list ?? []).map(mapToken),
      rewards:    (item.detail.reward_token_list ?? []).map(mapToken),
      staked:     (item.detail.token_list ?? []).map(mapToken),
    };
  });

  return {
    id:        p.id,
    name:      p.name,
    logo:      p.logo_url,
    url:       p.site_url,
    chain:     CHAIN_LABELS[p.chain] ?? p.chain,
    netValue:  totalNet,
    positions,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'missing address' }, { status: 400 });

  const url = `https://openapi.debank.com/v1/user/all_complex_protocol_list?id=${encodeURIComponent(address)}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept':     'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; pablito/1.0)',
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `DeBank returned ${res.status}`, protocols: [] },
        { status: 200 }   // return 200 so client still renders fallback links
      );
    }

    const raw: DebankProtocol[] = await res.json();

    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: 'unexpected response', protocols: [] });
    }

    const protocols = raw
      .map(mapProtocol)
      .filter(p => p.netValue > 0.01)          // skip dust positions
      .sort((a, b) => b.netValue - a.netValue); // biggest first

    const totalValue = protocols.reduce((s, p) => s + p.netValue, 0);

    return NextResponse.json({ protocols, totalValue }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });

  } catch (e) {
    // Return graceful error — client will show fallback tracker links
    return NextResponse.json(
      { error: String(e), protocols: [], totalValue: 0 },
      { status: 200 }
    );
  }
}
