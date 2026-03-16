import {
  randomId,
  formatCents,
  formatDollars,
  totalCents,
  uniqueCharityIds,
  groupByMonth,
  toUTCMidnight,
} from '@/lib/utils';

describe('randomId', () => {
  test('returns a non-empty string', () => {
    expect(randomId()).toBeTruthy();
  });

  test('returns unique values', () => {
    expect(randomId()).not.toBe(randomId());
  });
});

describe('formatCents', () => {
  test('formats cents below 100 as pennies', () => {
    expect(formatCents(25)).toBe('¢25');
    expect(formatCents(99)).toBe('¢99');
  });

  test('formats whole dollars without decimals', () => {
    expect(formatCents(100)).toBe('$1');
    expect(formatCents(1000)).toBe('$10');
    expect(formatCents(500)).toBe('$5');
  });

  test('formats non-whole amounts with decimals', () => {
    expect(formatCents(150)).toBe('$1.50');
  });
});

describe('formatDollars', () => {
  test('always includes two decimals', () => {
    expect(formatDollars(1000)).toBe('$10.00');
    expect(formatDollars(150)).toBe('$1.50');
  });
});

describe('totalCents', () => {
  test('returns 0 for empty array', () => {
    expect(totalCents([])).toBe(0);
  });

  test('sums amounts correctly', () => {
    expect(totalCents([{ amountCents: 100 }, { amountCents: 250 }])).toBe(350);
  });
});

describe('uniqueCharityIds', () => {
  test('returns empty for empty array', () => {
    expect(uniqueCharityIds([])).toEqual([]);
  });

  test('deduplicates charity IDs', () => {
    const donations = [
      { charityId: 'a' },
      { charityId: 'b' },
      { charityId: 'a' },
    ];
    expect(uniqueCharityIds(donations)).toEqual(['a', 'b']);
  });
});

describe('groupByMonth', () => {
  test('groups donations by month', () => {
    const donations = [
      { donatedAt: '2024-01-05T00:00:00Z', id: '1' },
      { donatedAt: '2024-01-20T00:00:00Z', id: '2' },
      { donatedAt: '2024-02-10T00:00:00Z', id: '3' },
    ];
    const groups = groupByMonth(donations);
    const keys = Object.keys(groups);
    expect(keys).toHaveLength(2);
    expect(groups[keys[0]]).toHaveLength(2);
    expect(groups[keys[1]]).toHaveLength(1);
  });

  test('returns empty object for empty array', () => {
    expect(groupByMonth([])).toEqual({});
  });
});

describe('toUTCMidnight', () => {
  test('strips time component', () => {
    const d = new Date('2026-03-16T15:30:00Z');
    const result = toUTCMidnight(d);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });

  test('preserves date', () => {
    const d = new Date('2026-03-16T23:59:00Z');
    const result = toUTCMidnight(d);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(2); // March = 2 (0-indexed)
    expect(result.getUTCDate()).toBe(16);
  });
});
