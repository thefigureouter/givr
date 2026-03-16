export function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatCents(cents: number): string {
  if (cents < 100) return `¢${cents}`;
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function totalCents(donations: { amountCents: number }[]): number {
  return donations.reduce((sum, d) => sum + d.amountCents, 0);
}

export function uniqueCharityIds(donations: { charityId: string }[]): string[] {
  return [...new Set(donations.map((d) => d.charityId))];
}

export function groupByMonth<T extends { donatedAt: string }>(donations: T[]): Record<string, T[]> {
  return donations.reduce<Record<string, T[]>>((acc, d) => {
    const key = new Date(d.donatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    acc[key] = acc[key] ?? [];
    acc[key].push(d);
    return acc;
  }, {});
}

export function toUTCMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
