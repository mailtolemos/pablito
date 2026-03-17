import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for Pyth Hermes — avoids CORS and rate-limit issues from the browser
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.getAll('ids[]');
  if (!ids.length) return NextResponse.json({ error: 'no ids' }, { status: 400 });

  const qs = ids.map(id => `ids[]=${encodeURIComponent(id)}`).join('&');
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${qs}&parsed=true`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `hermes ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'upstream error', detail: String(e) }, { status: 502 });
  }
}
