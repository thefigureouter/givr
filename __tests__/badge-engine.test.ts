import { checkForNewBadges } from '@/lib/badge-engine';
import type { Donation, BadgeType } from '@/types';

function makeDonation(charityId: string, amountCents: number): Donation {
  return {
    id: Math.random().toString(),
    userId: 'u1',
    charityId,
    amountCents,
    tipCents: 0,
    feeCents: 0,
    totalCents: amountCents,
    charityReceivesCents: amountCents,
    currency: 'usd',
    status: 'SUCCEEDED',
    privacyMode: 'PUBLIC',
    idempotencyKey: 'k',
    donatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

describe('checkForNewBadges', () => {
  test('awards FIRST_DONATION on first donation', () => {
    const result = checkForNewBadges([makeDonation('c1', 100)], 1, []);
    expect(result).toContain('FIRST_DONATION');
  });

  test('does not re-award already earned badges', () => {
    const earned: BadgeType[] = ['FIRST_DONATION'];
    const result = checkForNewBadges([makeDonation('c1', 100)], 1, earned);
    expect(result).not.toContain('FIRST_DONATION');
  });

  test('awards STREAK_7 when streak reaches 7', () => {
    const result = checkForNewBadges([makeDonation('c1', 100)], 7, []);
    expect(result).toContain('STREAK_7');
  });

  test('does not award STREAK_7 when streak is 6', () => {
    const result = checkForNewBadges([makeDonation('c1', 100)], 6, []);
    expect(result).not.toContain('STREAK_7');
  });

  test('awards STREAK_30 when streak reaches 30', () => {
    const result = checkForNewBadges([makeDonation('c1', 100)], 30, []);
    expect(result).toContain('STREAK_30');
  });

  test('awards CAUSES_5 when 5 unique causes supported', () => {
    const donations = ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => makeDonation(id, 100));
    const result = checkForNewBadges(donations, 1, []);
    expect(result).toContain('CAUSES_5');
  });

  test('does not award CAUSES_5 with only 4 unique causes', () => {
    const donations = ['c1', 'c2', 'c3', 'c4'].map((id) => makeDonation(id, 100));
    const result = checkForNewBadges(donations, 1, []);
    expect(result).not.toContain('CAUSES_5');
  });

  test('awards DONATED_100 when total reaches $100', () => {
    const donations = Array(10).fill(null).map(() => makeDonation('c1', 1000));
    const result = checkForNewBadges(donations, 1, []);
    expect(result).toContain('DONATED_100');
  });

  test('does not award DONATED_100 below $100', () => {
    const donations = [makeDonation('c1', 9999)];
    const result = checkForNewBadges(donations, 1, []);
    expect(result).not.toContain('DONATED_100');
  });

  test('returns empty array when no new badges earned', () => {
    const result = checkForNewBadges([], 0, []);
    expect(result).toEqual([]);
  });

  test('returns multiple badges when multiple conditions met', () => {
    const donations = ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => makeDonation(id, 2000));
    const result = checkForNewBadges(donations, 7, []);
    expect(result).toContain('FIRST_DONATION');
    expect(result).toContain('STREAK_7');
    expect(result).toContain('CAUSES_5');
    expect(result).toContain('DONATED_100');
  });
});
