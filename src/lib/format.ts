const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function money(value: number): string {
  return usd.format(Number.isFinite(value) ? value : 0);
}

export function moneyShort(value: number): string {
  return usdCompact.format(Number.isFinite(value) ? value : 0);
}

export function percent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value >= 0 ? '' : '-'}${Math.abs(Math.round(value))}%`;
}

export function parseAmount(input: string): number {
  const n = Number.parseFloat(input.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}
