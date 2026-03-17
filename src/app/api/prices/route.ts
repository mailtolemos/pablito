import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for Pyth Hermes — avoids CORS and rate-limit issues from the browser
export async function GET(req: NextRequest) {
  // getAll() automatically URL-decodes the values
  const ids = req.nextUrl.searchParams.getAll('ids[]');
  if (!ids.length) return NextResponse.json({ error: 'no ids' }, { status: 400 });

  // Build upstream URL — ids are plain hex strings (0x...), safe to use directly
  const qs = ids.map(id => `ids[]=${id}`).join('&');
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${qs}&parsed=true`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `hermes ${res.status}`, detail: text }, { status: res.status });
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
