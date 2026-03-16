export function fmtPrice(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 100_000) return '$' + Math.round(n).toLocaleString('en-US');
  if (n >= 1_000)   return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)       return '$' + n.toFixed(4);
  if (n >= 0.01)    return '$' + n.toFixed(5);
  return '$' + n.toFixed(8);
}

export function fmtUSD(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '$0';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + n.toFixed(2);
}

export function fmtPct(n: number | null | undefined, dec = 2): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(dec) + '%';
}

export function fmtAddr(addr: string): string {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export function fmtAmount(n: number, decimals = 4): string {
  if (!n) return '0';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(Math.min(decimals, 4));
  return n.toFixed(8);
}

export function fgColor(val: number): string {
  if (val <= 20) return '#f43f5e';
  if (val <= 40) return '#f97316';
  if (val <= 60) return '#eab308';
  if (val <= 80) return '#84cc16';
  return '#00E5A0';
}
