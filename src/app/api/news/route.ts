import { NextResponse } from 'next/server';

export type NewsItem = {
  title:       string;
  url:         string;
  source:      string;
  sourceColor: string;
  publishedAt: string;   // ISO string
  summary:     string;
  category:    'markets' | 'crypto' | 'economy' | 'general';
};

// ─── Feed registry ────────────────────────────────────────────────────────────

const FEEDS = [
  // ── Crypto ──────────────────────────────────────────────────────────────
  {
    url:      'https://watcher.guru/news/feed',
    source:   'WatcherGuru',
    color:    '#E040FB',
    category: 'crypto' as const,
  },
  {
    url:      'https://www.coindesk.com/arc/outboundfeeds/rss/',
    source:   'CoinDesk',
    color:    '#00D395',
    category: 'crypto' as const,
  },
  {
    url:      'https://cointelegraph.com/rss',
    source:   'CoinTelegraph',
    color:    '#0ABDE3',
    category: 'crypto' as const,
  },
  {
    url:      'https://decrypt.co/feed',
    source:   'Decrypt',
    color:    '#FF6B35',
    category: 'crypto' as const,
  },
  {
    url:      'https://www.theblock.co/rss.xml',
    source:   'The Block',
    color:    '#1A73E8',
    category: 'crypto' as const,
  },
  // ── Markets ─────────────────────────────────────────────────────────────
  {
    url:      'https://feeds.reuters.com/reuters/businessNews',
    source:   'Reuters',
    color:    '#FF8000',
    category: 'markets' as const,
  },
  {
    url:      'https://feeds.apnews.com/rss/apf-business',
    source:   'AP News',
    color:    '#CC0000',
    category: 'markets' as const,
  },
  {
    url:      'https://www.cnbc.com/id/10001147/device/rss/rss.html',
    source:   'CNBC',
    color:    '#0070D2',
    category: 'markets' as const,
  },
  {
    url:      'https://finance.yahoo.com/rss/topstories',
    source:   'Yahoo Finance',
    color:    '#7B0099',
    category: 'markets' as const,
  },
  {
    url:      'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    source:   'WSJ Markets',
    color:    '#333333',
    category: 'markets' as const,
  },
];

// ─── XML helpers ──────────────────────────────────────────────────────────────

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractField(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(block);
  return m ? stripCdata(stripHtml(m[1])).trim() : '';
}

function extractLink(block: string): string {
  const plain = /<link>([^<]+)<\/link>/i.exec(block);
  if (plain?.[1]?.trim().startsWith('http')) return plain[1].trim();

  const attr = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
  if (attr?.[1]) return attr[1];

  const guid = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i.exec(block);
  if (guid?.[1]) return guid[1].trim();

  return '';
}

function parseDate(s: string): Date {
  if (!s) return new Date(0);
  try { return new Date(s); } catch { return new Date(0); }
}

function parseRSS(xml: string, source: string, sourceColor: string, category: NewsItem['category']): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = re.exec(xml)) !== null && count < 15) {
    const block = m[1];
    const title = extractField(block, 'title');
    const url   = extractLink(block);
    const pub   = extractField(block, 'pubDate') || extractField(block, 'dc:date') || extractField(block, 'published');
    const desc  = extractField(block, 'description') || extractField(block, 'content:encoded') || extractField(block, 'summary');

    if (!title || !url.startsWith('http')) continue;

    items.push({
      title:       title.slice(0, 140),
      url,
      source,
      sourceColor,
      publishedAt: parseDate(pub).toISOString(),
      summary:     desc.slice(0, 200),
      category,
    });
    count++;
  }
  return items;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        cache: 'no-store',
        headers: {
          'Accept':     'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; pablito-news/1.0)',
        },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error(`${feed.source}: ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml, feed.source, feed.color, feed.category);
    })
  );

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  const valid = all
    .filter(a => a.publishedAt !== new Date(0).toISOString() && a.title.length > 5)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const seen = new Set<string>();
  const deduped = valid.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60).replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json(
    { articles: deduped.slice(0, 60), lastUpdated: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
