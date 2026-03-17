import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for Pyth Benchmarks TradingView shim
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get('symbol');
  const resolution = searchParams.get('resolution') ?? '60';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!symbol || !from || !to) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const url = `https://benchmarks.pyth.network/v1/shims/tradingview/history?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ s: 'no_data' }, { status: 200 });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return NextResponse.json({ s: 'error' }, { status: 502 });
  }
}
