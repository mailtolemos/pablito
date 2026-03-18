'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

type Indicator = {
  key:       string;
  label:     string;
  value:     number;
  change:    number;
  changePct: number;
  suffix:    string;
  group:     'yields' | 'indices' | 'fear' | 'commodities';
};

type NewsItem = {
  title:       string;
  url:         string;
  source:      string;
  sourceColor: string;
  publishedAt: string;
  summary:     string;
  category:    'markets' | 'crypto' | 'economy' | 'general';
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchIndicators(): Promise<{ indicators: Indicator[]; lastUpdated: string }> {
  const res = await fetch('/api/indicators', { cache: 'no-store' });
  if (!res.ok) throw new Error('indicators fetch failed');
  return res.json();
}

async function fetchNews(): Promise<{ articles: NewsItem[]; lastUpdated: string }> {
  const res = await fetch('/api/news', { cache: 'no-store' });
  if (!res.ok) throw new Error('news fetch failed');
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtValue(v: number, suffix: string, group: string): string {
  if (group === 'indices') {
    return v >= 10_000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 })
         : v >= 1_000  ? v.toLocaleString('en-US', { maximumFractionDigits: 1 })
         :               v.toFixed(2);
  }
  if (suffix === '%') return v.toFixed(2) + '%';
  if (v >= 1_000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v.toFixed(v < 10 ? 3 : 2);
}

function fmtChange(ind: Indicator): string {
  const sign = ind.changePct >= 0 ? '+' : '';
  if (ind.group === 'yields') {
    // Show in basis points for yields
    const bps = Math.round(ind.change * 100);
    return `${bps >= 0 ? '+' : ''}${bps}bps`;
  }
  return `${sign}${ind.changePct.toFixed(2)}%`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}d`;
  if (h > 0)  return `${h}h`;
  if (m > 0)  return `${m}m`;
  return 'now';
}

function clockNow() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ─── Indicator tile ───────────────────────────────────────────────────────────

function IndicatorTile({ ind }: { ind: Indicator }) {
  const isUp = ind.changePct >= 0;
  const color = ind.group === 'fear' && ind.key === '^VIX'
    ? (isUp ? '#f43f5e' : '#00E5A0')   // VIX up = bad
    : (isUp ? '#00E5A0' : '#f43f5e');

  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 bg-bg-1 rounded-xl border border-border hover:border-border-strong transition-all">
      <span className="text-[8px] text-slate-600 tracking-widest uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
        {ind.label}
      </span>
      <span className="text-[14px] font-black text-slate-100" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
        {fmtValue(ind.value, ind.suffix, ind.group)}
      </span>
      <span className="text-[9px] font-bold" style={{ color, fontFamily: 'var(--font-mono)' }}>
        {fmtChange(ind)}
      </span>
    </div>
  );
}

// ─── Indicator group ──────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  yields:      'TREASURY YIELDS',
  indices:     'US INDICES',
  fear:        'VOLATILITY & DOLLAR',
  commodities: 'COMMODITIES',
};

function IndicatorGroup({ group, indicators }: { group: string; indicators: Indicator[] }) {
  if (!indicators.length) return null;
  return (
    <div>
      <div className="text-[8px] tracking-[2px] text-slate-600 uppercase mb-2 px-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
        {GROUP_LABELS[group] ?? group}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {indicators.map(ind => <IndicatorTile key={ind.key} ind={ind} />)}
      </div>
    </div>
  );
}

// ─── Indicator skeleton ───────────────────────────────────────────────────────

function IndicatorSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, gi) => (
        <div key={gi} className="space-y-1.5">
          <div className="h-2 bg-bg-3 rounded w-20 animate-pulse mb-2" />
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-bg-3 rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── News item ────────────────────────────────────────────────────────────────

function NewsRow({ item }: { item: NewsItem }) {
  const ago = timeAgo(item.publishedAt);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-border hover:bg-bg-2 transition-all group cursor-pointer"
    >
      {/* Source badge */}
      <span
        className="text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 whitespace-nowrap"
        style={{
          background: item.sourceColor + '22',
          color:      item.sourceColor,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.3px',
        }}
      >
        {item.source.toUpperCase().replace(' ', '\u00A0')}
      </span>

      {/* Headline */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-slate-300 group-hover:text-slate-100 leading-snug transition-colors font-medium">
          {item.title}
        </div>
        {item.summary && (
          <div className="text-[9px] text-slate-600 mt-0.5 truncate" style={{ fontFamily: 'var(--font-mono)' }}>
            {item.summary.slice(0, 120)}
          </div>
        )}
      </div>

      {/* Time + arrow */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>{ago}</span>
        <svg
          width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#475569" strokeWidth="1.8"
          className="group-hover:stroke-slate-300 transition-colors"
        >
          <path d="M2.5 2.5h7v7M9.5 2.5l-7 7" />
        </svg>
      </div>
    </a>
  );
}

// ─── News skeleton ────────────────────────────────────────────────────────────

function NewsSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
          <div className="w-14 h-4 bg-bg-3 rounded flex-shrink-0" />
          <div className="flex-1 h-4 bg-bg-3 rounded" />
          <div className="w-6 h-3 bg-bg-3 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type NewsFilter = 'all' | 'markets' | 'crypto';

export function WorldMonitor() {
  const [newsFilter, setNewsFilter] = useState<NewsFilter>('all');
  const [clock, setClock] = useState(clockNow());

  // Tick the clock every second
  useEffect(() => {
    const t = setInterval(() => setClock(clockNow()), 1_000);
    return () => clearInterval(t);
  }, []);

  // Market indicators — refresh every 60s
  const { data: indData, isLoading: indLoading, dataUpdatedAt: indUpdated } = useQuery({
    queryKey:        ['indicators'],
    queryFn:         fetchIndicators,
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           2,
  });

  // News — refresh every 60s
  const { data: newsData, isLoading: newsLoading, dataUpdatedAt: newsUpdated } = useQuery({
    queryKey:        ['news'],
    queryFn:         fetchNews,
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           2,
  });

  const indicators = indData?.indicators ?? [];
  const articles   = newsData?.articles   ?? [];

  // Group indicators
  const byGroup: Record<string, Indicator[]> = {};
  for (const ind of indicators) {
    if (!byGroup[ind.group]) byGroup[ind.group] = [];
    byGroup[ind.group].push(ind);
  }

  // Filter news
  const filteredNews = newsFilter === 'all'
    ? articles
    : articles.filter(a => a.category === newsFilter);

  const lastUpdated = indUpdated || newsUpdated;
  const secAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1_000) : null;

  return (
    <div className="space-y-6">

      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[18px] font-black text-slate-100 tracking-tight">World Monitor</div>
            <div className="text-[9px] text-slate-600 mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              Financial markets · Economic data · Live news
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-1 border border-border">
            <div className="live-dot" />
            <span className="text-[10px] font-bold text-cyan-400" style={{ fontFamily: 'var(--font-mono)' }}>
              {clock}
            </span>
          </div>
          {secAgo !== null && (
            <span className="text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
              updated {secAgo}s ago
            </span>
          )}
        </div>
      </div>

      {/* ── Market Indicators ─────────────────────────────────────────────── */}
      <div>
        <div className="text-[9px] tracking-[2px] text-slate-500 uppercase mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          Market Pulse
        </div>
        {indLoading ? (
          <IndicatorSkeleton />
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {(['yields', 'indices', 'fear', 'commodities'] as const).map(g => (
              <IndicatorGroup key={g} group={g} indicators={byGroup[g] ?? []} />
            ))}
          </div>
        )}
      </div>

      {/* ── News Feed ─────────────────────────────────────────────────────── */}
      <div>
        {/* News header + filter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-[9px] tracking-[2px] text-slate-500 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
              Latest News
            </div>
            <div className="flex gap-1">
              {(['all', 'markets', 'crypto'] as NewsFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setNewsFilter(f)}
                  className={`text-[8px] px-2 py-0.5 rounded transition-all border ${
                    newsFilter === f
                      ? 'bg-bg-3 text-slate-200 border-border-strong'
                      : 'text-slate-600 border-border hover:text-slate-400'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
            <span>{filteredNews.length} articles</span>
            <span>·</span>
            <span>Reuters · AP · CNBC · CoinDesk · CoinTelegraph</span>
          </div>
        </div>

        {/* News list */}
        <div className="rounded-xl border border-border bg-bg-1 overflow-hidden">
          {newsLoading ? (
            <NewsSkeleton />
          ) : filteredNews.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-[11px]">
              No articles found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNews.map((item, i) => (
                <NewsRow key={`${item.url}-${i}`} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Sources attribution */}
        <div className="mt-2 text-[8px] text-slate-700 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
          Data: Reuters · AP News · CNBC · Yahoo Finance · CoinDesk · CoinTelegraph · WSJ Markets
          · refreshes every 60s · links open original source
        </div>
      </div>
    </div>
  );
}
