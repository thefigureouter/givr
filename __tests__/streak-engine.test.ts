import { calculateStreak, getStreakStatus } from '@/lib/streak-engine';

// All tests use fixed UTC dates to avoid timezone flakiness
const today = new Date('2026-03-16T12:00:00Z');
const yesterday = new Date('2026-03-15T22:00:00Z');
const twoDaysAgo = new Date('2026-03-14T10:00:00Z');
const farPast = new Date('2025-01-01T00:00:00Z');

// Freeze time for all tests
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(today);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('calculateStreak', () => {
  test('returns streak of 1 when no previous donation', () => {
    const result = calculateStreak(null, 0);
    expect(result).toEqual({ newStreak: 1, isExtended: false, isBroken: false });
  });

  test('is idempotent when last donation was today', () => {
    const result = calculateStreak(today, 5);
    expect(result).toEqual({ newStreak: 5, isExtended: false, isBroken: false });
  });

  test('increments streak when last donation was yesterday', () => {
    const result = calculateStreak(yesterday, 5);
    expect(result).toEqual({ newStreak: 6, isExtended: true, isBroken: false });
  });

  test('resets to 1 when last donation was 2 days ago', () => {
    const result = calculateStreak(twoDaysAgo, 10);
    expect(result).toEqual({ newStreak: 1, isExtended: false, isBroken: true });
  });

  test('resets to 1 when last donation was far in the past', () => {
    const result = calculateStreak(farPast, 100);
    expect(result).toEqual({ newStreak: 1, isExtended: false, isBroken: true });
  });

  test('handles yesterday at end of day UTC correctly', () => {
    const endOfYesterday = new Date('2026-03-15T23:59:59Z');
    const result = calculateStreak(endOfYesterday, 3);
    expect(result).toEqual({ newStreak: 4, isExtended: true, isBroken: false });
  });

  test('handles today at start of day UTC correctly', () => {
    const startOfToday = new Date('2026-03-16T00:00:01Z');
    const result = calculateStreak(startOfToday, 7);
    expect(result).toEqual({ newStreak: 7, isExtended: false, isBroken: false });
  });
});

describe('getStreakStatus', () => {
  test('returns new for 0', () => {
    expect(getStreakStatus(0)).toBe('new');
  });

  test('returns building for 1-6', () => {
    expect(getStreakStatus(1)).toBe('building');
    expect(getStreakStatus(6)).toBe('building');
  });

  test('returns hot for 7-29', () => {
    expect(getStreakStatus(7)).toBe('hot');
    expect(getStreakStatus(29)).toBe('hot');
  });

  test('returns legendary for 30+', () => {
    expect(getStreakStatus(30)).toBe('legendary');
    expect(getStreakStatus(365)).toBe('legendary');
  });
});
